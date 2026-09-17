// ---------------------------------------------------------------------------
// ETS 6 group address export format ("http://knx.org/xml/ga-export/01").
//
// Serialization builds a real XML document and lets XMLSerializer escape the
// values, so names containing &, <, >, " or ' can never produce a broken file.
// Parsing uses DOMParser, which never resolves external entities or downloads
// anything referenced by the document.
// ---------------------------------------------------------------------------
(function (global) {
    'use strict';

    const GAM = (global.GAM = global.GAM || {});
    const NAMESPACE = 'http://knx.org/xml/ga-export/01';
    const LIMITS = GAM.LIMITS;

    // ------------------------------ helpers --------------------------------

    function toNumber(value) {
        if (value === null || value === undefined) return null;
        const text = String(value).trim();
        if (!/^[+-]?\d+$/.test(text)) return null;
        return Number(text);
    }

    function inRange(value, limits) {
        return Number.isInteger(value) && value >= limits.min && value <= limits.max;
    }

    /** Direct children only, independent of any namespace prefix. */
    function childElements(parent, localName) {
        return Array.prototype.filter.call(parent.children || [], element => element.localName === localName);
    }

    function ensureMain(mainGroups, index, name) {
        let mainGroup = mainGroups.find(group => group.index === index);
        if (!mainGroup) {
            mainGroup = { name: name || '', index: index, middleGroups: [] };
            mainGroups.push(mainGroup);
        } else if (!mainGroup.name && name) {
            mainGroup.name = name;
        }
        return mainGroup;
    }

    function ensureMiddle(mainGroups, mainIndex, middleIndex, name) {
        const mainGroup = ensureMain(mainGroups, mainIndex, '');
        let middleGroup = mainGroup.middleGroups.find(group => group.index === middleIndex);
        if (!middleGroup) {
            middleGroup = { name: name || '', index: middleIndex, subGroups: [] };
            mainGroup.middleGroups.push(middleGroup);
        } else if (!middleGroup.name && name) {
            middleGroup.name = name;
        }
        return middleGroup;
    }

    function findMiddle(mainGroups, mainIndex, middleIndex) {
        const mainGroup = mainGroups.find(group => group.index === mainIndex);
        if (!mainGroup) return null;
        return mainGroup.middleGroups.find(group => group.index === middleIndex) || null;
    }

    function findFreeMainIndex(mainGroups, preferred) {
        let index = inRange(preferred, LIMITS.MAIN) ? preferred : LIMITS.MAIN.min;
        const used = mainGroups.map(group => group.index);
        while (used.indexOf(index) !== -1 && index <= LIMITS.MAIN.max) index += 1;
        return index <= LIMITS.MAIN.max ? index : LIMITS.MAIN.min;
    }

    function nextFreeSubIndex(mainGroups, mainIndex, middleIndex) {
        const middleGroup = findMiddle(mainGroups, mainIndex, middleIndex);
        const used = middleGroup ? middleGroup.subGroups.map(group => group.index) : [];
        for (let index = LIMITS.SUB.min; index <= LIMITS.SUB.max; index += 1) {
            if (used.indexOf(index) === -1) return index;
        }
        return null;
    }

    function exampleList(values, limit) {
        const shown = values.slice(0, limit === undefined ? 3 : limit);
        const suffix = values.length > shown.length ? ', ...' : '';
        return shown.map(value => '"' + value + '"').join(', ') + suffix;
    }

    function findParseError(doc) {
        const element = doc.getElementsByTagName('parsererror')[0];
        if (!element) return '';
        return (element.textContent || 'unknown error').replace(/\s+/g, ' ').trim().slice(0, 300);
    }

    // ------------------------------ formatting -----------------------------

    /**
     * Adds line breaks and indentation to a serialized document. The scan is
     * quote aware, so a "><" inside an attribute value is not mistaken for a
     * tag boundary and the formatting can never alter the data.
     */
    function formatXml(xml, indent) {
        const unit = indent === undefined ? '  ' : indent;
        const lines = [];
        let depth = 0;
        let buffer = '';
        let index = 0;

        while (index < xml.length) {
            if (xml[index] !== '<') {
                buffer += xml[index];
                index += 1;
                continue;
            }

            if (buffer.trim()) {
                lines.push(unit.repeat(depth) + buffer.trim());
                buffer = '';
            }

            let cursor = index + 1;
            let quote = null;
            while (cursor < xml.length) {
                const char = xml[cursor];
                if (quote) {
                    if (char === quote) quote = null;
                } else if (char === '"' || char === "'") {
                    quote = char;
                } else if (char === '>') {
                    break;
                }
                cursor += 1;
            }

            const tag = xml.slice(index, cursor + 1);
            const isClosing = tag.indexOf('</') === 0;
            const isStandalone = tag.slice(-2) === '/>' || tag.indexOf('<?') === 0 || tag.indexOf('<!') === 0;

            if (isClosing) depth = Math.max(0, depth - 1);
            lines.push(unit.repeat(depth) + tag);
            if (!isClosing && !isStandalone) depth += 1;

            index = cursor + 1;
        }

        if (buffer.trim()) lines.push(unit.repeat(depth) + buffer.trim());
        return lines.join('\n');
    }

    // ------------------------------ writing --------------------------------

    /** Builds the DOM document for a tree. */
    function toDocument(tree) {
        const doc = document.implementation.createDocument(NAMESPACE, 'GroupAddress-Export', null);
        const root = doc.documentElement;

        (tree && tree.mainGroups ? tree.mainGroups : []).forEach(mainGroup => {
            const mainElement = doc.createElementNS(NAMESPACE, 'GroupRange');
            const mainStart = GAM.addresses.toAddressNumber(mainGroup.index, 1, 0);
            mainElement.setAttribute('Name', mainGroup.name || '');
            mainElement.setAttribute('RangeStart', String(mainStart));
            mainElement.setAttribute('RangeEnd', String(mainStart + 2047));

            mainGroup.middleGroups.forEach(middleGroup => {
                const middleElement = doc.createElementNS(NAMESPACE, 'GroupRange');
                const middleStart = GAM.addresses.toAddressNumber(mainGroup.index, middleGroup.index, 0);
                middleElement.setAttribute('Name', middleGroup.name || '');
                middleElement.setAttribute('RangeStart', String(middleStart));
                middleElement.setAttribute('RangeEnd', String(middleStart + 255));

                middleGroup.subGroups.forEach(subGroup => {
                    const addressElement = doc.createElementNS(NAMESPACE, 'GroupAddress');
                    addressElement.setAttribute('Name', subGroup.name || '');
                    addressElement.setAttribute('Address',
                        GAM.addresses.format(mainGroup.index, middleGroup.index, subGroup.index));
                    if (subGroup.dpTypes && subGroup.dpTypes.length) {
                        addressElement.setAttribute('DPTs', subGroup.dpTypes.join(' '));
                    }
                    middleElement.appendChild(addressElement);
                });

                mainElement.appendChild(middleElement);
            });

            root.appendChild(mainElement);
        });

        return doc;
    }

    /** @returns {string} a complete, pretty printed ETS group address export. */
    function serialize(tree) {
        const raw = new XMLSerializer().serializeToString(toDocument(tree));
        return '<?xml version="1.0" encoding="utf-8" standalone="yes"?>\n' + formatXml(raw);
    }

    // ------------------------------ reading --------------------------------

    /**
     * Parses an exported file into a tree.
     * Nothing is thrown and nothing is imported unless ok === true, so a broken
     * file can never destroy the data that is currently being edited.
     *
     * @returns {{ok: boolean, tree: ?GroupAddressTree, errors: string[],
     *            warnings: string[], stats: ?object}}
     */
    function parse(xmlText) {
        const result = { ok: false, tree: null, errors: [], warnings: [], stats: null };

        if (typeof xmlText !== 'string' || !xmlText.trim()) {
            result.errors.push('The file is empty.');
            return result;
        }

        const doc = new DOMParser().parseFromString(xmlText, 'application/xml');
        const parseError = findParseError(doc);
        if (parseError) {
            result.errors.push('The file is not valid XML: ' + parseError);
            return result;
        }

        const root = doc.documentElement;
        if (!root) {
            result.errors.push('The file does not contain any XML element.');
            return result;
        }
        if (root.localName !== 'GroupAddress-Export') {
            result.warnings.push('Unexpected root element <' + root.localName +
                '> - expected <GroupAddress-Export>.');
        }

        const mainRanges = childElements(root, 'GroupRange');
        if (!mainRanges.length) {
            result.errors.push('No <GroupRange> element was found - this does not look like an ETS ' +
                'group address export.');
            return result;
        }

        const mainGroups = [];
        const problems = {
            mainRangeStart: 0,
            middleRangeStart: 0,
            sequentialAddresses: 0,
            duplicates: 0,
            mismatched: 0,
            twoLevel: [],
            unparsable: [],
            outOfRange: []
        };

        mainRanges.forEach((mainRange, mainPosition) => {
            const mainStart = toNumber(mainRange.getAttribute('RangeStart'));
            let mainIndex = mainStart === null ? null : GAM.addresses.mainIndexFromRangeStart(mainStart);
            if (!inRange(mainIndex, LIMITS.MAIN)) {
                mainIndex = findFreeMainIndex(mainGroups, mainPosition + 1);
                problems.mainRangeStart += 1;
            }
            const mainName = mainRange.getAttribute('Name') || '';
            ensureMain(mainGroups, mainIndex, mainName);

            childElements(mainRange, 'GroupRange').forEach((middleRange, middlePosition) => {
                const middleStart = toNumber(middleRange.getAttribute('RangeStart'));
                let middleIndex = middleStart === null ? null : GAM.addresses.middleIndexFromRangeStart(middleStart);
                if (!inRange(middleIndex, LIMITS.MIDDLE)) {
                    middleIndex = Math.min(middlePosition + 1, LIMITS.MIDDLE.max);
                    problems.middleRangeStart += 1;
                }
                const middleName = middleRange.getAttribute('Name') || '';
                ensureMiddle(mainGroups, mainIndex, middleIndex, middleName);

                childElements(middleRange, 'GroupAddress').forEach(addressElement => {
                    const name = addressElement.getAttribute('Name') || '';
                    const dpTypes = GAM.utils.normalizeDpTypes(addressElement.getAttribute('DPTs'));
                    const rawAddress = addressElement.getAttribute('Address');

                    let targetMainIndex = mainIndex;
                    let targetMiddleIndex = middleIndex;
                    let subIndex = null;

                    if (rawAddress === null || rawAddress.trim() === '') {
                        problems.sequentialAddresses += 1;
                        subIndex = nextFreeSubIndex(mainGroups, mainIndex, middleIndex);
                    } else {
                        const parsed = GAM.addresses.parse(rawAddress);
                        if (!parsed) {
                            problems.unparsable.push(rawAddress);
                            return;
                        }
                        if (parsed.level !== 3) {
                            problems.twoLevel.push(rawAddress);
                            return;
                        }
                        if (!inRange(parsed.mainIndex, LIMITS.MAIN) ||
                            !inRange(parsed.middleIndex, LIMITS.MIDDLE) ||
                            !inRange(parsed.subIndex, LIMITS.SUB)) {
                            problems.outOfRange.push(rawAddress);
                            return;
                        }

                        const sameRange = parsed.mainIndex === mainIndex && parsed.middleIndex === middleIndex;
                        if (!sameRange) problems.mismatched += 1;

                        // The address attribute is authoritative for the real
                        // group address, so the entry is filed where it points.
                        targetMainIndex = parsed.mainIndex;
                        targetMiddleIndex = parsed.middleIndex;
                        ensureMain(mainGroups, targetMainIndex, sameRange ? mainName : '');
                        ensureMiddle(mainGroups, targetMainIndex, targetMiddleIndex, sameRange ? middleName : '');
                        subIndex = parsed.subIndex;
                    }

                    if (subIndex === null) return; // range already holds 256 addresses
                    const middleGroup = findMiddle(mainGroups, targetMainIndex, targetMiddleIndex);
                    if (!middleGroup) return;
                    if (middleGroup.subGroups.some(group => group.index === subIndex)) {
                        problems.duplicates += 1;
                        return;
                    }
                    middleGroup.subGroups.push({ name: name, index: subIndex, dpTypes: dpTypes });
                });
            });
        });

        if (problems.twoLevel.length) {
            result.errors.push('The file contains ' + problems.twoLevel.length + ' two level address(es) (' +
                exampleList(problems.twoLevel) + '). This editor only supports three level group addresses ' +
                '(main / middle / subgroup), so the file was not imported.');
            return result;
        }

        const tree = new GAM.GroupAddressTree(mainGroups);
        result.tree = tree;
        result.stats = tree.counts();
        result.ok = true;

        if (problems.mainRangeStart) {
            result.warnings.push(problems.mainRangeStart + ' main range(s) had no usable RangeStart - ' +
                'indices were assigned in file order.');
        }
        if (problems.middleRangeStart) {
            result.warnings.push(problems.middleRangeStart + ' middle range(s) had no usable RangeStart - ' +
                'indices were assigned in file order.');
        }
        if (problems.sequentialAddresses) {
            result.warnings.push(problems.sequentialAddresses + ' group address(es) had no Address attribute - ' +
                'they were numbered sequentially.');
        }
        if (problems.mismatched) {
            result.warnings.push(problems.mismatched + ' group address(es) did not match the range they were ' +
                'listed in - the address itself was used.');
        }
        if (problems.duplicates) {
            result.warnings.push(problems.duplicates + ' duplicate group address(es) were ignored.');
        }
        if (problems.unparsable.length) {
            result.warnings.push(problems.unparsable.length + ' address(es) could not be read and were skipped (' +
                exampleList(problems.unparsable) + ').');
        }
        if (problems.outOfRange.length) {
            result.warnings.push(problems.outOfRange.length + ' address(es) were outside the valid range and were ' +
                'skipped (' + exampleList(problems.outOfRange) + ').');
        }

        return result;
    }

    GAM.xml = {
        NAMESPACE: NAMESPACE,
        serialize: serialize,
        parse: parse,
        formatXml: formatXml,
        toDocument: toDocument
    };
})(window);
