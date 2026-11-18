import os
import re
import subprocess

TITLE = "## Performance Metrics"

combined_path = os.environ.get("COMBINED_REPORT", "test_results/benchmark-combined.md")
history_ref = os.environ.get("HISTORY_REF", "refs/remotes/upstream/reports")
prepared_path = os.environ["PREPARED_HISTORY"]


def write_output(name, value):
    with open(os.environ["GITHUB_OUTPUT"], "a", encoding="utf-8") as output_file:
        output_file.write(f"{name}={value}\n")


write_output("prepared-history", prepared_path)

if not os.path.isfile(combined_path):
    print("No combined benchmark report was produced.")
else:
    repository = os.environ.get("GITHUB_REPOSITORY", "")
    if repository:
        server = os.environ.get("GITHUB_SERVER_URL", "https://github.com")
        subprocess.run(
            [
                "git",
                "fetch",
                "--no-tags",
                "--depth=1",
                f"{server}/{repository}.git",
                "refs/heads/reports:refs/remotes/upstream/reports",
            ],
            check=False,
            capture_output=True,
        )

    show = subprocess.run(
        ["git", "show", f"{history_ref}:docs/performance.md"],
        check=False,
        capture_output=True,
        text=True,
    )
    history = show.stdout.strip() if show.returncode == 0 else ""
    with open(combined_path, encoding="utf-8") as combined_file:
        combined = combined_file.read().strip()

    lines = combined.splitlines()
    marker = lines[0] if lines else ""
    changed = False

    if not history:
        history = TITLE
        changed = True
    elif not history.startswith(TITLE):
        history = f"{TITLE}\n\n{history}"
        changed = True

    if marker and marker not in history:
        body = history.split("\n", 1)[1].lstrip("\n") if "\n" in history else ""
        entries = [entry.strip("\n") for entry in re.split(r"(?m)^(?=### )", body) if entry.strip()]
        history = f"{TITLE}\n\n" + "\n\n".join([combined] + entries) + "\n"
        changed = True
    else:
        history = history.rstrip("\n") + "\n"

    with open(prepared_path, "w", encoding="utf-8") as prepared_file:
        prepared_file.write(history)

    if changed:
        write_output("appended", "true")
