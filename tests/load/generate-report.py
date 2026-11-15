#!/usr/bin/env python3
"""Create one concise, dated benchmark entry from a k6 summary export."""

import json
import os
from datetime import datetime, timezone
from pathlib import Path

RESULTS = Path("scalability-results")
SUMMARY = RESULTS / "k6-summary.json"
ENVIRONMENT = RESULTS / "environment.txt"
ENTRY = RESULTS / "benchmark-entry.md"


def read_environment():
    values = {}
    if ENVIRONMENT.exists():
        for line in ENVIRONMENT.read_text(encoding="utf-8").splitlines():
            if "=" in line:
                key, value = line.split("=", 1)
                values[key.strip()] = value.strip()
    return values


def metric(metrics, name):
    value = metrics.get(name, {})
    return value if isinstance(value, dict) else {}


def fmt_number(value, digits=0):
    return "N/A" if value is None else f"{value:,.{digits}f}"


def main():
    summary = {}
    if SUMMARY.exists():
        try:
            summary = json.loads(SUMMARY.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            pass

    metrics = summary.get("metrics", {})
    env = read_environment()
    checks = metric(metrics, "checks")
    failed = metric(metrics, "http_req_failed")
    duration = metric(metrics, "http_req_duration")
    requests = metric(metrics, "http_reqs")
    iterations = metric(metrics, "iterations")
    journey = metric(metrics, "iteration_duration")

    passed = checks.get("passes", 0)
    total_checks = passed + checks.get("fails", 0)
    check_rate = passed / total_checks * 100 if total_checks else None
    error_rate = failed.get("value")
    error_text = f"{error_rate * 100:.2f}%" if isinstance(error_rate, (int, float)) else "N/A"

    job_status = os.getenv("JOB_STATUS", "unknown").lower()
    outcome = "Passed" if job_status == "success" else "Failed" if job_status == "failure" else "Inconclusive"
    run_id = os.getenv("GITHUB_RUN_ID", "unknown")
    repository = os.getenv("GITHUB_REPOSITORY", "")
    server = os.getenv("GITHUB_SERVER_URL", "https://github.com")
    commit = env.get("commit", os.getenv("GITHUB_SHA", ""))
    commit_short = commit[:7] if commit else "unknown"
    run_url = f"{server}/{repository}/actions/runs/{run_id}"
    commit_url = f"{server}/{repository}/commit/{commit}" if commit else f"{server}/{repository}"

    lines = [
        f"<!-- benchmark-run: {run_id} -->",
        f"### Results — {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}",
        "",
        f"**Outcome:** {outcome}  ",
        f"**Scenario:** {os.getenv('BENCHMARK_SCENARIO', 'Not specified')}  ",
        f"**DAU target:** {os.getenv('BENCHMARK_DAU_TARGET', 'Not tested')}  ",
        f"**Workload:** {os.getenv('BENCHMARK_WORKLOAD', 'Not specified')}  ",
        f"**Commit:** [`{commit_short}`]({commit_url}) · [Workflow run]({run_url})",
        "",
        "| Metric | Result |",
        "|---|---:|",
        f"| HTTP requests | {fmt_number(requests.get('count'))} |",
        f"| Iterations | {fmt_number(iterations.get('count'))} |",
        f"| Average latency | {fmt_number(duration.get('avg'), 1)} ms |",
        f"| p95 latency | {fmt_number(duration.get('p(95)'), 1)} ms |",
        f"| HTTP error rate | {error_text} |",
        f"| Functional checks | {passed}/{total_checks} ({fmt_number(check_rate, 1)}%) |" if total_checks else "| Functional checks | N/A |",
        f"| Average journey duration | {fmt_number(journey.get('avg'), 1)} ms |",
        "",
        f"**Runner:** {env.get('runner', 'N/A')} · {env.get('cpu_count', 'N/A')} vCPU · {env.get('memory_gb', 'N/A')} GB RAM",
        "",
        "> Results describe this workload on a shared GitHub-hosted runner. A functional baseline is not evidence of DAU capacity or production-server capacity.",
        "",
    ]

    RESULTS.mkdir(parents=True, exist_ok=True)
    ENTRY.write_text("\n".join(lines), encoding="utf-8")
    print(f"Generated {ENTRY}")


if __name__ == "__main__":
    main()
