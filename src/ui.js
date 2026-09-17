// ---------------------------------------------------------------------------
// User interface: form handling, table rendering, import / export flows.
//
// Rules kept in this file:
//   * the model is validated before anything is mutated, and the form is never
//     cleared before a save succeeded;
//   * every value that comes from a user or from a file is written with
//     textContent (never innerHTML);
//   * no inline event handlers - listeners are bound here and the table uses
//     event delegation with data attributes.
// ---------------------------------------------------------------------------
(function (global) {
    'use strict';

    const GAM = (global.GAM = global.GAM || {});

    const CUSTOM_DPT_VALUE = '__custom__';

    const ELEMENT_IDS = {
        groupForm: 'group-form',
        mainGroupName: 'mainGroupName',
        mainGroupIndex: 'mainGroupIndex',
        middleGroupName: 'middleGroupName',
        middleGroupIndex: 'middleGroupIndex',
        subGroupName: 'subGroupName',
        subGroupIndex: 'subGroupIndex',
        dataPoint: 'dataPoint',
        dptFilter: 'dptFilter',
        submitButton: 'submitButton',
        cancelButton: 'cancelButton',
        formErrors: 'formErrors',
        addressPreview: 'addressPreview',
        hintMainIndex: 'hintMainIndex',
        hintMiddleIndex: 'hintMiddleIndex',
        hintSubIndex: 'hintSubIndex',
        groupTable: 'groupTable',
        emptyState: 'emptyState',
        summary: 'summary',
        importXmlButton: 'importXmlButton',
        importXmlInput: 'importXmlInput',
        exportXmlButton: 'exportXmlButton',
        importJsonButton: 'importJsonButton',
        importJsonInput: 'importJsonInput',
        exportJsonButton: 'exportJsonButton',
        undoButton: 'undoButton',
        clearAllButton: 'clearAllButton',
        toasts: 'toasts'
    };

    const FIELD_INPUTS = {
        mainName: 'mainGroupName',
        mainIndex: 'mainGroupIndex',
        middleName: 'middleGroupName',
        middleIndex: 'middleGroupIndex',
        subName: 'subGroupName',
        subIndex: 'subGroupIndex'
    };

    let tree = null;
    let editRef = null;
    let customDpTypes = [];
    let fieldErrorElements = {};
    let storageWarned = false;

    const dom = {};

    // ------------------------------- setup ---------------------------------

    function init() {
        const missing = cacheDom();
        if (missing.length) {
            showFatal('The page is incomplete - these elements are missing: ' + missing.join(', '));
            return;
        }

        tree = GAM.storage.loadTree() || new GAM.GroupAddressTree([]);
        buildDataPointOptions('');
        bindEvents();
        updateEditUi();
        renderAll();

        if (!GAM.storage.isAvailable() && !storageWarned) {
            storageWarned = true;
            toast('Local storage is not available here, so your data is only kept until the page is reloaded. ' +
                'Use "Export XML" to save your work.', 'warning');
        }
    }

    function cacheDom() {
        const missing = [];
        Object.keys(ELEMENT_IDS).forEach(key => {
            const element = document.getElementById(ELEMENT_IDS[key]);
            if (element) dom[key] = element;
            else missing.push('#' + ELEMENT_IDS[key]);
        });

        fieldErrorElements = {};
        Array.prototype.forEach.call(document.querySelectorAll('[data-error-for]'), element => {
            fieldErrorElements[element.getAttribute('data-error-for')] = element;
        });

        return missing;
    }

    function showFatal(message) {
        console.error(message);
        const container = document.createElement('div');
        container.className = 'alert alert--error';
        container.setAttribute('role', 'alert');
        container.textContent = message;
        document.body.appendChild(container);
    }

    function bindEvents() {
        dom.groupForm.addEventListener('submit', onSubmit);
        dom.cancelButton.addEventListener('click', onCancelEdit);

        [dom.mainGroupIndex, dom.middleGroupIndex, dom.subGroupIndex].forEach(input => {
            input.addEventListener('input', renderFormHints);
        });

        dom.dptFilter.addEventListener('input', () => buildDataPointOptions(dom.dptFilter.value));
        dom.dataPoint.addEventListener('change', () => {
            if (dom.dataPoint.value !== CUSTOM_DPT_VALUE) customDpTypes = [];
        });

        dom.groupTable.addEventListener('click', onTableClick);

        dom.importXmlButton.addEventListener('click', () => dom.importXmlInput.click());
        dom.importJsonButton.addEventListener('click', () => dom.importJsonInput.click());
        dom.importXmlInput.addEventListener('change', () => handleFile('xml', dom.importXmlInput));
        dom.importJsonInput.addEventListener('change', () => handleFile('json', dom.importJsonInput));

        dom.exportXmlButton.addEventListener('click', exportXml);
        dom.exportJsonButton.addEventListener('click', exportProject);
        dom.undoButton.addEventListener('click', undoLastChange);
        dom.clearAllButton.addEventListener('click', deleteEverything);
    }

    // ------------------------------ rendering ------------------------------

    function renderAll() {
        renderTable();
        renderSummary();
        renderFormHints();
        renderUndoButton();
    }

    function renderTable() {
        const rows = tree.rows();
        dom.groupTable.textContent = '';
        dom.emptyState.hidden = rows.length > 0;
        const table = dom.groupTable.closest('table');
        if (table) table.hidden = rows.length === 0;
        if (!rows.length) return;

        const fragment = document.createDocumentFragment();
        rows.forEach(row => fragment.appendChild(buildRow(row)));
        dom.groupTable.appendChild(fragment);
    }

    function buildRow(row) {
        const tr = document.createElement('tr');
        tr.dataset.main = String(row.ref.mainIndex);
        tr.dataset.middle = String(row.ref.middleIndex);
        tr.dataset.sub = row.ref.subIndex === null ? '' : String(row.ref.subIndex);
        if (isEditing(row.ref)) tr.classList.add('is-editing');

        tr.appendChild(addressCell(row.address));
        tr.appendChild(groupCell(row.mainGroup));
        tr.appendChild(groupCell(row.middleGroup));
        tr.appendChild(subGroupCell(row));
        tr.appendChild(dataPointCell(row.subGroup));
        tr.appendChild(actionsCell(row));
        return tr;
    }

    function addressCell(address) {
        const cell = document.createElement('td');
        if (address) {
            const code = document.createElement('code');
            code.className = 'address';
            code.textContent = address;
            cell.appendChild(code);
        } else {
            cell.appendChild(muted('—'));
        }
        return cell;
    }

    function groupCell(group) {
        const cell = document.createElement('td');
        const name = document.createElement('span');
        name.className = 'group__name';
        name.textContent = group.name || '(unnamed)';
        if (!group.name) name.classList.add('muted');
        const index = document.createElement('span');
        index.className = 'group__index';
        index.textContent = String(group.index);
        cell.appendChild(name);
        cell.appendChild(index);
        return cell;
    }

    function subGroupCell(row) {
        const cell = document.createElement('td');
        if (!row.subGroup) {
            cell.appendChild(muted('no subgroups'));
            return cell;
        }
        const name = document.createElement('span');
        name.textContent = row.subGroup.name || '(unnamed)';
        if (!row.subGroup.name) name.className = 'muted';
        const index = document.createElement('span');
        index.className = 'group__index';
        index.textContent = String(row.subGroup.index);
        cell.appendChild(name);
        cell.appendChild(index);
        return cell;
    }

    function dataPointCell(subGroup) {
        const cell = document.createElement('td');
        const list = subGroup ? subGroup.dpTypes : [];
        if (!list.length) {
            cell.appendChild(muted('—'));
            return cell;
        }
        list.forEach(id => {
            const badge = document.createElement('span');
            badge.className = 'badge';
            badge.textContent = id;
            const name = GAM.dpt.nameOf(id);
            if (name) badge.title = name;
            else badge.classList.add('badge--unknown');
            cell.appendChild(badge);
        });
        return cell;
    }

    function actionsCell(row) {
        const cell = document.createElement('td');
        cell.className = 'actions-cell';
        const label = row.address
            ? 'group address ' + row.address
            : 'middle group ' + row.middleGroup.index;

        const edit = document.createElement('button');
        edit.type = 'button';
        edit.className = 'btn btn--small btn--ghost';
        edit.textContent = 'Edit';
        edit.setAttribute('aria-label', 'Edit ' + label);

        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'btn btn--small btn--danger-ghost';
        remove.textContent = 'Delete';
        remove.setAttribute('aria-label', 'Delete ' + label);

        [edit, remove].forEach(button => {
            button.dataset.main = row.ref.mainIndex;
            button.dataset.middle = row.ref.middleIndex;
            button.dataset.sub = row.ref.subIndex === null ? '' : row.ref.subIndex;
        });
        edit.dataset.action = 'edit';
        remove.dataset.action = 'delete';

        cell.appendChild(edit);
        cell.appendChild(remove);
        return cell;
    }

    function muted(text) {
        const span = document.createElement('span');
        span.className = 'muted';
        span.textContent = text;
        return span;
    }

    function renderSummary() {
        const counts = tree.counts();
        dom.summary.textContent = plural(counts.mainGroups, 'main group') + ' · ' +
            plural(counts.middleGroups, 'middle group') + ' · ' +
            plural(counts.subGroups, 'group address', 'group addresses');
    }

    function renderFormHints() {
        const mainIndex = readIndex(dom.mainGroupIndex);
        const middleIndex = readIndex(dom.middleGroupIndex);
        const subIndex = readIndex(dom.subGroupIndex);
        const mainValid = Number.isInteger(mainIndex);
        const middleValid = Number.isInteger(middleIndex);

        setHint(dom.hintMainIndex, 'next free: ' + textOf(tree.nextMainIndex()));
        setHint(dom.hintMiddleIndex, mainValid ? 'next free: ' + textOf(tree.nextMiddleIndex(mainIndex)) : '');
        setHint(dom.hintSubIndex, mainValid && middleValid
            ? 'next free: ' + textOf(tree.nextSubGroupIndex(mainIndex, middleIndex))
            : '');

        if (mainValid && middleValid) {
            const sub = Number.isInteger(subIndex) ? String(subIndex) : '…';
            dom.addressPreview.textContent = 'Group address: ' +
                (mainIndex - 1) + '/' + (middleIndex - 1) + '/' + sub;
        } else {
            dom.addressPreview.textContent = 'Group address: —';
        }
    }

    function setHint(element, text) {
        if (element) element.textContent = text;
    }

    function renderUndoButton() {
        dom.undoButton.hidden = !GAM.storage.hasSnapshot();
    }

    function updateEditUi() {
        const editing = Boolean(editRef);
        dom.submitButton.textContent = editing ? 'Save changes' : 'Add group address';
        dom.cancelButton.hidden = !editing;
        dom.groupForm.classList.toggle('is-editing', editing);
    }

    function isEditing(ref) {
        if (!editRef || !ref) return false;
        return editRef.mainIndex === ref.mainIndex &&
            editRef.middleIndex === ref.middleIndex &&
            (editRef.subIndex === null ? null : editRef.subIndex) === (ref.subIndex === null ? null : ref.subIndex);
    }

    // -------------------------------- form ---------------------------------

    function readForm() {
        return {
            mainName: dom.mainGroupName.value.trim(),
            mainIndex: readIndex(dom.mainGroupIndex),
            middleName: dom.middleGroupName.value.trim(),
            middleIndex: readIndex(dom.middleGroupIndex),
            subName: dom.subGroupName.value.trim(),
            subIndex: readIndex(dom.subGroupIndex),
            dpTypes: readDpTypes()
        };
    }

    /**
     * null when the input is empty, NaN when it cannot be read - the model then
     * reports a proper range error instead of silently ignoring the value.
     */
    function readIndex(input) {
        const text = input.value.trim();
        if (text === '') return null;
        return /^\d+$/.test(text) ? Number(text) : Number.NaN;
    }

    function readDpTypes() {
        const value = dom.dataPoint.value;
        if (value === CUSTOM_DPT_VALUE) return customDpTypes.slice();
        return value ? [value] : [];
    }

    function onSubmit(event) {
        event.preventDefault();
        clearErrors();

        const payload = readForm();
        const editing = Boolean(editRef);
        const result = editing ? tree.updateEntry(editRef, payload) : tree.addEntry(payload);

        if (!result.ok) {
            showErrors(result.errors);
            return;
        }

        editRef = null;
        persist();
        renderAll();
        clearForm();
        if (result.warnings.length) toast(result.warnings.join(' '), 'warning');
        toast(editing ? 'Changes saved.' : 'Group address added.', 'success');
    }

    function onCancelEdit() {
        editRef = null;
        clearForm();
        renderAll();
    }

    function clearForm() {
        dom.mainGroupName.value = '';
        dom.mainGroupIndex.value = '';
        dom.middleGroupName.value = '';
        dom.middleGroupIndex.value = '';
        dom.subGroupName.value = '';
        dom.subGroupIndex.value = '';
        customDpTypes = [];
        dom.dptFilter.value = '';
        buildDataPointOptions('');
        dom.dataPoint.value = '';
        clearErrors();
        editRef = null;
        updateEditUi();
        renderFormHints();
    }

    function fillForm(ref) {
        const found = tree.findEntry(ref);
        if (!found) {
            toast('That entry no longer exists.', 'error');
            renderAll();
            return false;
        }

        dom.mainGroupName.value = found.mainGroup.name;
        dom.mainGroupIndex.value = String(found.mainGroup.index);
        dom.middleGroupName.value = found.middleGroup.name;
        dom.middleGroupIndex.value = String(found.middleGroup.index);
        dom.subGroupName.value = found.subGroup ? found.subGroup.name : '';
        dom.subGroupIndex.value = found.subGroup ? String(found.subGroup.index) : '';

        applyDpTypesToForm(found.subGroup ? found.subGroup.dpTypes : []);

        editRef = found.ref;
        clearErrors();
        updateEditUi();
        renderTable();
        renderFormHints();
        dom.mainGroupName.focus();
        dom.groupForm.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        return true;
    }

    /** Keeps DataPoint types that are not in the catalogue (multi value imports). */
    function applyDpTypesToForm(dpTypes) {
        customDpTypes = [];
        dom.dptFilter.value = '';
        buildDataPointOptions('');

        if (dpTypes.length === 1 && GAM.dpt.exists(dpTypes[0])) {
            dom.dataPoint.value = dpTypes[0];
            return;
        }
        if (!dpTypes.length) {
            dom.dataPoint.value = '';
            return;
        }
        customDpTypes = dpTypes.slice();
        buildDataPointOptions('');
        dom.dataPoint.value = CUSTOM_DPT_VALUE;
    }

    function showErrors(errors) {
        const general = [];
        let firstInvalid = null;

        errors.forEach(error => {
            const key = FIELD_INPUTS[error.field];
            const target = key ? dom[key] : null;
            const errorElement = fieldErrorElements[error.field];

            if (!target || !errorElement) {
                general.push(error.message);
                return;
            }
            errorElement.textContent = error.message;
            errorElement.hidden = false;
            target.setAttribute('aria-invalid', 'true');
            if (!firstInvalid) firstInvalid = target;
        });

        if (general.length) {
            dom.formErrors.textContent = general.join(' ');
            dom.formErrors.hidden = false;
        }
        if (firstInvalid) {
            firstInvalid.focus();
            firstInvalid.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
    }

    function clearErrors() {
        Object.keys(fieldErrorElements).forEach(field => {
            fieldErrorElements[field].textContent = '';
            fieldErrorElements[field].hidden = true;
        });
        Object.keys(FIELD_INPUTS).forEach(field => {
            const target = dom[FIELD_INPUTS[field]];
            if (target) target.removeAttribute('aria-invalid');
        });
        dom.formErrors.textContent = '';
        dom.formErrors.hidden = true;
    }

    // --------------------------- DataPoint types ---------------------------

    function buildDataPointOptions(filterText) {
        const select = dom.dataPoint;
        const previous = select.value;
        select.textContent = '';

        const none = document.createElement('option');
        none.value = '';
        none.textContent = '— none —';
        select.appendChild(none);

        const query = String(filterText || '').trim();
        const matches = GAM.dpt.matches(query);

        if (query) {
            matches.forEach(item => select.appendChild(createDataPointOption(item)));
            if (!matches.length) {
                const empty = document.createElement('option');
                empty.value = '';
                empty.disabled = true;
                empty.textContent = 'No DataPoint type matches "' + query + '"';
                select.appendChild(empty);
            }
        } else {
            GAM.dpt.grouped(matches).forEach(group => {
                const optgroup = document.createElement('optgroup');
                optgroup.label = group.label;
                group.items.forEach(item => optgroup.appendChild(createDataPointOption(item)));
                select.appendChild(optgroup);
            });
        }

        if (customDpTypes.length) {
            const custom = document.createElement('option');
            custom.value = CUSTOM_DPT_VALUE;
            custom.textContent = 'from imported file: ' + customDpTypes.join(' ');
            select.appendChild(custom);
        }

        if (hasOption(select, previous)) select.value = previous;
        else if (customDpTypes.length) select.value = CUSTOM_DPT_VALUE;
    }

    function createDataPointOption(item) {
        const option = document.createElement('option');
        option.value = item.id;
        option.textContent = item.id + ' - ' + item.name;
        return option;
    }

    function hasOption(select, value) {
        return Array.prototype.some.call(select.options, option => option.value === value);
    }

    // ------------------------------ table events ---------------------------

    function onTableClick(event) {
        const button = event.target.closest('button[data-action]');
        if (!button) return;

        const ref = {
            mainIndex: Number(button.dataset.main),
            middleIndex: Number(button.dataset.middle),
            subIndex: button.dataset.sub === '' ? null : Number(button.dataset.sub)
        };

        if (button.dataset.action === 'edit') fillForm(ref);
        else if (button.dataset.action === 'delete') deleteEntry(ref);
    }

    function deleteEntry(ref) {
        const found = tree.findEntry(ref);
        if (!found) {
            toast('That entry no longer exists.', 'error');
            renderAll();
            return;
        }

        const description = found.subGroup
            ? 'group address ' + GAM.addresses.format(found.mainGroup.index, found.middleGroup.index, found.subGroup.index) +
              ' (“' + (found.subGroup.name || 'unnamed') + '”)'
            : 'the middle group ' + found.middleGroup.index + ' (“' + (found.middleGroup.name || 'unnamed') + '”)';

        GAM.dialog.confirm({
            title: 'Delete ' + (found.subGroup ? 'group address' : 'middle group'),
            message: 'Delete ' + description + '?',
            details: found.subGroup
                ? 'Main or middle groups that are left without any subgroup are removed as well.'
                : 'The main group is removed too if it is left without any middle group.',
            confirmLabel: 'Delete',
            tone: 'danger'
        }).then(confirmed => {
            if (!confirmed) return;

            GAM.storage.saveSnapshot(tree, 'before deleting ' + (found.subGroup ? 'a group address' : 'a middle group'));
            const result = tree.removeEntry(ref);
            if (!result.ok) {
                toast(result.errors.join(' '), 'error');
                return;
            }

            if (editRef && isEditing(ref)) {
                editRef = null;
                clearForm();
            }
            persist();
            renderAll();

            const extra = result.pruned && (result.pruned.middleGroup || result.pruned.mainGroup)
                ? ' The empty group structure was removed as well.'
                : '';
            toast('Deleted. You can restore it with “Undo last change”.' + extra, 'info');
        });
    }

    // ---------------------------- import / export --------------------------

    function handleFile(kind, input) {
        const file = input.files && input.files[0];
        input.value = ''; // allows picking the same file twice
        if (!file) return;

        GAM.storage.readFileAsText(file).then(text => {
            const parsed = kind === 'xml' ? GAM.xml.parse(text) : GAM.storage.fromProjectFile(text);

            if (!parsed.ok) {
                return GAM.dialog.alert({
                    title: 'Import failed',
                    message: parsed.errors.join(' '),
                    tone: 'danger'
                });
            }

            // Nothing is touched before the user confirmed the preview, so a
            // cancelled or broken import can never destroy the current data.
            return GAM.dialog.show({
                title: kind === 'xml' ? 'Import group addresses' : 'Import project',
                content: buildPreviewContent(parsed, file.name),
                tone: parsed.warnings.length ? 'warning' : 'info',
                buttons: [
                    { label: 'Cancel', value: '', variant: 'ghost' },
                    { label: 'Replace data', value: 'confirm', variant: 'primary' }
                ]
            }).then(value => {
                if (value !== 'confirm') return;

                if (GAM.storage.saveSnapshot(tree, 'before importing ' + file.name)) renderUndoButton();
                tree = parsed.tree;
                editRef = null;
                clearForm();
                persist();
                renderAll();
                toast('Imported ' + plural(parsed.stats.subGroups, 'group address', 'group addresses') +
                    ' from “' + file.name + '”.', 'success');
            });
        }).catch(error => {
            GAM.dialog.alert({ title: 'Import failed', message: error.message, tone: 'danger' });
        });
    }

    function buildPreviewContent(parsed, fileName) {
        const wrapper = document.createElement('div');
        const stats = document.createElement('dl');
        stats.className = 'preview';

        addPreviewRow(stats, 'File', fileName);
        addPreviewRow(stats, 'Main groups', String(parsed.stats.mainGroups));
        addPreviewRow(stats, 'Middle groups', String(parsed.stats.middleGroups));
        addPreviewRow(stats, 'Group addresses', String(parsed.stats.subGroups));
        addPreviewRow(stats, 'DataPoint types', String(parsed.stats.dataPointTypes.length));
        addPreviewRow(stats, 'Currently stored',
            plural(tree.counts().subGroups, 'group address', 'group addresses') + ' will be replaced');
        wrapper.appendChild(stats);

        if (parsed.warnings.length) {
            const heading = document.createElement('p');
            heading.className = 'preview__heading';
            heading.textContent = parsed.warnings.length === 1
                ? '1 warning'
                : parsed.warnings.length + ' warnings';
            wrapper.appendChild(heading);

            const list = document.createElement('ul');
            list.className = 'preview__warnings';
            parsed.warnings.slice(0, 12).forEach(warning => {
                const item = document.createElement('li');
                item.textContent = warning;
                list.appendChild(item);
            });
            if (parsed.warnings.length > 12) {
                const item = document.createElement('li');
                item.textContent = '…and ' + (parsed.warnings.length - 12) + ' more.';
                list.appendChild(item);
            }
            wrapper.appendChild(list);
        }

        const note = document.createElement('p');
        note.className = 'preview__note';
        note.textContent = 'The data currently stored is replaced. You can restore it afterwards with ' +
            '“Undo last change”.';
        wrapper.appendChild(note);

        return wrapper;
    }

    function addPreviewRow(list, label, value) {
        const term = document.createElement('dt');
        term.textContent = label;
        const description = document.createElement('dd');
        description.textContent = value;
        list.appendChild(term);
        list.appendChild(description);
    }

    function exportXml() {
        if (tree.isEmpty()) {
            toast('There is nothing to export yet.', 'warning');
            return;
        }
        try {
            GAM.storage.download('group_addresses.xml', GAM.xml.serialize(tree), 'application/xml;charset=utf-8');
            toast('Exported ' + plural(tree.counts().subGroups, 'group address', 'group addresses') +
                ' to group_addresses.xml.', 'success');
        } catch (error) {
            GAM.dialog.alert({ title: 'Export failed', message: error.message, tone: 'danger' });
        }
    }

    function exportProject() {
        if (tree.isEmpty()) {
            toast('There is nothing to export yet.', 'warning');
            return;
        }
        try {
            GAM.storage.download('group_addresses.project.json', GAM.storage.toProjectFile(tree),
                'application/json;charset=utf-8');
            toast('Project file exported.', 'success');
        } catch (error) {
            GAM.dialog.alert({ title: 'Export failed', message: error.message, tone: 'danger' });
        }
    }

    function undoLastChange() {
        const snapshot = GAM.storage.loadSnapshot();
        if (!snapshot) {
            toast('There is nothing to undo.', 'info');
            return;
        }

        GAM.dialog.confirm({
            title: 'Undo last change',
            message: 'Restore the data from before the last destructive action?',
            details: GAM.storage.snapshotLabel() || 'the last import, deletion or reset',
            confirmLabel: 'Restore',
            tone: 'warning'
        }).then(confirmed => {
            if (!confirmed) return;

            tree = snapshot;
            GAM.storage.clearSnapshot();
            editRef = null;
            clearForm();
            persist();
            renderAll();
            toast('Previous state restored.', 'success');
        });
    }

    function deleteEverything() {
        if (tree.isEmpty()) {
            toast('There is nothing to delete.', 'info');
            return;
        }

        GAM.dialog.confirm({
            title: 'Delete everything',
            message: 'Delete ' + plural(tree.counts().subGroups, 'group address', 'group addresses') +
                ' and the whole group structure?',
            details: 'You can restore the data afterwards with “Undo last change”.',
            confirmLabel: 'Delete everything',
            tone: 'danger'
        }).then(confirmed => {
            if (!confirmed) return;

            GAM.storage.saveSnapshot(tree, 'before deleting everything');
            tree = new GAM.GroupAddressTree([]);
            editRef = null;
            clearForm();
            persist();
            renderAll();
            toast('Everything deleted. “Undo last change” can bring it back.', 'info');
        });
    }

    // ------------------------------ utilities ------------------------------

    function persist() {
        const saved = GAM.storage.saveTree(tree);
        if (!saved && !storageWarned) {
            storageWarned = true;
            toast('Local storage is not available here, so the data is only kept until the page is reloaded.',
                'warning');
        }
    }

    function toast(message, tone) {
        const item = document.createElement('div');
        item.className = 'toast toast--' + (tone || 'info');
        item.setAttribute('role', tone === 'error' ? 'alert' : 'status');
        item.textContent = message;
        dom.toasts.appendChild(item);

        const lifetime = (tone === 'error' || tone === 'warning') ? 9000 : 4500;
        global.setTimeout(() => {
            item.classList.add('is-leaving');
            global.setTimeout(() => item.remove(), 400);
        }, lifetime);
    }

    function plural(count, singular, pluralForm) {
        return count + ' ' + (count === 1 ? singular : (pluralForm || singular + 's'));
    }

    function textOf(value) {
        return value === null || value === undefined ? '—' : String(value);
    }

    GAM.ui = {
        init: init,
        toast: toast,
        render: renderAll,
        getTree: () => tree
    };
})(window);
