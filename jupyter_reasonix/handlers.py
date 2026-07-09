"""
jupyter_reasonix/handlers.py — SSH API handlers for Reasonix Chat.
Uses ssh_manager from ssh-ide-mcp for SSH operations.
"""

import json
import os
import sys
from pathlib import Path

# Import SSH manager from ssh-ide-mcp (must be installed)
try:
    from ssh_ide_mcp.ssh_manager import SSHConnectionManager
    from ssh_ide_mcp.kernel_manager import RemoteKernelManager
except ImportError:
    SSHConnectionManager = None
    RemoteKernelManager = None

from jupyter_server.base.handlers import APIHandler
from jupyter_server.utils import url_path_join
import tornado


# ── Global SSH Manager ──────────────────────────────────────────────────────

_manager = SSHConnectionManager() if SSHConnectionManager else None
_kernels = RemoteKernelManager(_manager) if SSHConnectionManager and RemoteKernelManager else None

STATIC_DIR = Path(__file__).parent / "static"


# ── Helper ──────────────────────────────────────────────────────────────────

def _require_ssh():
    if not SSHConnectionManager:
        raise tornado.web.HTTPError(500, "ssh-ide-mcp not installed. Run: pip install ssh-ide-mcp")


# ── Chat UI Handler ─────────────────────────────────────────────────────────

class ChatUIHandler(tornado.web.RequestHandler):
    """Serves the chat web UI."""

    def get(self):
        chat_path = STATIC_DIR / "chat.html"
        if chat_path.exists():
            self.write(chat_path.read_text(encoding="utf-8"))
        else:
            self.write("<h1>Reasonix Chat</h1><p>Chat UI not found</p>")


# ── API Handlers ────────────────────────────────────────────────────────────

class ConnectHandler(APIHandler):
    """SSH Connection"""

    @tornado.web.authenticated
    async def post(self):
        _require_ssh()
        data = self.get_json_body()
        try:
            r = _manager.connect(
                hostname=data["hostname"],
                username=data["username"],
                port=data.get("port", 22),
                password=data.get("password"),
                host_alias=data.get("host_alias"),
            )
            self.finalize({"success": True, "alias": r["alias"]})
        except Exception as e:
            self.finalize({"success": False, "error": str(e)})


class DisconnectHandler(APIHandler):
    @tornado.web.authenticated
    def post(self):
        _require_ssh()
        data = self.get_json_body()
        try:
            _manager.disconnect(data["alias"])
            self.finalize({"success": True})
        except Exception as e:
            self.finalize({"success": False, "error": str(e)})


class ExecHandler(APIHandler):
    @tornado.web.authenticated
    async def post(self):
        _require_ssh()
        data = self.get_json_body()
        try:
            r = _manager.exec(data["alias"], data["command"], timeout=data.get("timeout", 30))
            self.finalize(r)
        except Exception as e:
            self.finalize({"success": False, "error": str(e)})


class ReadFileHandler(APIHandler):
    @tornado.web.authenticated
    def get(self):
        _require_ssh()
        alias = self.get_argument("alias")
        path = self.get_argument("path")
        offset = int(self.get_argument("offset", "0"))
        limit = self.get_argument("limit", None)
        if limit:
            limit = int(limit)
        try:
            r = _manager.read_file(alias, path, offset, limit)
            self.finalize(r)
        except Exception as e:
            self.finalize({"success": False, "error": str(e)})


class WriteFileHandler(APIHandler):
    @tornado.web.authenticated
    async def post(self):
        _require_ssh()
        data = self.get_json_body()
        try:
            r = _manager.write_file(data["alias"], data["path"], data["content"])
            self.finalize({"success": True, "bytes": r["bytes_written"]})
        except Exception as e:
            self.finalize({"success": False, "error": str(e)})


class LsHandler(APIHandler):
    @tornado.web.authenticated
    def get(self):
        _require_ssh()
        alias = self.get_argument("alias")
        path = self.get_argument("path", ".")
        try:
            entries = _manager.ls(alias, path)
            self.finalize({"entries": entries})
        except Exception as e:
            self.finalize({"success": False, "error": str(e)})


class EnvironmentsHandler(APIHandler):
    @tornado.web.authenticated
    def get(self):
        _require_ssh()
        alias = self.get_argument("alias")
        try:
            envs = _manager.list_python_environments(alias)
            self.finalize({"environments": envs})
        except Exception as e:
            self.finalize({"success": False, "error": str(e)})


class ExecutePythonHandler(APIHandler):
    @tornado.web.authenticated
    async def post(self):
        _require_ssh()
        data = self.get_json_body()
        try:
            r = _kernels.execute_python(
                data["alias"], data["code"],
                python_bin=data.get("python_bin", "python3"),
                timeout=data.get("timeout", 60),
            )
            self.finalize(r)
        except Exception as e:
            self.finalize({"success": False, "error": str(e)})


class StatHandler(APIHandler):
    @tornado.web.authenticated
    def get(self):
        _require_ssh()
        alias = self.get_argument("alias")
        path = self.get_argument("path")
        try:
            r = _manager.stat(alias, path)
            self.finalize(r)
        except Exception as e:
            self.finalize({"success": False, "error": str(e)})


class GlobHandler(APIHandler):
    @tornado.web.authenticated
    def get(self):
        _require_ssh()
        alias = self.get_argument("alias")
        pattern = self.get_argument("pattern")
        workdir = self.get_argument("working_dir", ".")
        try:
            matches = _manager.glob(alias, pattern, workdir)
            self.finalize({"matches": matches})
        except Exception as e:
            self.finalize({"success": False, "error": str(e)})


# ── Route Setup ─────────────────────────────────────────────────────────────

class StaticHandler(tornado.web.RequestHandler):
    """Serves static files (chat.js)."""

    def get(self, filename):
        file_path = STATIC_DIR / filename
        if file_path.exists():
            c = file_path.read_bytes()
            if filename.endswith(".js"):
                self.set_header("Content-Type", "application/javascript")
            elif filename.endswith(".css"):
                self.set_header("Content-Type", "text/css")
            self.write(c)
        else:
            self.set_status(404)
            self.write("Not found")


def setup_handlers(web_app):
    """Register all handlers with the Jupyter server web app."""
    host_pattern = ".*$"
    base_url = web_app.settings.get("base_url", "/")

    handlers = [
        (url_path_join(base_url, "reasonix", "/?"), ChatUIHandler),
        (url_path_join(base_url, "reasonix", "static", "(.*)"), StaticHandler),
        (url_path_join(base_url, "reasonix", "api", "connect"), ConnectHandler),
        (url_path_join(base_url, "reasonix", "api", "disconnect"), DisconnectHandler),
        (url_path_join(base_url, "reasonix", "api", "exec"), ExecHandler),
        (url_path_join(base_url, "reasonix", "api", "read"), ReadFileHandler),
        (url_path_join(base_url, "reasonix", "api", "write"), WriteFileHandler),
        (url_path_join(base_url, "reasonix", "api", "ls"), LsHandler),
        (url_path_join(base_url, "reasonix", "api", "environments"), EnvironmentsHandler),
        (url_path_join(base_url, "reasonix", "api", "execute-python"), ExecutePythonHandler),
        (url_path_join(base_url, "reasonix", "api", "stat"), StatHandler),
        (url_path_join(base_url, "reasonix", "api", "glob"), GlobHandler),
    ]

    web_app.add_handlers(host_pattern, handlers)
