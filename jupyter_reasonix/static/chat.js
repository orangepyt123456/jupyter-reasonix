/* ── Reasonix Chat UI ──────────────────────────────────── */

let connected = false;
let alias = null;
let messages = [];
let history = JSON.parse(localStorage.getItem('reasonix_history') || '[]');

const $ = id => document.getElementById(id);
const chatArea = $('chat-area');
const welcome = $('welcome');
const chatInput = $('chat-input');
const sendBtn = $('send-btn');
const connStatus = $('conn-status');
const connectBtn = $('connect-btn');

// ── API ──────────────────────────────────────────────────
async function api(method, path, body) {
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch('/reasonix/api/' + path, opts);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

// ── Connection ───────────────────────────────────────────
async function connect() {
    const host = $('host').value.trim();
    const user = $('user').value.trim();
    const pwd = $('pwd').value;
    const workdir = $('workdir').value.trim() || '.';

    if (!host || !user || !pwd) {
        addMessage('system', 'Please fill in host, username and password');
        return;
    }

    connectBtn.disabled = true;
    connectBtn.textContent = 'Connecting...';
    connStatus.textContent = 'Connecting...';
    connStatus.className = '';
    welcome.style.display = 'none';

    try {
        const r = await api('POST', 'connect', {
            hostname: host, username: user, port: 22,
            password: pwd, host_alias: host + '-' + user
        });
        if (r.success) {
            alias = r.alias;
            connected = true;
            connStatus.textContent = 'Connected: ' + alias;
            connStatus.className = 'connected';
            chatInput.disabled = false;
            sendBtn.disabled = false;
            chatInput.focus();
            addMessage('system', 'Connected to ' + host + ' as ' + user);
            addMessage('system', 'Workdir: ' + workdir + '. How can I help you?');
            // Save to history
            saveToHistory(host, user, workdir);
        } else {
            throw new Error(r.error || 'Connection failed');
        }
    } catch (err) {
        connStatus.textContent = 'Failed: ' + err.message;
        connStatus.className = '';
        welcome.style.display = 'flex';
        addMessage('system', 'Connection failed: ' + err.message);
    }
    connectBtn.disabled = false;
    connectBtn.textContent = 'Connect';
}

// ── Messages ─────────────────────────────────────────────
function addMessage(role, text) {
    welcome.style.display = 'none';
    const div = document.createElement('div');
    div.className = 'msg ' + role;
    if (role === 'system') {
        div.textContent = text;
    } else {
        div.innerHTML = '<div class="meta">' + (role === 'user' ? 'You' : 'Assistant') + '</div>' + escapeHtml(text);
    }
    chatArea.appendChild(div);
    chatArea.scrollTop = chatArea.scrollHeight;
    messages.push({ role, text });
}

function addOutput(text, isError) {
    const div = document.createElement('div');
    div.className = 'msg-output' + (isError ? ' error' : '');
    div.textContent = text;
    chatArea.appendChild(div);
    chatArea.scrollTop = chatArea.scrollHeight;
}

function escapeHtml(text) {
    const d = document.createElement('div');
    d.textContent = text || '';
    return d.innerHTML;
}

// ── Send Message ─────────────────────────────────────────
async function sendMessage() {
    const text = chatInput.value.trim();
    if (!text || !connected) return;
    chatInput.value = '';
    addMessage('user', text);

    // Process command
    sendBtn.disabled = true;
    chatInput.disabled = true;
    try {
        await processCommand(text);
    } catch (err) {
        addMessage('assistant', 'Error: ' + err.message);
    }
    sendBtn.disabled = false;
    chatInput.disabled = false;
    chatInput.focus();
}

// ── Command Processing ───────────────────────────────────
async function processCommand(text) {
    const lower = text.toLowerCase();

    // SSH connect command
    if (lower.startsWith('ssh connect') || lower.startsWith('connect to')) {
        // Parse: "SSH connect to host as user, password: xxx, workdir: xxx"
        const hostMatch = text.match(/(\d+\.\d+\.\d+\.\d+|[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
        const userMatch = text.match(/as\s+(\w+)/i);
        const pwdMatch = text.match(/password:\s*(\S+)/i);
        const dirMatch = text.match(/workdir:\s*(\S+)/i);

        if (hostMatch) $('host').value = hostMatch[1];
        if (userMatch) $('user').value = userMatch[1];
        if (pwdMatch) $('pwd').value = pwdMatch[1];
        if (dirMatch) $('workdir').value = dirMatch[1];

        if (hostMatch && userMatch && pwdMatch) {
            await connect();
            return;
        }
        addMessage('assistant', 'I can help you connect. Use: "connect to 192.168.1.100 as root, password: mypass, workdir: /path"');
        return;
    }

    // Other commands: exec via SSH
    await executeRemotely(text);
}

async function executeRemotely(command) {
    if (!alias) {
        addMessage('assistant', 'Not connected. Please connect to a server first.');
        return;
    }

    // Interpret the command: first try as a natural language request
    // For simplicity, wrap common operations
    let shellCmd = '';
    const lower = command.toLowerCase();

    // List directory
    if (/^(ls|list|dir|show|what.*in|browse)/.test(lower)) {
        const dirMatch = command.match(/(?:ls|list|dir|in|browse)\s+(.+)/i);
        const path = dirMatch ? dirMatch[1].trim() : '.';
        shellCmd = 'ls -la ' + escapeShellArg(path);
    }
    // Read file
    else if (/^(cat|read|show|view|open)\s/.test(lower)) {
        const fileMatch = command.match(/(?:cat|read|show|view|open)\s+(.+)/i);
        if (fileMatch) {
            const path = fileMatch[1].trim();
            addMessage('assistant', 'Reading ' + path + '...');
            try {
                const r = await api('GET', 'read?alias=' + alias + '&path=' + encodeURIComponent(path));
                if (r.content !== undefined) {
                    addOutput(r.content.substring(0, 2000));
                    if (r.content.length > 2000) addOutput('...(truncated, ' + r.content.length + ' total chars)');
                }
            } catch (err) {
                addOutput('Error: ' + err.message, true);
            }
            return;
        }
        shellCmd = command;
    }
    // Execute Python
    else if (/^(python|py|run python|execute python)\s/.test(lower)) {
        const code = command.replace(/^(python|py|run python|execute python)\s*/i, '');
        addMessage('assistant', 'Executing Python...');
        try {
            const r = await api('POST', 'execute-python', { alias, code, python_bin: 'python3' });
            if (r.output) addOutput(r.output);
            if (r.error) addOutput(r.error, true);
        } catch (err) {
            addOutput('Error: ' + err.message, true);
        }
        return;
    }
    // Default: execute as shell command
    else {
        shellCmd = command;
    }

    if (shellCmd) {
        addMessage('assistant', 'Running: ' + shellCmd);
        try {
            const r = await api('POST', 'exec', { alias, command: shellCmd });
            if (r.stdout) addOutput(r.stdout);
            if (r.stderr) addOutput(r.stderr, true);
            addMessage('system', 'Exit code: ' + r.exit_code);
        } catch (err) {
            addOutput('Error: ' + err.message, true);
        }
    }
}

function escapeShellArg(arg) {
    return '"' + arg.replace(/"/g, '\\"') + '"';
}

// ── History ──────────────────────────────────────────────
function saveToHistory(host, user, workdir) {
    const entry = {
        host, user, workdir,
        time: new Date().toISOString(),
        id: Date.now()
    };
    history.unshift(entry);
    if (history.length > 20) history.pop();
    localStorage.setItem('reasonix_history', JSON.stringify(history));
}

function newChat() {
    chatArea.innerHTML = '';
    messages = [];
    welcome.style.display = 'flex';
    chatInput.value = '';
}

function toggleHistory() {
    if (history.length === 0) {
        addMessage('system', 'No history yet');
        return;
    }
    let html = '<div class="msg system">--- History ---</div>';
    for (const h of history) {
        html += '<div class="msg assistant" style="cursor:pointer;font-size:12px;padding:6px 12px;" onclick="restoreHistory(\'' +
            h.host + '\',\'' + h.user + '\',\'' + h.workdir + '\')">';
        html += h.host + ' as ' + h.user + ' — ' + new Date(h.time).toLocaleString();
        html += '</div>';
    }
    chatArea.innerHTML = html;
    welcome.style.display = 'none';
}

function restoreHistory(host, user, workdir) {
    $('host').value = host;
    $('user').value = user;
    $('workdir').value = workdir;
    newChat();
    addMessage('system', 'Connection info restored from history. Click Connect.');
}

// ── Keyboard ─────────────────────────────────────────────
chatInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// Pre-fill from URL params
const params = new URLSearchParams(window.location.search);
if (params.get('host')) $('host').value = params.get('host');
if (params.get('user')) $('user').value = params.get('user');
if (params.get('dir')) $('workdir').value = params.get('dir');
