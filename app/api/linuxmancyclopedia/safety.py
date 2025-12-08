"""Safety helpers for flagging destructive shell commands."""

from __future__ import annotations

import re
from typing import Iterable

DANGEROUS_PATTERNS: tuple[re.Pattern[str], ...] = tuple(
    re.compile(pattern, re.IGNORECASE)
    for pattern in (
        r"rm\s+-rf\s+/(?:\s|$)",
        r"rm\s+-rf\s+\*",
        r":\(\)\s*{\s*:\s*\|\s*:\s*;\s*};\s*",
        r"dd\s+if=",
        r"mkfs\.",
        r"chmod\s+777\s+/(?:\s|$)",
        r"chown\s+-R\s+root\s+/",
        r"curl\s+[^|]+\|\s*(?:sudo\s+)?sh",
        r"wget\s+[^|]+\|\s*(?:sudo\s+)?sh",
        r"poweroff\b",
        r"shutdown\s+-h\b",
        r"halt\b",
        r"kill\s+-9\s+1\b",
    )
)


def is_dangerous(command: str) -> bool:
    """Return True if the command matches any dangerous pattern."""
    normalized = command.strip()
    return any(pattern.search(normalized) for pattern in DANGEROUS_PATTERNS)


def get_danger_warning() -> str:
    """Return a markdown string containing a bold red warning banner."""
    return (
        '<div style="color:#ff1744;font-size:1.25rem;font-weight:700;">'
        "⚠️ <strong>DANGEROUS COMMAND DETECTED</strong> ⚠️"
        "</div>\nProceed only if you fully understand the consequences."
    )


def list_patterns() -> Iterable[str]:
    """Expose raw regex strings for testing/debugging."""
    return [pattern.pattern for pattern in DANGEROUS_PATTERNS]

