// ---------------------------------------------------------------------------
// Bootstrap.
//
// The application is split into small files that are loaded as ordinary
// scripts (see index.html), so it runs from a file system path as well as from
// a web server - no build step and no dependencies.
// ---------------------------------------------------------------------------
(function (global) {
    'use strict';

    function showProblem(message) {
        const container = document.createElement('div');
        container.className = 'alert alert--error';
        container.setAttribute('role', 'alert');
        container.textContent = message;
        const main = document.querySelector('main') || document.body;
        main.insertBefore(container, main.firstChild);
    }

    function start() {
        if (!global.GAM || !global.GAM.ui || !global.GAM.GroupAddressTree) {
            showProblem('The application scripts could not be loaded. Please check that the src/ folder ' +
                'is next to index.html.');
            return;
        }

        global.GAM.ui.init();

        global.addEventListener('error', event => {
            if (global.GAM.ui && typeof global.GAM.ui.toast === 'function') {
                global.GAM.ui.toast('Unexpected error: ' + (event.message || 'unknown'), 'error');
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }
})(window);
