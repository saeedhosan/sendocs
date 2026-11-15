#!/usr/bin/env python3
"""Append the latest generated benchmark entry to docs/benchmark.md."""

from pathlib import Path

ENTRY = Path("scalability-results/benchmark-entry.md")
DOCUMENT = Path("docs/benchmark.md")


def main():
    if not ENTRY.exists():
        raise SystemExit("No benchmark entry was generated; skipping publication.")

    entry = ENTRY.read_text(encoding="utf-8").strip()
    if not entry:
        raise SystemExit("Benchmark entry is empty; refusing to publish.")

    DOCUMENT.parent.mkdir(parents=True, exist_ok=True)
    if DOCUMENT.exists():
        current = DOCUMENT.read_text(encoding="utf-8").rstrip()
    else:
        current = "# Benchmark"

    marker = entry.splitlines()[0]
    if marker in current:
        print("This workflow run is already recorded.")
        return

    DOCUMENT.write_text(f"{current}\n\n{entry}\n", encoding="utf-8")
    print(f"Appended benchmark result to {DOCUMENT}")


if __name__ == "__main__":
    main()
