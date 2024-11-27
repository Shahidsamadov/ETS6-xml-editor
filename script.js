const groupData = [];
let editMode = null;

const dataPointTypes = [
    { id: "DPST-1-001", name: "DPT_Switch" },
    { id: "DPST-1-002", name: "DPT_Bool" },
    { id: "DPST-1-003", name: "DPT_Enable" },
    { id: "DPST-1-004", name: "DPT_Ramp" },
    { id: "DPST-1-005", name: "DPT_Alarm" },
    // Добавьте остальные DataPoint Types
];

// Инициализация выпадающего списка DataPoint
function initializeDataPointDropdown() {
    const dataPointSelect = document.getElementById('dataPoint');
    dataPointTypes.forEach(dp => {
        const option = document.createElement('option');
        option.value = dp.id;
        option.textContent = `${dp.id} - ${dp.name}`;
        dataPointSelect.appendChild(option);
    });
}
initializeDataPointDropdown();

function addGroup() {
    const mainGroupName = document.getElementById('mainGroupName').value.trim();
    const mainGroupIndex = parseInt(document.getElementById('mainGroupIndex').value.trim());
    const middleGroupName = document.getElementById('middleGroupName').value.trim();
    const middleGroupIndex = parseInt(document.getElementById('middleGroupIndex').value.trim());
    const subGroupName = document.getElementById('subGroupName').value.trim();
    const subGroupIndex = parseInt(document.getElementById('subGroupIndex').value.trim());
    const dataPointType = document.getElementById('dataPoint').value;

    if (!mainGroupName || isNaN(mainGroupIndex) || !middleGroupName || isNaN(middleGroupIndex)) {
        alert('Main Group and Middle Group names and indices are required.');
        return;
    }

    if ((mainGroupIndex < 1 || mainGroupIndex > 32) ||
        (middleGroupIndex < 1 || middleGroupIndex > 8) ||
        (subGroupIndex && (subGroupIndex < 1 || subGroupIndex > 255))) {
        alert('Please provide valid indices: Main (1-32), Middle (1-8), Subgroup (1-255).');
        return;
    }

    if (editMode) {
        updateGroup(mainGroupName, mainGroupIndex, middleGroupName, middleGroupIndex, subGroupName, subGroupIndex, dataPointType);
        return;
    }

    let mainGroup = groupData.find(group => group.index === mainGroupIndex);
    if (!mainGroup) {
        mainGroup = {
            name: mainGroupName,
            index: mainGroupIndex,
            middleGroups: []
        };
        groupData.push(mainGroup);
    }

    let middleGroup = mainGroup.middleGroups.find(group => group.index === middleGroupIndex);
    if (!middleGroup) {
        middleGroup = {
            name: middleGroupName,
            index: middleGroupIndex,
            subGroups: []
        };
        mainGroup.middleGroups.push(middleGroup);
    }

    if (subGroupName && subGroupIndex) {
        middleGroup.subGroups.push({
            name: subGroupName,
            index: subGroupIndex,
            dataPoint: dataPointType
        });
    }

    updateTable();
    clearForm();
}

function updateGroup(mainGroupName, mainGroupIndex, middleGroupName, middleGroupIndex, subGroupName, subGroupIndex, dataPointType) {
    const { mainIndex, middleIndex, subIndex } = editMode;

    const mainGroup = groupData.find(group => group.index === mainIndex);
    const middleGroup = mainGroup.middleGroups.find(group => group.index === middleIndex);

    if (subIndex) {
        middleGroup.subGroups = middleGroup.subGroups.filter(group => group.index !== subIndex);
    }

    if (middleGroup.subGroups.length === 0 && middleGroupIndex !== middleIndex) {
        mainGroup.middleGroups = mainGroup.middleGroups.filter(group => group.index !== middleIndex);
    }

    if (mainGroup.middleGroups.length === 0 && mainGroupIndex !== mainIndex) {
        groupData.splice(groupData.indexOf(mainGroup), 1);
    }

    editMode = null;
    addGroup();
}

function editGroup(mainIndex, middleIndex, subIndex) {
    const mainGroup = groupData.find(group => group.index === mainIndex);
    const middleGroup = mainGroup.middleGroups.find(group => group.index === middleIndex);
    const subGroup = subIndex ? middleGroup.subGroups.find(group => group.index === subIndex) : null;

    document.getElementById('mainGroupName').value = mainGroup.name;
    document.getElementById('mainGroupIndex').value = mainGroup.index;
    document.getElementById('middleGroupName').value = middleGroup.name;
    document.getElementById('middleGroupIndex').value = middleGroup.index;
    document.getElementById('subGroupName').value = subGroup ? subGroup.name : '';
    document.getElementById('subGroupIndex').value = subGroup ? subGroup.index : '';
    document.getElementById('dataPoint').value = subGroup ? subGroup.dataPoint : '';

    editMode = { mainIndex, middleIndex, subIndex };
}

function deleteGroup(mainIndex, middleIndex, subIndex) {
    const mainGroup = groupData.find(group => group.index === mainIndex);
    const middleGroup = mainGroup.middleGroups.find(group => group.index === middleIndex);

    if (subIndex) {
        middleGroup.subGroups = middleGroup.subGroups.filter(group => group.index !== subIndex);
        if (middleGroup.subGroups.length === 0) {
            mainGroup.middleGroups = mainGroup.middleGroups.filter(group => group.index !== middleIndex);
        }
        if (mainGroup.middleGroups.length === 0) {
            groupData.splice(groupData.indexOf(mainGroup), 1);
        }
    } else {
        mainGroup.middleGroups = mainGroup.middleGroups.filter(group => group.index !== middleIndex);
        if (mainGroup.middleGroups.length === 0) {
            groupData.splice(groupData.indexOf(mainGroup), 1);
        }
    }

    updateTable();
}

function updateTable() {
    const tableBody = document.getElementById('groupTable');
    tableBody.innerHTML = '';

    groupData.forEach(mainGroup => {
        mainGroup.middleGroups.forEach(middleGroup => {
            middleGroup.subGroups.forEach(subGroup => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${mainGroup.name} (${mainGroup.index})</td>
                    <td>${middleGroup.name} (${middleGroup.index})</td>
                    <td>${subGroup.name || ''} (${subGroup.index || ''}) - ${subGroup.dataPoint || ''}</td>
                    <td>
                        <button onclick="editGroup(${mainGroup.index}, ${middleGroup.index}, ${subGroup.index})">Edit</button>
                        <button onclick="deleteGroup(${mainGroup.index}, ${middleGroup.index}, ${subGroup.index})">Delete</button>
                    </td>
                `;
                tableBody.appendChild(row);
            });

            if (middleGroup.subGroups.length === 0) {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${mainGroup.name} (${mainGroup.index})</td>
                    <td>${middleGroup.name} (${middleGroup.index})</td>
                    <td>No Subgroups</td>
                    <td>
                        <button onclick="editGroup(${mainGroup.index}, ${middleGroup.index})">Edit</button>
                        <button onclick="deleteGroup(${mainGroup.index}, ${middleGroup.index})">Delete</button>
                    </td>
                `;
                tableBody.appendChild(row);
            }
        });
    });
}

function clearForm() {
    document.getElementById('mainGroupName').value = '';
    document.getElementById('mainGroupIndex').value = '';
    document.getElementById('middleGroupName').value = '';
    document.getElementById('middleGroupIndex').value = '';
    document.getElementById('subGroupName').value = '';
    document.getElementById('subGroupIndex').value = '';
    document.getElementById('dataPoint').selectedIndex = 0;
    editMode = null;
}

function importFromXML() {
    const fileInput = document.getElementById('importXML');
    const file = fileInput.files[0];

    if (!file) {
        alert('Please select an XML file to import.');
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(e.target.result, "text/xml");

        const groupRanges = xmlDoc.getElementsByTagName('GroupRange');
        groupData.length = 0;

        for (let i = 0; i < groupRanges.length; i++) {
            const mainRange = groupRanges[i];

            if (mainRange.parentElement.tagName === 'GroupRange') continue;

            const mainGroupName = mainRange.getAttribute('Name');
            const mainGroupIndex = Math.floor(parseInt(mainRange.getAttribute('RangeStart')) / 2048) + 1;

            const middleGroups = mainRange.getElementsByTagName('GroupRange');
            const mainGroup = {
                name: mainGroupName,
                index: mainGroupIndex,
                middleGroups: []
            };

            for (let j = 0; j < middleGroups.length; j++) {
                const middleRange = middleGroups[j];

                if (middleRange.parentElement !== mainRange) continue;

                const middleGroupName = middleRange.getAttribute('Name');
                const middleGroupIndex = Math.floor((parseInt(middleRange.getAttribute('RangeStart')) % 2048) / 256) + 1;

                const subGroups = middleRange.getElementsByTagName('GroupAddress');
                const middleGroup = {
                    name: middleGroupName,
                    index: middleGroupIndex,
                    subGroups: []
                };

                for (let k = 0; k < subGroups.length; k++) {
                    const subGroup = subGroups[k];

                    const subGroupName = subGroup.getAttribute('Name');
                    const addressParts = subGroup.getAttribute('Address').split('/');
                    const subGroupIndex = parseInt(addressParts[2]);
                    const dataPoint = subGroup.getAttribute('DPTs');

                    middleGroup.subGroups.push({
                        name: subGroupName,
                        index: subGroupIndex,
                        dataPoint: dataPoint || ''
                    });
                }

                mainGroup.middleGroups.push(middleGroup);
            }

            groupData.push(mainGroup);
        }

        updateTable();
        alert('XML imported successfully!');
    };

    reader.readAsText(file);
}

function exportToXML() {
    let xml = `<?xml version="1.0" encoding="utf-8" standalone="yes"?>\n`;
    xml += `<GroupAddress-Export xmlns="http://knx.org/xml/ga-export/01">\n`;

    groupData.forEach(mainGroup => {
        const mainRangeStart = (mainGroup.index - 1) * 2048;
        const mainRangeEnd = mainRangeStart + 2047;

        xml += `  <GroupRange Name="${mainGroup.name}" RangeStart="${mainRangeStart}" RangeEnd="${mainRangeEnd}">\n`;

        mainGroup.middleGroups.forEach(middleGroup => {
            const middleRangeStart = mainRangeStart + (middleGroup.index - 1) * 256;
            const middleRangeEnd = middleRangeStart + 255;

            xml += `    <GroupRange Name="${middleGroup.name}" RangeStart="${middleRangeStart}" RangeEnd="${middleRangeEnd}">\n`;

            middleGroup.subGroups.forEach(subGroup => {
                const address = `${mainGroup.index - 1}/${middleGroup.index - 1}/${subGroup.index}`;
                xml += `      <GroupAddress Name="${subGroup.name}" Address="${address}" DPTs="${subGroup.dataPoint}" />\n`;
            });

            xml += `    </GroupRange>\n`;
        });

        xml += `  </GroupRange>\n`;
    });

    xml += `</GroupAddress-Export>`;

    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'group_addresses.xml';
    a.click();

    URL.revokeObjectURL(url);
}