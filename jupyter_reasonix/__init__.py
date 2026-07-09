"""jupyter-reasonix — Reasonix Chat for Jupyter Lab"""
from ._version import __version__


def _jupyter_server_extension_points():
    return [{"module": "jupyter_reasonix"}]


def load_jupyter_server_extension(serverapp):
    """Called when the extension is loaded."""
    from jupyter_reasonix.handlers import setup_handlers
    setup_handlers(serverapp.web_app)
    serverapp.log.info("✅ jupyter-reasonix extension loaded")
    serverapp.log.info("   Reasonix Chat: /reasonix/")
