// ---------------------------------------------------------------------------
// Modal dialogs built on the native <dialog> element.
//
// All content is created with createElement/textContent - nothing coming from a
// group name, an imported file or a file name is ever written as HTML.
// ---------------------------------------------------------------------------
(function (global) {
    'use strict';

    const GAM = (global.GAM = global.GAM || {});

    let dialogElement = null;
    let active = null;

    function supports() {
        return typeof global.HTMLDialogElement === 'function' &&
            typeof global.HTMLDialogElement.prototype.showModal === 'function';
    }

    function build() {
        const dialog = document.createElement('dialog');
        dialog.className = 'dialog';
        dialog.setAttribute('aria-labelledby', 'app-dialog-title');

        const form = document.createElement('form');
        form.method = 'dialog';
        form.className = 'dialog__form';

        const title = document.createElement('h2');
        title.className = 'dialog__title';
        title.id = 'app-dialog-title';

        const body = document.createElement('div');
        body.className = 'dialog__body';

        const actions = document.createElement('div');
        actions.className = 'dialog__actions';

        form.appendChild(title);
        form.appendChild(body);
        form.appendChild(actions);
        dialog.appendChild(form);

        // Clicking the backdrop (i.e. the dialog element itself) cancels.
        dialog.addEventListener('click', event => {
            if (event.target === dialog) dialog.close('');
        });

        dialog.addEventListener('close', () => {
            const pending = active;
            active = null;
            if (pending) pending(dialog.returnValue === '' ? null : dialog.returnValue);
        });

        document.body.appendChild(dialog);
        return dialog;
    }

    function element() {
        if (!dialogElement) dialogElement = build();
        return dialogElement;
    }

    function summaryOf(content) {
        if (typeof content === 'string') return content;
        if (content && typeof content.textContent === 'string') return content.textContent.replace(/\s+/g, ' ').trim();
        return '';
    }

    /**
     * @param {{title: string, message?: string, details?: (string|string[]),
     *          content?: ?Node, tone?: string,
     *          buttons?: Array<{label: string, value: string, variant?: string}>,
     *          cancelValue?: string}} options
     * @returns {Promise<?string>} the value of the clicked button, null when cancelled
     */
    function show(options) {
        const settings = options || {};
        const tone = settings.tone || 'info';

        if (!supports()) {
            // Very old browsers: degrade to a native confirm/alert.
            const text = [settings.title, settings.message, settings.details, summaryOf(settings.content)]
                .filter(Boolean).join('\n\n');
            const confirmed = global.confirm(text);
            return Promise.resolve(confirmed ? (settings.confirmValue || 'confirm') : null);
        }

        const dialog = element();
        if (typeof dialog.close === 'function' && dialog.open) dialog.close('');

        const body = dialog.querySelector('.dialog__body');
        const actions = dialog.querySelector('.dialog__actions');
        body.textContent = '';
        actions.textContent = '';
        dialog.className = 'dialog dialog--' + tone;

        dialog.querySelector('.dialog__title').textContent = settings.title || '';

        if (settings.message) {
            const paragraph = document.createElement('p');
            paragraph.className = 'dialog__message';
            paragraph.textContent = settings.message;
            body.appendChild(paragraph);
        }

        if (settings.details) {
            const items = Array.isArray(settings.details) ? settings.details : [settings.details];
            const list = document.createElement('ul');
            list.className = 'dialog__details';
            items.forEach(item => {
                const entry = document.createElement('li');
                entry.textContent = item;
                list.appendChild(entry);
            });
            body.appendChild(list);
        }

        if (settings.content) body.appendChild(settings.content);

        const buttons = settings.buttons || [
            { label: settings.cancelLabel || 'Cancel', value: '', variant: 'ghost' },
            { label: settings.confirmLabel || 'OK', value: 'confirm', variant: tone === 'danger' ? 'danger' : 'primary' }
        ];

        buttons.forEach(buttonSettings => {
            const button = document.createElement('button');
            button.type = 'submit';
            button.value = buttonSettings.value;
            button.className = 'btn btn--' + (buttonSettings.variant || 'ghost');
            button.textContent = buttonSettings.label;
            if (buttonSettings.value === (settings.confirmValue || 'confirm')) button.dataset.primary = 'true';
            actions.appendChild(button);
        });

        return new Promise(resolve => {
            active = resolve;
            dialog.showModal();
            const primary = actions.querySelector('[data-primary="true"]') || actions.lastElementChild;
            if (primary) primary.focus();
        });
    }

    function confirm(options) {
        const settings = options || {};
        return show({
            title: settings.title || 'Please confirm',
            message: settings.message,
            details: settings.details,
            tone: settings.tone || 'warning',
            confirmLabel: settings.confirmLabel || 'Confirm',
            confirmValue: 'confirm',
            buttons: [
                { label: settings.cancelLabel || 'Cancel', value: '', variant: 'ghost' },
                {
                    label: settings.confirmLabel || 'Confirm',
                    value: 'confirm',
                    variant: settings.tone === 'danger' ? 'danger' : 'primary'
                }
            ]
        }).then(value => value === 'confirm');
    }

    function alert(options) {
        const settings = options || {};
        return show({
            title: settings.title || 'Notice',
            message: settings.message,
            details: settings.details,
            content: settings.content,
            tone: settings.tone || 'info',
            buttons: [{ label: settings.okLabel || 'Close', value: 'ok', variant: 'primary' }]
        }).then(() => undefined);
    }

    function close() {
        if (dialogElement && dialogElement.open) dialogElement.close('');
    }

    GAM.dialog = { supports: supports, show: show, confirm: confirm, alert: alert, close: close };
})(window);
