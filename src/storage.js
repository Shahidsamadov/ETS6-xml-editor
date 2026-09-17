// ---------------------------------------------------------------------------
// Persistence: localStorage (so a refresh does not throw the work away), an
// import snapshot for undo, and file download / read helpers.
//
// Every localStorage access is wrapped in try/catch: on file:// URLs and in
// private browsing modes storage can be unavailable, and the application must
// keep working without it.
// ---------------------------------------------------------------------------
(function (global) {
    'use strict';

    const GAM = (global.GAM = global.GAM || {});

    const TREE_KEY = 'gam:tree:v1';
    const SNAPSHOT_KEY = 'gam:snapshot:v1';
    const SNAPSHOT_LABEL_KEY = 'gam:snapshot:label';
    const PROJECT_VERSION = 1;
    const MAX_FILE_SIZE = 32 * 1024 * 1024; // 32 MB is far beyond a realistic export

    let storageAvailable = null;

    function isAvailable() {
        if (storageAvailable === null) {
            try {
                const probe = 'gam:probe';
                global.localStorage.setItem(probe, '1');
                global.localStorage.removeItem(probe);
                storageAvailable = true;
            } catch (error) {
                storageAvailable = false;
            }
        }
        return storageAvailable;
    }

    function readJson(key) {
        if (!isAvailable()) return null;
        try {
            const raw = global.localStorage.getItem(key);
            return raw ? JSON.parse(raw) : null;
        } catch (error) {
            return null;
        }
    }

    function writeJson(key, value) {
        if (!isAvailable()) return false;
        try {
            global.localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            return false;
        }
    }

    function remove(key) {
        if (!isAvailable()) return;
        try {
            global.localStorage.removeItem(key);
        } catch (error) {
            /* nothing we can do about it */
        }
    }

    // ---------------------------- working data -----------------------------

    /** @returns {?GroupAddressTree} null when nothing usable is stored. */
    function loadTree() {
        const data = readJson(TREE_KEY);
        if (!data || !Array.isArray(data.mainGroups)) return null;
        return GAM.GroupAddressTree.fromJSON(data);
    }

    function saveTree(tree) {
        return writeJson(TREE_KEY, { version: PROJECT_VERSION, savedAt: new Date().toISOString(), mainGroups: tree.toJSON().mainGroups });
    }

    function clearTree() {
        remove(TREE_KEY);
    }

    // ------------------------------ snapshot -------------------------------

    /** Remembers the data that is about to be replaced, so it can be restored. */
    function saveSnapshot(tree, label) {
        const saved = writeJson(SNAPSHOT_KEY, { version: PROJECT_VERSION, savedAt: new Date().toISOString(), mainGroups: tree.toJSON().mainGroups });
        if (saved) writeJson(SNAPSHOT_LABEL_KEY, label || '');
        return saved;
    }

    function loadSnapshot() {
        const data = readJson(SNAPSHOT_KEY);
        if (!data || !Array.isArray(data.mainGroups)) return null;
        return GAM.GroupAddressTree.fromJSON(data);
    }

    function hasSnapshot() {
        const data = readJson(SNAPSHOT_KEY);
        return Boolean(data && Array.isArray(data.mainGroups));
    }

    function snapshotLabel() {
        const label = readJson(SNAPSHOT_LABEL_KEY);
        return typeof label === 'string' ? label : '';
    }

    function clearSnapshot() {
        remove(SNAPSHOT_KEY);
        remove(SNAPSHOT_LABEL_KEY);
    }

    // ---------------------------- project files ----------------------------

    function toProjectFile(tree) {
        return JSON.stringify({
            application: 'ETS6-xml-editor',
            version: PROJECT_VERSION,
            exportedAt: new Date().toISOString(),
            mainGroups: tree.toJSON().mainGroups
        }, null, 2);
    }

    /** @returns {{ok: boolean, tree: ?GroupAddressTree, errors: string[], warnings: string[]}} */
    function fromProjectFile(text) {
        const result = { ok: false, tree: null, errors: [], warnings: [] };
        let parsed;
        try {
            parsed = JSON.parse(text);
        } catch (error) {
            result.errors.push('The file is not valid JSON: ' + error.message);
            return result;
        }

        const rawMainGroups = parsed && Array.isArray(parsed.mainGroups) ? parsed.mainGroups : null;
        if (!rawMainGroups) {
            result.errors.push('The file does not look like a project file (no "mainGroups" array).');
            return result;
        }

        const tree = GAM.GroupAddressTree.fromJSON(parsed);
        const before = countRawEntries(rawMainGroups);
        const after = tree.counts().subGroups;
        if (before !== after) {
            result.warnings.push((before - after) + ' entr(ies) were skipped because they were not valid.');
        }

        result.tree = tree;
        result.stats = tree.counts();
        result.ok = true;
        return result;
    }

    function countRawEntries(mainGroups) {
        let total = 0;
        mainGroups.forEach(mainGroup => {
            (mainGroup && Array.isArray(mainGroup.middleGroups) ? mainGroup.middleGroups : []).forEach(middleGroup => {
                total += middleGroup && Array.isArray(middleGroup.subGroups) ? middleGroup.subGroups.length : 0;
            });
        });
        return total;
    }

    // ------------------------------- files ---------------------------------

    function download(filename, content, mimeType) {
        const blob = new Blob([content], { type: mimeType || 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.rel = 'noopener';
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        link.remove();
        // Revoking right away can cancel the download in some browsers.
        global.setTimeout(() => URL.revokeObjectURL(url), 10000);
    }

    /** FileReader instead of fetch(), so it also works on file:// URLs. */
    function readFileAsText(file) {
        return new Promise((resolve, reject) => {
            if (!file) {
                reject(new Error('No file selected.'));
                return;
            }
            if (file.size > MAX_FILE_SIZE) {
                reject(new Error('The file is larger than 32 MB and was not read.'));
                return;
            }
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.onerror = () => reject(new Error('The file could not be read: ' +
                (reader.error && reader.error.message ? reader.error.message : 'unknown error')));
            reader.readAsText(file);
        });
    }

    GAM.storage = {
        isAvailable: isAvailable,
        loadTree: loadTree,
        saveTree: saveTree,
        clearTree: clearTree,
        saveSnapshot: saveSnapshot,
        loadSnapshot: loadSnapshot,
        hasSnapshot: hasSnapshot,
        snapshotLabel: snapshotLabel,
        clearSnapshot: clearSnapshot,
        toProjectFile: toProjectFile,
        fromProjectFile: fromProjectFile,
        download: download,
        readFileAsText: readFileAsText
    };
})(window);
