# ---------------------------------------------------------------------------
# version_check — says whether a client app version is new enough, with a timestamp.
#
# THE PROBLEMS PLANTED HERE:
#   1. "distutils" was REMOVED in Python 3.12, so the import below crashes:
#      "ModuleNotFoundError: No module named 'distutils'".
#      Fix: use "packaging.version.Version" (a pip package) instead.
#   2. datetime.utcnow() is DEPRECATED since 3.12. It still runs but prints
#      a warning, and it will be removed later.
#      Fix: datetime.now(timezone.utc).
# ---------------------------------------------------------------------------

# LooseVersion compares versions properly: "1.10" is newer than "1.9".
# (A plain text comparison would get that wrong.)
from distutils.version import LooseVersion
# datetime gives us the current date and time.
from datetime import datetime

# The oldest client app version we still accept.
MINIMUM_VERSION = "2.4.0"


def is_supported(version):
    """True if 'version' is the same as or newer than MINIMUM_VERSION."""
    return LooseVersion(version) >= LooseVersion(MINIMUM_VERSION)


def handler(event, context):
    """Lambda entry point."""
    # The version to check, from the input (default "2.10.1").
    version = (event or {}).get("version", "2.10.1")
    return {
        "version": version,
        "supported": is_supported(version),
        # Current time in UTC, written like "2026-10-20T10:15:00".
        "checked_at": datetime.utcnow().isoformat(timespec="seconds"),
    }
