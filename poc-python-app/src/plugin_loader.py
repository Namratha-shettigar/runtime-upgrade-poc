# ---------------------------------------------------------------------------
# plugin_loader — loads an extra Python file ("plugin") at run time and calls it.
#
# THE PROBLEM PLANTED HERE:
#   "imp" is Python's OLD module for loading code files. It was deprecated
#   for years and REMOVED in Python 3.12. On python3.12+ this file crashes
#   at the first line: "ModuleNotFoundError: No module named 'imp'".
#   The fix: use "importlib" (the modern replacement) instead.
# ---------------------------------------------------------------------------

# The old loader module (exists on 3.8, gone on 3.12+).
import imp
# "os" lets us build file paths that work on any computer.
import os

# The folder this file is in, so we can find the plugins folder next to it.
HERE = os.path.dirname(os.path.abspath(__file__))


def load_plugin(name):
    """Load src/plugins/<name>.py and return it as a module."""
    # Build the full path, e.g. /var/task/src/plugins/greeting.py
    path = os.path.join(HERE, "plugins", name + ".py")
    # imp.load_source reads that file and runs it as a module.
    return imp.load_source(name, path)


def handler(event, context):
    """Lambda entry point."""
    # Which plugin to run and for whom; defaults if the input has none.
    event = event or {}
    plugin = load_plugin(event.get("plugin", "greeting"))
    # Every plugin has a run() function; call it with the name from the input.
    return {"result": plugin.run(event.get("name", "7EDGE"))}
