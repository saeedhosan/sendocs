#!/usr/bin/env python3
"""Generate a concise Markdown report from a k6 summary export."""

import json
import os
from datetime import datetime, timezone
from pathlib import Path

RESULTS = Path("scalability-results")
SUMMARY = RESULTS / "k6-summary.json"
ENVIRONMENT = RESULTS / "environment.txt"
REPORT = RESULTS / "results.md"


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
    if value is None:
        return "N/A"
    return f"{value:,.{digits}f}"


def main():
    summary = {}
    if SUMMARY.exists():
        try:
            summary = json.loads(SUMMARY.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            summary = {}

    metrics = summary.get("metrics", {})
    env = read_environment()
    checks = metric(metrics, "checks")
    http_failed = metric(metrics, "http_req_failed")
    duration = metric(metrics, "http_req_duration")
    requests = metric(metrics, "http_reqs")
    iterations = metric(metrics, "iterations")
    iteration_duration = metric(metrics, "iteration_duration")

    check_total = checks.get("passes", 0) + checks.get("fails", 0)
    check_rate = (checks.get("passes", 0) / check_total * 100) if check_total else None
    error_rate = http_failed.get("value")
    error_rate_text = f"{error_rate * 100:.2f}%" if isinstance(error_rate, (int, float)) else "N/A"

    job_status = os.getenv("JOB_STATUS", "unknown").lower()
    outcome = "Passed" if job_status == "success" else "Failed" if job_status == "failure" else "Inconclusive"
    run_url = os.getenv("GITHUB_SERVER_URL", "https://github.com") + "/" + os.getenv("GITHUB_REPOSITORY", "") + "/actions/runs/" + os.getenv("GITHUB_RUN_ID", "")
    run_url = run_url.rstrip("/")

    lines = [
        "# Scalability Test Results",
        "",
        f"**Outcome:** {outcome}  ",
        f"**Scenario:** {os.getenv('BENCHMARK_SCENARIO', 'Not specified')}  ",
        f"**DAU target:** {os.getenv('BENCHMARK_DAU_TARGET', 'Not tested')}  ",
        f"**Workload:** {os.getenv('BENCHMARK_WORKLOAD', 'Not specified')}  ",
        f"**Date (UTC):** {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S')}  ",
        f"**Commit:** [`{env.get('commit', os.getenv('GITHUB_SHA', 'unknown')[:7])}`]({os.getenv('GITHUB_SERVER_URL', 'https://github.com')}/{os.getenv('GITHUB_REPOSITORY', '')}/commit/{env.get('commit', os.getenv('GITHUB_SHA', ''))})  ",
        f"**Workflow run:** [View run]({run_url})",
        "",
        "## Results",
        "",
        "| Metric | Result |",
        "|---|---:|",
        f"| HTTP requests | {fmt_number(requests.get('count'))} |",
        f"| Iterations | {fmt_number(iterations.get('count'))} |",
        f"| Average latency | {fmt_number(duration.get('avg'), 1)} ms |",
        f"| p95 latency | {fmt_number(duration.get('p(95)'), 1)} ms |",
        f"| HTTP error rate | {error_rate_text} |",
        f"| Functional checks | {checks.get('passes', 0)}/{check_total} ({fmt_number(check_rate, 1)}%) |" if check_total else "| Functional checks | N/A |",
        f"| Average journey duration | {fmt_number(iteration_duration.get('avg'), 1)} ms |",
        "",
        "## Test environment",
        "",
        f"- GitHub-hosted runner: {env.get('runner', 'N/A')}",
        f"- CPU: {env.get('cpu_count', 'N/A')} vCPU",
        f"- Memory: {env.get('memory_gb', 'N/A')} GB",
        "",
        "> This result describes this workload on a shared GitHub-hosted runner. A functional baseline is not evidence of DAU capacity or production-server capacity.",
        "",
    ]

    RESULTS.mkdir(parents=True, exist_ok=True)
    REPORT.write_text("\n".join(lines), encoding="utf-8")
    print(f"Generated {REPORT}")


if __name__ == "__main__":
    main()
