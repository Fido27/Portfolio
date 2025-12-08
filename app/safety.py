"""Minimal safety heuristics so dangerous commands emit clear warnings."""

from __future__ import annotations

import re
from typing import Iterable, Tuple

RAW_DANGEROUS_PATTERNS: Tuple[str, ...] = (
    r"\brm\s+-(?:[A-Za-z]*r[A-Za-z]*f[A-Za-z]*|[A-Za-z]*f[A-Za-z]*r[A-Za-z]*|[A-Za-z]*rf)\s+/(?:\s|$)",
    r"\brm\s+-[A-Za-z]*rf\s+\*",
    r"\brm\s+-[A-Za-z]*rf\s+~",
    r":\(\)\s*{\s*:\s*\|\s*:\s*;\s*}\s*;?\s*:?",
    r"\bdd\s+if=",
    r"\bdd\s+of=/dev/(?:sd[a-z]\d*|nvme\d+n\d+p\d*|mmcblk\d+p?\d*)",
    r"\bmkfs\.\w+\s+/dev/(?:sd[a-z]\d*|nvme\d+n\d+p\d*|mmcblk\d+p?\d*)",
    r">\s*/dev/(?:sd[a-z]\d*|nvme\d+n\d+p\d*|mmcblk\d+p?\d*)",
    r"cat\s+/dev/zero\s+>\s+/dev/(?:sd[a-z]\d*|nvme\d+n\d+p\d*|mmcblk\d+p?\d*)",
    r"chmod\s+777\s+/(?:\s|$)",
    r"chown\s+-R\s+root\s+/(?:\s|$)",
    r"curl\s+[^|]+\|\s*(?:sudo\s+)?sh",
    r"wget\s+[^|]+\|\s*(?:sudo\s+)?sh",
    r"\bpoweroff\b",
    r"\bshutdown\s+-(?:h|P)\b",
    r"\bhalt\b",
    r"\binit\s+0\b",
    r"\bkill\s+-9\s+1\b",
)

DANGEROUS_PATTERNS: Tuple[re.Pattern[str], ...] = tuple(
    re.compile(pattern, re.IGNORECASE) for pattern in RAW_DANGEROUS_PATTERNS
)

__all__ = ["DANGEROUS_PATTERNS", "is_dangerous", "get_danger_warning", "list_patterns"]


def is_dangerous(command: str) -> bool:
    """Return True if the provided command triggers any dangerous heuristic."""
    normalized = " ".join(command.strip().split())
    return any(pattern.search(normalized) for pattern in DANGEROUS_PATTERNS)


def get_danger_warning() -> str:
    """Return a loud, bold, red Markdown/HTML snippet for dangerous commands."""
    return (
        "<div style=\"background:#2b0000;padding:16px;border:3px solid #ff1744;"
        "color:#ffebee;text-align:center;font-weight:700;font-size:1.1rem;\">"
        "<span style=\"color:#ff1744;\">⚠️ <strong>DANGEROUS COMMAND DETECTED</strong> ⚠️</span><br>"
        "<strong style=\"color:#ff1744;\">PROCEED ONLY IF YOU FULLY UNDERSTAND THE IMPACT.</strong>"
        "</div>"
    )


def list_patterns() -> Iterable[str]:
    """Expose the raw regex strings for testing or documentation."""
    return RAW_DANGEROUS_PATTERNS

