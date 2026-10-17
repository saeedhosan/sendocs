#!/usr/bin/env python3
"""Configure the static frontend CSP for the API origin used by a deployment."""

from __future__ import annotations

import sys
from pathlib import Path
from urllib.parse import urlsplit

PLACEHOLDER = "__API_ORIGIN__"
CONNECT_PREFIX = "connect-src 'self' "


def main() -> int:
    if len(sys.argv) != 3:
        print(
            "Usage: configure-csp.py <htaccess-path> <api-url>",
            file=sys.stderr,
        )
        return 2

    policy_path = Path(sys.argv[1])
    api_url = sys.argv[2]
    parsed = urlsplit(api_url)

    if (
        parsed.scheme != "https"
        or not parsed.hostname
        or parsed.username is not None
        or parsed.password is not None
        or parsed.path not in ("", "/")
        or parsed.query
        or parsed.fragment
    ):
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

    connect_directives = [
        directive.strip()
        for directive in configured.split('"')
        if directive.strip().startswith(CONNECT_PREFIX)
    ]
    if len(connect_directives) != 1 or api_origin not in connect_directives[0].split():
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
