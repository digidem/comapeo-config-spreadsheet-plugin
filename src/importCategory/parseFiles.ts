/**
 * File parsing functions for the import category functionality.
 * This file contains functions related to parsing extracted files.
 *
 * Uses the slugify function from utils.ts
 */

/**
 * Parses the extracted files to get configuration data.
 * @param files - Array of extracted file blobs
 * @param tempFolder - The temporary folder where files are extracted
 * @returns Configuration data object
 */
function parseExtractedFiles(
	files: GoogleAppsScript.Base.Blob[] | undefined,
	tempFolder: GoogleAppsScript.Drive.Folder,
): any {
	// Handle undefined or empty files array
	if (!files || !Array.isArray(files)) {
		console.log("No files to parse or files is not an array");
		return {
			metadata: { name: "Empty Configuration" },
			presets: [],
			fields: [],
			messages: {},
			icons: [],
		};
	}

	console.log(`Parsing ${files.length} extracted files...`);

	// Initialize configuration data
	const configData: any = {
		metadata: null,
		presets: [],
		fields: [],
		messages: {},
		icons: [],
	};

	// Process each file
	files.forEach((file) => {
		const fileName = file.getName();
		console.log(`Processing file: ${fileName}`);

		try {
			// Parse metadata.json
			if (fileName === "metadata.json") {
				const content = JSON.parse(file.getDataAsString());
				configData.metadata = content;
				console.log("Parsed metadata.json:", configData.metadata);
			}

			// Parse presets.json (contains categories and fields)
			else if (fileName === "presets.json") {
				const content = JSON.parse(file.getDataAsString());

				// Extract presets (categories)
				if (content.presets) {
					// Handle object format (Mapeo style)
					if (
						typeof content.presets === "object" &&
						!Array.isArray(content.presets)
					) {
						for (const presetId in content.presets) {
							const preset = content.presets[presetId];
							configData.presets.push({
								id: presetId,
								name: preset.name || presetId,
								icon: preset.icon || presetId,
								color: preset.color || "#0000FF",
								fields: preset.fields || [],
							});
						}
					}
				}

				// Extract fields
				if (content.fields) {
					// Handle object format (Mapeo style)
					if (
						typeof content.fields === "object" &&
						!Array.isArray(content.fields)
					) {
						for (const fieldId in content.fields) {
							const field = content.fields[fieldId];

							// Convert field type
							let fieldType = "text";
							if (field.type === "select_one") fieldType = "selectOne";
							else if (field.type === "select_multiple")
								fieldType = "selectMultiple";

							// Convert options
							let options = [];
							if (field.options) {
								if (Array.isArray(field.options)) {
									options = field.options.map((opt: string) => ({
										label: opt,
										value: slugify(opt),
									}));
								} else if (typeof field.options === "object") {
									options = Object.entries(field.options).map(
										([key, value]) => ({
											label: typeof value === "string" ? value : key,
											value: key,
										}),
									);
								}
							}

							configData.fields.push({
								id: fieldId,
								tagKey: fieldId,
								label: field.label || fieldId,
								type: fieldType,
								helperText: field.placeholder || "",
								options: options,
							});
						}
					}
				}

				console.log(
					`Parsed presets.json: ${configData.presets.length} presets, ${configData.fields.length} fields`,
				);
			}

			// Parse translations.json
			else if (fileName === "translations.json") {
				const content = JSON.parse(file.getDataAsString());
				configData.messages = content;
				console.log(
					`Parsed translations.json: ${Object.keys(content).length} languages`,
				);
			}

			// Process icons.svg file
			else if (fileName === "icons.svg") {
				console.log("Found icons.svg file, will process sprite");
				// Store the file for later processing
				configData.iconsSvgFile = file;
			}
			// Process individual icon files
			else if (
				fileName.endsWith(".svg") ||
				fileName.endsWith(".png") ||
				fileName.includes("/icons/") ||
				fileName.startsWith("icons/")
			) {
				// Extract icon name from file path
				let iconName = fileName
					.replace(/^.*[\\\/]/, "")
					.replace(/\.[^/.]+$/, "");

				configData.icons.push({
					name: iconName,
					svg: "icon_url_placeholder", // Will be updated later when icons are processed
					id: iconName,
				});
			}
		} catch (error) {
			console.warn(`Error processing file ${fileName}:`, error);
		}
	});

	// Process icons.svg if it was found
	if (configData.iconsSvgFile) {
		console.log("Processing icons.svg sprite file");
		try {
			// Process the SVG sprite and get icon objects with URLs
			const extractedIcons = processIconSpriteBlob(tempFolder);
			console.log(`Extracted ${extractedIcons.length} icons from sprite`);

			// Add the extracted icons to the configData.icons array
			if (extractedIcons.length > 0) {
				// Create a map of existing icon names to avoid duplicates
				const existingIconNames = new Set<string>();
				configData.icons.forEach((icon: { name: string }) => {
					existingIconNames.add(icon.name);
				});

				// Add new icons that don't already exist
				extractedIcons.forEach(
					(icon: { name: string; svg: string; id: string }) => {
						if (!existingIconNames.has(icon.name)) {
							configData.icons.push(icon);
						}
					},
				);

				console.log(`Total icons after processing: ${configData.icons.length}`);
			}
		} catch (error) {
			console.error("Error processing icons.svg:", error);
		}

		// Remove the temporary file reference
		delete configData.iconsSvgFile;
	}

	return configData;
}
