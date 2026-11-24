# ---------------------------------------------------------------------------
# Automated tests, using Python's BUILT-IN "unittest" (nothing to install).
# Run from the project folder with:  python -m unittest discover -s tests -v
# In CI they run on the OLD and the NEW Python: they pass on 3.8 and fail on
# 3.12+. That failure is the early warning before anything reaches production.
# ---------------------------------------------------------------------------

import os
import sys
import unittest

# The project's main folder (one level above this tests folder).
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# Let the tests import our code ("src") as Lambda would.
sys.path.insert(0, os.path.join(ROOT, "src"))
# Let the tests import the layer's packages. In Lambda these are in /opt/python;
# on the laptop they're in layers/data/python.
sys.path.insert(0, os.path.join(ROOT, "layers", "data", "python"))


class ReportTest(unittest.TestCase):
    def test_summary(self):
        # Import here (not at the top) so one broken module fails only its own test.
        import report
        result = report.summarise(report.SAMPLE_SALES)
        # 1200 + 800 + 450 + 975 = 3425
        self.assertEqual(result["total"], 3425)
        # 3425 / 4 = 856.25
        self.assertEqual(result["average"], 856.25)
        # south = 1200 + 450 = 1650, the biggest.
        self.assertEqual(result["best_region"], "south")


class PluginLoaderTest(unittest.TestCase):
    def test_greeting_plugin(self):
        import plugin_loader
        result = plugin_loader.handler({"name": "Namratha"}, None)
        self.assertEqual(result, {"result": "Hello, Namratha!"})


class VersionCheckTest(unittest.TestCase):
    def test_versions(self):
        import version_check
        # "2.10.1" is newer than "2.4.0" (10 > 4), so it's supported.
        self.assertTrue(version_check.is_supported("2.10.1"))
        # "2.3.9" is older than "2.4.0", so it's not.
        self.assertFalse(version_check.is_supported("2.3.9"))


# Allows running this file directly: python tests/test_functions.py
if __name__ == "__main__":
    unittest.main()
