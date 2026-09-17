// ---------------------------------------------------------------------------
// DataPoint type catalogue helpers.
// ---------------------------------------------------------------------------
(function (global) {
    'use strict';

    const GAM = (global.GAM = global.GAM || {});
    const ALL = Array.isArray(GAM.DPT_TYPES) ? GAM.DPT_TYPES : [];
    const BY_ID = new Map(ALL.map(item => [item.id, item]));

    function exists(id) {
        return BY_ID.has(id);
    }

    function find(id) {
        return BY_ID.get(id) || null;
    }

    function nameOf(id) {
        const item = BY_ID.get(id);
        return item ? item.name : '';
    }

    function label(id) {
        const item = BY_ID.get(id);
        return item ? item.id + ' - ' + item.name : id;
    }

    function matches(query) {
        const needle = String(query || '').trim().toLowerCase();
        if (!needle) return ALL.slice();
        return ALL.filter(item =>
            item.id.toLowerCase().indexOf(needle) !== -1 ||
            item.name.toLowerCase().indexOf(needle) !== -1);
    }

    /** Groups the (sorted) catalogue by its main type, e.g. "DPST-1". */
    function grouped(items) {
        const groups = [];
        let current = null;
        items.forEach(item => {
            const mainType = item.id.split('-')[1] || '?';
            if (!current || current.mainType !== mainType) {
                current = { mainType: mainType, label: '', items: [] };
                groups.push(current);
            }
            current.items.push(item);
        });
        groups.forEach(group => {
            group.label = 'DPST-' + group.mainType + ' (' + group.items.length + ')';
        });
        return groups;
    }

    GAM.dpt = {
        all: ALL,
        byId: BY_ID,
        exists: exists,
        find: find,
        nameOf: nameOf,
        label: label,
        matches: matches,
        grouped: grouped
    };
})(window);
