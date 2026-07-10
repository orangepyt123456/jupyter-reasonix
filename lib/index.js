/*
 * jupyter-reasonix: Jupyter Lab frontend extension
 *
 * Adds a Reasonix Chat panel to the right sidebar.
 * The panel loads an iframe with the chat UI served by the server extension.
 *
 * This is a pre-built (federated) extension.
 * No TypeScript compilation needed — ships compiled JS directly.
 */

var widgets = require('@lumino/widgets');

var plugin = {
    id: 'jupyter-reasonix:plugin',
    autoStart: true,
    requires: [],
    activate: function(app) {
        console.log('jupyter-reasonix: activating plugin');

        // Create the iframe widget
        var iframe = document.createElement('iframe');
        iframe.src = '/reasonix/';
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';
        iframe.style.background = '#1a1a2e';

        var widget = new widgets.Widget();
        widget.id = 'jp-reasonix';
        widget.title.label = 'Reasonix Chat';
        widget.title.iconClass = 'jp-ChartIcon jp-Sidebar-tab-icon';
        widget.title.closable = true;
        widget.node.appendChild(iframe);
        widget.node.style.overflow = 'hidden';

        // Register command to toggle the panel
        app.commands.addCommand('reasonix:open', {
            label: 'Reasonix Chat',
            caption: 'Open Reasonix Chat panel',
            execute: function() {
                if (!widget.isAttached) {
                    app.shell.add(widget, 'right', { rank: 500 });
                }
                app.shell.activateById(widget.id);
            }
        });

        // Add to View menu
        try {
            var menu = app.menuBar.menus.filter(function(m) {
                return m.id && m.id === 'jp-mainmenu-view';
            })[0];
            if (menu) {
                menu.addItem({ command: 'reasonix:open', rank: 500 });
            }
        } catch(e) {
            console.warn('jupyter-reasonix: could not add to View menu', e);
        }

        // Add to the right sidebar
        app.shell.add(widget, 'right', { rank: 500 });
    }
};

module.exports = [plugin];
