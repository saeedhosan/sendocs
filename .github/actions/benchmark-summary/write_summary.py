import glob
import json
import os
import re
from datetime import datetime, timezone

GROUP_NAMES = [
    ("landing", "Landing", 1),
    ("auth", "Authentication", 2),
    ("client", "Client portal", 2),
    ("owner", "Owner portal", 2),
]

TABLE_HEADER = "| Workload       | Throughput (RPS) | Avg. latency |  p95 latency | Failures | Coverage |"
TABLE_DIVIDER = "| -------------- | ---------------: | -----------: | -----------: | -------: | -------: |"


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


def format_duration(value):
    text = str(value or "")
    match = re.fullmatch(r"(\d+(?:\.\d+)?)(ms|s|m|h)", text)
    if not match:
        return text or "—"
    amount, unit = match.groups()
    if unit == "ms":
        return f"{amount} ms"
    label = {"s": "second", "m": "minute", "h": "hour"}[unit]
    return f"{amount} {label}" + ("" if float(amount) == 1 else "s")


def format_number(value, suffix=""):
    return "—" if value is None else f"{value:,.2f}{suffix}"


def format_timestamp(value):
    text = str(value or "").replace("Z", "+00:00")
    try:
        parsed = datetime.fromisoformat(text)
    except ValueError:
        parsed = datetime.now(timezone.utc)
    if parsed.tzinfo is not None:
        parsed = parsed.astimezone(timezone.utc)
    return parsed.strftime("%Y-%m-%d %H:%M:%S UTC")


def vus_label(vus):
    if vus >= 1000 and vus % 1000 == 0:
        return f"{vus // 1000}k"
    return f"{vus:,}"


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
    evidence = f"[Workflow run]({run_url})" if run_url else "Local run"

    lines = [
        f"### Load test - {vus_label(vus)} virtual users - {format_timestamp(sample.get('started_at'))}",
        "",
        TABLE_HEADER,
        TABLE_DIVIDER,
    ]

    for group, name, routes in GROUP_NAMES:
        summary = summaries.get(group)
        if summary is None:
            continue
        requests = metric(summary, "workload_http_requests", "count") or 0
        seconds = duration_seconds(duration)
        throughput = requests / seconds if seconds else None
        average = metric(summary, "workload_http_req_duration", "avg")
        p95 = metric(summary, "workload_http_req_duration", "p(95)")
        failures = metric(summary, "workload_http_failed", "rate")
        coverage = f"{routes} route" + ("" if routes == 1 else "s")
        lines.append(
            f"| {name:<14} | {format_number(throughput):>16} | "
            f"{format_number(average, ' ms'):>12} | {format_number(p95, ' ms'):>12} | "
            f"{format_number(None if failures is None else failures * 100, '%'):>8} | "
            f"{coverage:>8} |"
        )

    lines.extend([
        "",
        "Environment: " + " · ".join([
            environment.get("os", "Unknown"),
            environment.get("cpu_model", "Unknown"),
            f"{environment.get('cpu_count', 'Unknown')} vCPU",
            f"{environment.get('memory_gib', 'Unknown')} GiB RAM",
        ]) + " <br>",
        f"GitHub runner · {vus} concurrent virtual users · {format_duration(duration)} · {evidence}",
    ])

    report = "\n".join(lines) + "\n"
    with open(os.path.join(results_directory, "benchmark-combined.md"), "w", encoding="utf-8") as combined_file:
        combined_file.write(report)

with open(os.environ["GITHUB_STEP_SUMMARY"], "a", encoding="utf-8") as summary_file:
    summary_file.write(report)
