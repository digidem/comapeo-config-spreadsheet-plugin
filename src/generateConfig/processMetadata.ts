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

function createMetadataSheet(spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet): GoogleAppsScript.Spreadsheet.Sheet {
    const sheet = spreadsheet.insertSheet('Metadata');
    const headerRange = sheet.getRange(1, 1, 1, 2);
    headerRange.setValues([['Key', 'Value']]);
    headerRange.setFontWeight('bold');
    return sheet;
}

function getOrCreateMetadata(sheet: GoogleAppsScript.Spreadsheet.Sheet, documentName: string): CoMapeoMetadata {
    const metadata: CoMapeoMetadata = {
        dataset_id: getOrSetValue(sheet, 'dataset_id', `comapeo-${slugify(documentName)}`),
        name: getOrSetValue(sheet, 'name', `config-${slugify(documentName)}`),
        version: getOrSetValue(sheet, 'version', Utilities.formatDate(new Date(), 'UTC', 'yy.MM.dd'))
    };
    return metadata;
}

/**
 * Retrieves or sets a value in the metadata sheet.
 *
 * @param sheet - The metadata sheet to operate on
 * @param key - The key to search for or set
 * @param defaultValue - The default value to set if the key is not found
 * @returns The existing value if found, or the default value if not found
 */
function getOrSetValue(sheet, key, defaultValue) {
    // Get all data from the sheet
    const data = sheet.getDataRange().getValues();

    // Search for the key in the existing data
    for (let i = 1; i < data.length; i++) {
        if (data[i][0] === key) {
            // If key is found, return its corresponding value
            if (key === 'version') {
                // Always update version with current date
                const newVersion = Utilities.formatDate(new Date(), 'UTC', 'yy.MM.dd');
                sheet.getRange(i + 1, 2).setValue(newVersion);
                return newVersion;
            }
            return data[i][1];
        }
    }

    // If key is not found, append a new row with the key and default value
    sheet.appendRow([key, defaultValue]);

    // Return the default value
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