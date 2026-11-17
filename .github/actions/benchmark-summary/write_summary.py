import glob
import json
import os
from datetime import datetime, timezone

GROUP_NAMES = [
    ("landing", "Landing"),
    ("auth", "Authentication"),
    ("client", "Client portal"),
    ("owner", "Owner portal"),
]


def metric(summary, name, key):
    return summary.get("metrics", {}).get(name, {}).get("values", {}).get(key)


def duration_seconds(value):
    text = str(value or "")
    units = {"ms": 0.001, "s": 1, "m": 60, "h": 3600}
    for suffix, multiplier in units.items():
        if text.endswith(suffix):
            try:
                return float(text[:-len(suffix)]) * multiplier
            except ValueError:
                return None
    return None


def format_value(value):
    return "—" if value is None else f"{value:.2f}"


def format_duration(value):
    seconds = duration_seconds(value)
    if seconds is None:
        return str(value or "—")
    for size, label in [(86400, "day"), (3600, "hour"), (60, "minute"), (1, "second")]:
        if seconds >= size:
            amount = round(seconds / size, 1)
            if amount.is_integer():
                amount = int(amount)
            return f"{amount:g} {label}" + ("" if amount == 1 else "s")
    return "0 seconds"


results_directory = os.environ.get("RESULTS_DIRECTORY", "test_results")
os.makedirs(results_directory, exist_ok=True)
summaries = {}
for path in glob.glob(os.path.join(results_directory, "k6-summary-*.json")):
    group = path.rsplit("-", 1)[-1].removesuffix(".json")
    with open(path, encoding="utf-8") as handle:
        summaries[group] = json.load(handle)

if not summaries:
    report = "_No benchmark reports were produced._\n"
else:
    sample = next(iter(summaries.values()))
    options = sample.get("options", {})
    scenario = options.get("scenarios", {}).get("workload", {})
    vus = sample.get("target_vus", scenario.get("vus", 0))
    duration = sample.get("test_duration", scenario.get("duration", "60s"))
    environment = sample.get("environment", {})
    server = os.environ.get("GITHUB_SERVER_URL", "https://github.com")
    repository = os.environ.get("GITHUB_REPOSITORY", "")
    run_id = os.environ.get("GITHUB_RUN_ID", "")
    run_url = f"{server}/{repository}/actions/runs/{run_id}" if repository else ""
    timestamp = sample.get("started_at") or datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    env_parts = [
        environment.get("os", "Unknown"),
        environment.get("cpu_model", "Unknown"),
        f"{environment.get('cpu_count', 'Unknown')} vCPU",
        f"{environment.get('memory_gib', 'Unknown')} GiB RAM",
    ]

    lines = [
        f"### Results — {vus:,} VUs - {timestamp}",
        "",
        f"- **Target load:** {vus:,} VUs · {format_duration(duration)}",
        "- **Environment:** GitHub runner (" + " · ".join(env_parts) + ")",
        "- **Evidence:** " + (f"[Workflow run]({run_url})" if run_url else "Local run"),
        "",
        "| Workload       | Throughput (req/s) | Avg response (ms) | p95 (ms) | Failures (%) |",
        "| -------------- | -----------------: | ----------------: | -------: | -----------: |",
    ]

    for group, name in GROUP_NAMES:
        summary = summaries.get(group)
        if summary is None:
            continue
        requests = metric(summary, "workload_http_requests", "count") or 0
        seconds = duration_seconds(duration)
        throughput = requests / seconds if seconds else None
        average = metric(summary, "workload_http_req_duration", "avg")
        p95 = metric(summary, "workload_http_req_duration", "p(95)")
        failures = metric(summary, "workload_http_failed", "rate")
        lines.append(
            f"| {name} | {format_value(throughput)} | {format_value(average)} | "
            f"{format_value(p95)} | {format_value(None if failures is None else failures * 100)} |"
        )

    report = "\n".join(lines) + "\n"
    with open(os.path.join(results_directory, "benchmark-combined.md"), "w", encoding="utf-8") as combined_file:
        combined_file.write(report)

with open(os.environ["GITHUB_STEP_SUMMARY"], "a", encoding="utf-8") as summary_file:
    summary_file.write(report)
