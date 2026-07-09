/* jupyter-reasonix: Jupyter Lab frontend extension
   Adds a Reasonix Chat panel to the right sidebar.
   This is a prebuilt (federated) extension.
*/
'use strict';

var widgets = require('@lumino/widgets');

var plugin = {
    id: 'jupyter-reasonix:plugin',
    autoStart: true,
    requires: [],
    activate: function(app) {
        // Create an iframe widget
        var iframe = document.createElement('iframe');
        iframe.src = '/reasonix/';
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';
        iframe.style.background = '#1a1a2e';

        var widget = new widgets.Widget();
        widget.id = 'jp-reasonix';
        widget.title.label = 'Reasonix Chat';
        widget.title.iconClass = 'jp-RStudioIcon jp-Sidebar-tab-icon';
        widget.title.closable = true;
        widget.node.appendChild(iframe);

        // Add a command to toggle the panel
        app.commands.addCommand('reasonix:open', {
            label: 'Reasonix Chat',
            caption: 'Open Reasonix Chat panel',
            iconClass: 'jp-RStudioIcon',
            execute: function() {
                if (!widget.isAttached) {
                    app.shell.add(widget, 'right');
                }
                app.shell.activateById(widget.id);
            }
        });

        // Register in the View menu
        var menu = app.menuBar.menus.filter(function(m) {
            return m.id === 'jp-mainmenu-view';
        })[0];
        if (menu) {
            menu.addItem({ command: 'reasonix:open', rank: 500 });
        }

        // Add to the right sidebar area
        app.shell.add(widget, 'right', { rank: 500 });
    }
};

module.exports = [plugin];
