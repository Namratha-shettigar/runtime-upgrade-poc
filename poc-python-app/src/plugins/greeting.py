# A tiny example "plugin" that plugin_loader.py loads at run time.


def run(name):
    """Return a greeting for the given name."""
    return "Hello, " + name + "!"
