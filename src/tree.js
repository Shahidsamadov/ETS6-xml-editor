// ---------------------------------------------------------------------------
// Group address tree model.
//
// The whole application works on this model only - the DOM layer never touches
// the raw arrays. Every mutation validates its input *before* changing anything
// and returns { ok, errors, warnings }, so data can never be lost because of a
// failed validation.
//
// Data shape:
//   mainGroups: [{ name, index, middleGroups: [{ name, index, subGroups: [
//     { name, index, dpTypes: ['DPST-1-001'] }
//   ] }] }]
//
// Indices are 1-based on the main/middle level (as shown in ETS) and 0..255 on
// the subgroup level, which is exactly how the KNX group address is stored in
// a three level address: (main - 1) / (middle - 1) / sub.
// ---------------------------------------------------------------------------
(function (global) {
    'use strict';

    const GAM = (global.GAM = global.GAM || {});

    const LIMITS = Object.freeze({
        MAIN: Object.freeze({ min: 1, max: 32 }),
        MIDDLE: Object.freeze({ min: 1, max: 8 }),
        SUB: Object.freeze({ min: 0, max: 255 })
    });

    const ADDRESSES_PER_MAIN = 2048;
    const ADDRESSES_PER_MIDDLE = 256;
    const MAX_ADDRESS_NUMBER = LIMITS.MAIN.max * ADDRESSES_PER_MAIN - 1;

    // ------------------------------ helpers --------------------------------

    function isIntegerInRange(value, limits) {
        return Number.isInteger(value) && value >= limits.min && value <= limits.max;
    }

    function toIndex(value) {
        if (value === null || value === undefined || value === '') return null;
        if (typeof value === 'number') return Number.isInteger(value) ? value : null;
        const text = String(value).trim();
        if (!/^\d+$/.test(text)) return null;
        return Number(text);
    }

    function toText(value) {
        return value === null || value === undefined ? '' : String(value);
    }

    /** Normalizes "DPST-1-001 DPST-1-002" / ['DPST-1-001'] / '' into an array. */
    function normalizeDpTypes(value) {
        if (!value) return [];
        const list = Array.isArray(value) ? value : String(value).split(/[\s,;]+/);
        const seen = [];
        list.forEach(item => {
            const id = String(item).trim();
            if (id && seen.indexOf(id) === -1) seen.push(id);
        });
        return seen;
    }

    function clone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    /** (mainIndex, middleIndex, subIndex) -> address number, e.g. 1/1/0 -> 0. */
    function toAddressNumber(mainIndex, middleIndex, subIndex) {
        return (mainIndex - 1) * ADDRESSES_PER_MAIN + (middleIndex - 1) * ADDRESSES_PER_MIDDLE + subIndex;
    }

    /** (1, 1, 5) -> "0/0/5" (the format used by the ETS group address export). */
    function formatAddress(mainIndex, middleIndex, subIndex) {
        return (mainIndex - 1) + '/' + (middleIndex - 1) + '/' + subIndex;
    }

    /**
     * Parses an address attribute of a group address export.
     * Returns null for anything that is not a 2 or 3 level address.
     */
    function parseAddress(value) {
        if (typeof value !== 'string') return null;
        const parts = value.trim().split('/');
        if (parts.length !== 2 && parts.length !== 3) return null;

        const numbers = parts.map(part => (/^\d+$/.test(part.trim()) ? Number(part.trim()) : NaN));
        if (numbers.some(number => !Number.isInteger(number))) return null;

        if (parts.length === 2) {
            // Two level address (main / sub) - not representable in this editor.
            return { level: 2, mainIndex: numbers[0] + 1, subIndex: numbers[1], raw: value };
        }
        return {
            level: 3,
            mainIndex: numbers[0] + 1,
            middleIndex: numbers[1] + 1,
            subIndex: numbers[2],
            raw: value
        };
    }

    function mainIndexFromRangeStart(rangeStart) {
        return Math.floor(rangeStart / ADDRESSES_PER_MAIN) + 1;
    }

    function middleIndexFromRangeStart(rangeStart) {
        return Math.floor((rangeStart % ADDRESSES_PER_MAIN) / ADDRESSES_PER_MIDDLE) + 1;
    }

    /** Tolerates hand edited or third party JSON, drops what cannot be used. */
    function normalizeMainGroups(input) {
        const result = [];
        if (!Array.isArray(input)) return result;

        input.forEach(rawMain => {
            if (!rawMain || typeof rawMain !== 'object') return;
            const mainIndex = toIndex(rawMain.index);
            if (!isIntegerInRange(mainIndex, LIMITS.MAIN)) return;

            const mainGroup = findOrCreateMain(result, mainIndex, toText(rawMain.name));

            (Array.isArray(rawMain.middleGroups) ? rawMain.middleGroups : []).forEach(rawMiddle => {
                if (!rawMiddle || typeof rawMiddle !== 'object') return;
                const middleIndex = toIndex(rawMiddle.index);
                if (!isIntegerInRange(middleIndex, LIMITS.MIDDLE)) return;

                const middleGroup = findOrCreateMiddle(mainGroup, middleIndex, toText(rawMiddle.name));

                (Array.isArray(rawMiddle.subGroups) ? rawMiddle.subGroups : []).forEach(rawSub => {
                    if (!rawSub || typeof rawSub !== 'object') return;
                    const subIndex = toIndex(rawSub.index);
                    if (!isIntegerInRange(subIndex, LIMITS.SUB)) return;
                    if (middleGroup.subGroups.some(sub => sub.index === subIndex)) return;

                    middleGroup.subGroups.push({
                        name: toText(rawSub.name),
                        index: subIndex,
                        // "dataPoint" is the legacy field name of older exports.
                        dpTypes: normalizeDpTypes(rawSub.dpTypes || rawSub.dataPoint)
                    });
                });
            });
        });

        return result;
    }

    function findOrCreateMain(mainGroups, index, name) {
        let mainGroup = mainGroups.find(item => item.index === index);
        if (!mainGroup) {
            mainGroup = { name: name, index: index, middleGroups: [] };
            mainGroups.push(mainGroup);
        } else if (!mainGroup.name && name) {
            mainGroup.name = name;
        }
        return mainGroup;
    }

    function findOrCreateMiddle(mainGroup, index, name) {
        let middleGroup = mainGroup.middleGroups.find(item => item.index === index);
        if (!middleGroup) {
            middleGroup = { name: name, index: index, subGroups: [] };
            mainGroup.middleGroups.push(middleGroup);
        } else if (!middleGroup.name && name) {
            middleGroup.name = name;
        }
        return middleGroup;
    }

    function sortTree(mainGroups) {
        mainGroups.sort((a, b) => a.index - b.index);
        mainGroups.forEach(mainGroup => {
            mainGroup.middleGroups.sort((a, b) => a.index - b.index);
            mainGroup.middleGroups.forEach(middleGroup => {
                middleGroup.subGroups.sort((a, b) => a.index - b.index);
            });
        });
    }

    // ------------------------------- model ---------------------------------

    class GroupAddressTree {
        constructor(mainGroups) {
            this._mainGroups = [];
            this.replaceAll(mainGroups);
        }

        get mainGroups() {
            return this._mainGroups;
        }

        static fromJSON(data) {
            if (!data || typeof data !== 'object') return new GroupAddressTree([]);
            return new GroupAddressTree(data.mainGroups || data);
        }

        // ---------------------------- queries ------------------------------

        findMainGroup(index) {
            return this._mainGroups.find(group => group.index === index) || null;
        }

        findMiddleGroup(mainIndex, middleIndex) {
            const mainGroup = this.findMainGroup(mainIndex);
            if (!mainGroup) return null;
            return mainGroup.middleGroups.find(group => group.index === middleIndex) || null;
        }

        /**
         * Looks up the entry referenced by the UI. A ref with subIndex === null
         * points at a middle group that has no subgroup (yet).
         */
        findEntry(ref) {
            if (!ref) return null;
            const mainGroup = this.findMainGroup(ref.mainIndex);
            if (!mainGroup) return null;
            const middleGroup = mainGroup.middleGroups.find(group => group.index === ref.middleIndex);
            if (!middleGroup) return null;

            if (ref.subIndex === null || ref.subIndex === undefined) {
                return {
                    mainGroup: mainGroup,
                    middleGroup: middleGroup,
                    subGroup: null,
                    ref: { mainIndex: mainGroup.index, middleIndex: middleGroup.index, subIndex: null }
                };
            }

            const subGroup = middleGroup.subGroups.find(group => group.index === ref.subIndex);
            if (!subGroup) return null;
            return {
                mainGroup: mainGroup,
                middleGroup: middleGroup,
                subGroup: subGroup,
                ref: { mainIndex: mainGroup.index, middleIndex: middleGroup.index, subIndex: subGroup.index }
            };
        }

        hasSubGroup(mainIndex, middleIndex, subIndex) {
            const middleGroup = this.findMiddleGroup(mainIndex, middleIndex);
            if (!middleGroup) return false;
            return middleGroup.subGroups.some(group => group.index === subIndex);
        }

        /** Smallest still unused index on the requested level, null when full. */
        nextMainIndex() {
            for (let index = LIMITS.MAIN.min; index <= LIMITS.MAIN.max; index += 1) {
                if (!this.findMainGroup(index)) return index;
            }
            return null;
        }

        nextMiddleIndex(mainIndex) {
            const mainGroup = this.findMainGroup(mainIndex);
            const used = mainGroup ? mainGroup.middleGroups.map(group => group.index) : [];
            for (let index = LIMITS.MIDDLE.min; index <= LIMITS.MIDDLE.max; index += 1) {
                if (used.indexOf(index) === -1) return index;
            }
            return null;
        }

        nextSubGroupIndex(mainIndex, middleIndex) {
            const middleGroup = this.findMiddleGroup(mainIndex, middleIndex);
            const used = middleGroup ? middleGroup.subGroups.map(group => group.index) : [];
            for (let index = LIMITS.SUB.min; index <= LIMITS.SUB.max; index += 1) {
                if (used.indexOf(index) === -1) return index;
            }
            return null;
        }

        /** Flat, sorted list of table rows. */
        rows() {
            const rows = [];
            this._mainGroups.forEach(mainGroup => {
                mainGroup.middleGroups.forEach(middleGroup => {
                    if (middleGroup.subGroups.length === 0) {
                        rows.push({
                            address: null,
                            addressNumber: null,
                            mainGroup: mainGroup,
                            middleGroup: middleGroup,
                            subGroup: null,
                            ref: { mainIndex: mainGroup.index, middleIndex: middleGroup.index, subIndex: null }
                        });
                        return;
                    }
                    middleGroup.subGroups.forEach(subGroup => {
                        rows.push({
                            address: formatAddress(mainGroup.index, middleGroup.index, subGroup.index),
                            addressNumber: toAddressNumber(mainGroup.index, middleGroup.index, subGroup.index),
                            mainGroup: mainGroup,
                            middleGroup: middleGroup,
                            subGroup: subGroup,
                            ref: { mainIndex: mainGroup.index, middleIndex: middleGroup.index, subIndex: subGroup.index }
                        });
                    });
                });
            });
            return rows;
        }

        counts() {
            let middleGroups = 0;
            let subGroups = 0;
            const dataPointTypes = [];
            this._mainGroups.forEach(mainGroup => {
                middleGroups += mainGroup.middleGroups.length;
                mainGroup.middleGroups.forEach(middleGroup => {
                    subGroups += middleGroup.subGroups.length;
                    middleGroup.subGroups.forEach(subGroup => {
                        subGroup.dpTypes.forEach(id => {
                            if (dataPointTypes.indexOf(id) === -1) dataPointTypes.push(id);
                        });
                    });
                });
            });
            return {
                mainGroups: this._mainGroups.length,
                middleGroups: middleGroups,
                subGroups: subGroups,
                dataPointTypes: dataPointTypes
            };
        }

        isEmpty() {
            return this._mainGroups.length === 0;
        }

        toJSON() {
            return { mainGroups: clone(this._mainGroups) };
        }

        // ---------------------------- validation ---------------------------

        /**
         * Checks a form payload without touching the tree.
         * @returns {{errors: Array<{field: string, message: string}>, warnings: string[]}}
         */
        validateEntry(entry, options) {
            const context = options || {};
            const errors = [];
            const warnings = [];
            const push = (field, message) => errors.push({ field: field, message: message });

            if (!entry || typeof entry !== 'object') {
                push('general', 'Nothing to save.');
                return { errors: errors, warnings: warnings };
            }

            // --- main group ---
            if (!toText(entry.mainName).trim()) {
                push('mainName', 'Main Group Name is required.');
            }
            if (!isIntegerInRange(entry.mainIndex, LIMITS.MAIN)) {
                push('mainIndex', 'Main Group Index must be a whole number between ' +
                    LIMITS.MAIN.min + ' and ' + LIMITS.MAIN.max + '.');
            }

            // --- middle group ---
            if (!toText(entry.middleName).trim()) {
                push('middleName', 'Middle Group Name is required.');
            }
            if (!isIntegerInRange(entry.middleIndex, LIMITS.MIDDLE)) {
                push('middleIndex', 'Middle Group Index must be a whole number between ' +
                    LIMITS.MIDDLE.min + ' and ' + LIMITS.MIDDLE.max + '.');
            }

            // --- subgroup ---
            const hasSubIndex = entry.subIndex !== null && entry.subIndex !== undefined;
            if (hasSubIndex && !isIntegerInRange(entry.subIndex, LIMITS.SUB)) {
                push('subIndex', 'Subgroup Index must be a whole number between ' +
                    LIMITS.SUB.min + ' and ' + LIMITS.SUB.max + '.');
            }
            if (!hasSubIndex && toText(entry.subName).trim()) {
                push('subIndex', 'Subgroup Index is required when a Subgroup Name is filled in.');
            }

            if (errors.length) return { errors: errors, warnings: warnings };

            // --- duplicate address ---
            if (hasSubIndex && this.hasSubGroup(entry.mainIndex, entry.middleIndex, entry.subIndex)) {
                const excluded = context.excludeRef;
                const sameEntry = excluded &&
                    excluded.mainIndex === entry.mainIndex &&
                    excluded.middleIndex === entry.middleIndex &&
                    excluded.subIndex === entry.subIndex;
                if (!sameEntry) {
                    push('subIndex', 'Group address ' +
                        formatAddress(entry.mainIndex, entry.middleIndex, entry.subIndex) +
                        ' already exists.');
                }
            }

            return { errors: errors, warnings: warnings };
        }

        // ---------------------------- mutations ----------------------------

        /** Adds an entry, or reuses the existing main/middle groups. */
        addEntry(entry) {
            const validation = this.validateEntry(entry, {});
            if (validation.errors.length) {
                return { ok: false, errors: validation.errors, warnings: validation.warnings, ref: null };
            }

            const warnings = validation.warnings.slice();
            let mainGroup = this.findMainGroup(entry.mainIndex);
            if (!mainGroup) {
                mainGroup = { name: toText(entry.mainName).trim(), index: entry.mainIndex, middleGroups: [] };
                this._mainGroups.push(mainGroup);
            } else if (mainGroup.name !== toText(entry.mainName).trim()) {
                warnings.push('Main Group ' + entry.mainIndex + ' already exists as "' + mainGroup.name +
                    '" - the existing name was kept. Edit the group to rename it.');
            }

            let middleGroup = mainGroup.middleGroups.find(group => group.index === entry.middleIndex);
            if (!middleGroup) {
                middleGroup = { name: toText(entry.middleName).trim(), index: entry.middleIndex, subGroups: [] };
                mainGroup.middleGroups.push(middleGroup);
            } else if (middleGroup.name !== toText(entry.middleName).trim()) {
                warnings.push('Middle Group ' + entry.middleIndex + ' already exists as "' + middleGroup.name +
                    '" - the existing name was kept.');
            }

            if (entry.subIndex !== null && entry.subIndex !== undefined) {
                middleGroup.subGroups.push({
                    name: toText(entry.subName).trim(),
                    index: entry.subIndex,
                    dpTypes: normalizeDpTypes(entry.dpTypes)
                });
            }

            sortTree(this._mainGroups);
            return {
                ok: true,
                errors: [],
                warnings: warnings,
                ref: {
                    mainIndex: entry.mainIndex,
                    middleIndex: entry.middleIndex,
                    subIndex: entry.subIndex === undefined ? null : entry.subIndex
                }
            };
        }

        /**
         * Applies the form payload to an existing entry. Renames the main and
         * middle group in place, moves the entry when the indices changed and
         * cleans up containers that were left empty by the move.
         */
        updateEntry(ref, entry) {
            const found = this.findEntry(ref);
            if (!found) {
                return {
                    ok: false,
                    warnings: [],
                    errors: [{ field: 'general', message: 'The entry that was being edited no longer exists.' }],
                    ref: null
                };
            }

            const validation = this.validateEntry(entry, { excludeRef: found.ref });
            if (validation.errors.length) {
                return { ok: false, errors: validation.errors, warnings: validation.warnings, ref: null };
            }

            const warnings = validation.warnings.slice();
            const mainName = toText(entry.mainName).trim();
            const middleName = toText(entry.middleName).trim();
            const movedContainer = found.mainGroup.index !== entry.mainIndex ||
                found.middleGroup.index !== entry.middleIndex;

            // Detach the edited subgroup first (in memory only - the validation
            // above already guaranteed that the new state is valid).
            if (found.subGroup) {
                found.middleGroup.subGroups = found.middleGroup.subGroups.filter(
                    group => group.index !== found.subGroup.index
                );
            }

            let mainGroup = this.findMainGroup(entry.mainIndex);
            if (!mainGroup) {
                mainGroup = { name: mainName, index: entry.mainIndex, middleGroups: [] };
                this._mainGroups.push(mainGroup);
            } else if (mainGroup === found.mainGroup) {
                mainGroup.name = mainName; // rename in place
            } else if (mainGroup.name !== mainName) {
                warnings.push('The entry was moved into the existing main group ' + entry.mainIndex +
                    ' ("' + mainGroup.name + '") - that group keeps its name.');
            }

            let middleGroup = mainGroup.middleGroups.find(group => group.index === entry.middleIndex);
            if (!middleGroup) {
                middleGroup = { name: middleName, index: entry.middleIndex, subGroups: [] };
                mainGroup.middleGroups.push(middleGroup);
            } else if (middleGroup === found.middleGroup) {
                middleGroup.name = middleName; // rename in place
            } else if (middleGroup.name !== middleName) {
                warnings.push('The entry was moved into the existing middle group ' + entry.middleIndex +
                    ' ("' + middleGroup.name + '") - that group keeps its name.');
            }

            if (entry.subIndex !== null && entry.subIndex !== undefined) {
                middleGroup.subGroups.push({
                    name: toText(entry.subName).trim(),
                    index: entry.subIndex,
                    dpTypes: normalizeDpTypes(entry.dpTypes)
                });
            }

            if (movedContainer) {
                this._pruneEmptyContainers(found.mainGroup.index, found.middleGroup.index);
            }

            sortTree(this._mainGroups);
            return {
                ok: true,
                errors: [],
                warnings: warnings,
                ref: {
                    mainIndex: mainGroup.index,
                    middleIndex: middleGroup.index,
                    subIndex: entry.subIndex === undefined ? null : entry.subIndex
                }
            };
        }

        /** Removes an entry and reports what else disappeared with it. */
        removeEntry(ref) {
            const found = this.findEntry(ref);
            if (!found) {
                return {
                    ok: false,
                    errors: [{ field: 'general', message: 'The entry no longer exists.' }],
                    removed: null
                };
            }

            if (found.subGroup) {
                found.middleGroup.subGroups = found.middleGroup.subGroups.filter(
                    group => group.index !== found.subGroup.index
                );
            }

            const pruned = this._pruneEmptyContainers(found.mainGroup.index, found.middleGroup.index);
            return { ok: true, errors: [], removed: found.subGroup, pruned: pruned };
        }

        /** Removes the given middle group when it is empty, then its main group. */
        _pruneEmptyContainers(mainIndex, middleIndex) {
            const pruned = { middleGroup: null, mainGroup: null };
            const mainGroup = this.findMainGroup(mainIndex);
            if (!mainGroup) return pruned;

            const middleGroup = mainGroup.middleGroups.find(group => group.index === middleIndex);
            if (middleGroup && middleGroup.subGroups.length === 0) {
                mainGroup.middleGroups = mainGroup.middleGroups.filter(group => group !== middleGroup);
                pruned.middleGroup = { name: middleGroup.name, index: middleGroup.index };
            }
            if (mainGroup.middleGroups.length === 0) {
                this._mainGroups = this._mainGroups.filter(group => group !== mainGroup);
                pruned.mainGroup = { name: mainGroup.name, index: mainGroup.index };
            }
            return pruned;
        }

        // ---------------------------- bulk ---------------------------------

        replaceAll(mainGroups) {
            this._mainGroups = normalizeMainGroups(mainGroups);
            sortTree(this._mainGroups);
            return this;
        }

        clear() {
            this._mainGroups = [];
            return this;
        }

        isSameAs(other) {
            return JSON.stringify(this.toJSON()) === JSON.stringify(other.toJSON());
        }
    }

    GAM.LIMITS = LIMITS;
    GAM.MAX_ADDRESS_NUMBER = MAX_ADDRESS_NUMBER;
    GAM.GroupAddressTree = GroupAddressTree;

    GAM.addresses = {
        toAddressNumber: toAddressNumber,
        format: formatAddress,
        parse: parseAddress,
        mainIndexFromRangeStart: mainIndexFromRangeStart,
        middleIndexFromRangeStart: middleIndexFromRangeStart
    };

    GAM.utils = {
        normalizeDpTypes: normalizeDpTypes,
        toIndex: toIndex,
        toText: toText,
        clone: clone,
        sortTree: sortTree
    };
})(window);
