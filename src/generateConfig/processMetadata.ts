function processMetadata(data) {
    const { documentName } = data;
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    let metadataSheet = spreadsheet.getSheetByName('Metadata');
    
    if (!metadataSheet) {
        metadataSheet = createMetadataSheet(spreadsheet);
    }

    const metadata = getOrCreateMetadata(metadataSheet, documentName);
    const packageJson = createPackageJson(metadata);

    return { metadata, packageJson };
}

function createMetadataSheet(spreadsheet) {
    const sheet = spreadsheet.insertSheet('Metadata');
    const headerRange = sheet.getRange(1, 1, 1, 2);
    headerRange.setValues([['Key', 'Value']]);
    headerRange.setFontWeight('bold');
    return sheet;
}

function getOrCreateMetadata(sheet, documentName) {
    const metadata = {
        dataset_id: getOrSetValue(sheet, 'dataset_id', `comapeo-${slugify(documentName)}`),
        name: getOrSetValue(sheet, 'name', `config-${slugify(documentName)}`),
        version: getOrSetValue(sheet, 'version', Utilities.formatDate(new Date(), 'UTC', 'yy.MM.dd')),
        projectKey: getOrSetValue(sheet, 'projectKey', generateRandomBytes(64))
    };
    return metadata;
}

function getOrSetValue(sheet, key, defaultValue) {
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
        if (data[i][0] === key) {
            return data[i][1];
        }
    }
    sheet.appendRow([key, defaultValue]);
    return defaultValue;
}

function generateRandomBytes(length: number): string {
    const chars = '0123456789abcdef';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

function createPackageJson(metadata) {
    return {
        "name": metadata.dataset_id,
        "version": metadata.version,
        "description": `CoMapeo configuration for ${metadata.name}`,
        "dependencies": {
            "mapeo-settings-builder": "^6.0.0"
        },
        "scripts": {
            "build": "mkdir -p build && mapeo-settings build -l 'en' -o build/${npm_package_name}-v${npm_package_version}.comapeocat",
            "lint": "mapeo-settings lint"
        }
    };
}