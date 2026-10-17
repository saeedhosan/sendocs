#!/usr/bin/env python3
"""Configure the static frontend CSP for the API origin used by a deployment."""

from __future__ import annotations

import sys
from pathlib import Path
from urllib.parse import urlsplit

PLACEHOLDER = "__API_ORIGIN__"


def main() -> int:
    if len(sys.argv) != 3:
        print("Usage: configure-csp.py <htaccess-path> <api-url>", file=sys.stderr)
        return 2

    policy_path = Path(sys.argv[1])
    api_url = sys.argv[2]

    try:
        parsed = urlsplit(api_url)
        valid_origin = (
            parsed.scheme == "https"
            and bool(parsed.hostname)
            and parsed.username is None
            and parsed.password is None
            and parsed.path in ("", "/")
            and not parsed.query
            and not parsed.fragment
            and (parsed.port is None or 0 < parsed.port < 65536)
        )
    except ValueError:
        valid_origin = False

    if not valid_origin:
        print(
            "API_URL must be an HTTPS origin without credentials, path, query, or fragment.",
            file=sys.stderr,
        )
        return 2

    api_origin = f"https://{parsed.netloc}"

    try:
        policy = policy_path.read_text(encoding="utf-8")
    except OSError as error:
        print(f"Cannot read CSP template {policy_path}: {error}", file=sys.stderr)
        return 2

    if policy.count(PLACEHOLDER) != 1:
        print(
            f"Expected exactly one {PLACEHOLDER} placeholder in {policy_path}.",
            file=sys.stderr,
        )
        return 1

    configured = policy.replace(PLACEHOLDER, api_origin)

    if f"connect-src 'self' {api_origin};" not in configured:
        print("Generated CSP does not allow the configured API origin.", file=sys.stderr)
        return 1

    if PLACEHOLDER in configured:
        print("CSP placeholder remains after configuration.", file=sys.stderr)
        return 1

    policy_path.write_text(configured, encoding="utf-8")
    print(f"Configured CSP for {api_origin}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
