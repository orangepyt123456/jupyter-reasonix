# jupyter-reasonix — Reasonix Chat for Jupyter Lab

**Jupyter Lab extension** that adds a Reasonix-style chat panel on the right side.
Connect to remote Linux servers via SSH, manage files and projects through conversation.

## Features

- �️ **Chat Panel** — Reasonix-style chat interface in Jupyter Lab's right sidebar
- 🔌 **SSH Connection** — Connect to remote servers via password or key auth
- 📂 **File Management** — Browse, read, write, edit files through conversation
- 🐍 **Python Execution** — Run code in any conda environment
- 📓 **Notebook Support** — View and execute .ipynb cells
- 💬 **Chat History** — New conversation and history management

## Installation

```bash
pip install jupyter-reasonix
jupyter server extension enable jupyter_reasonix
```

## Usage

1. Launch Jupyter Lab as usual: `jupyter lab`
2. Click the **Reasonix** icon in the right sidebar
3. Connect to your server: enter hostname, username, password
4. Start chatting — the AI agent will help you manage files and projects
5. Use "New Chat" to start fresh, view history to revisit past conversations

## Configuration

Connection settings are saved in `~/.ssh-ide-mcp/config.json`.

## Requirements

- Python 3.9+
- Jupyter Lab 4.x
- Remote server: SSH access
