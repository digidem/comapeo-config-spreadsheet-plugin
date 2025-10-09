/**
 * File parsing functions for the import category functionality.
 * This file contains functions related to parsing extracted files.
 *
 * Uses the slugify function from utils.ts
 */

/**
 * Restructures flat translation keys into nested object structure.
 * Converts flat format like "presets.water.name" to nested format like presets.presets.water.name
 *
 * @param flatMessages - Messages object with flat key structure
 * @returns Messages object with nested structure
 */
function restructureTranslations(flatMessages: any): any {
	if (!flatMessages || typeof flatMessages !== "object") {
		console.warn("Invalid flatMessages object, returning empty structure");
		return {};
	}

	const restructured: any = {};

	for (const lang in flatMessages) {
		if (!flatMessages.hasOwnProperty(lang)) continue;

		// Initialize nested structure for this language
		restructured[lang] = {
			presets: {
				presets: {},
				fields: {},
			},
		};

		const langMessages = flatMessages[lang];
		if (!langMessages || typeof langMessages !== "object") {
			console.warn(`Invalid messages for language: ${lang}`);
			continue;
		}

		for (const key in langMessages) {
			if (!langMessages.hasOwnProperty(key)) continue;

			const value = langMessages[key];
			const parts = key.split(".");

			// Extract message value (handle both string and object formats)
			const messageValue =
				typeof value === "object" && value.message
					? value.message
					: value;

			if (parts[0] === "presets" && parts.length >= 3) {
				const itemId = parts[1];
				const property = parts[2];

				// Initialize preset object if needed
				if (!restructured[lang].presets.presets[itemId]) {
					restructured[lang].presets.presets[itemId] = {};
				}

				if (parts.length === 3) {
					// Handle: presets.water.name
					restructured[lang].presets.presets[itemId][property] =
						messageValue;
					console.log(
						`Restructured preset ${lang}.${itemId}.${property}`,
					);
				} else if (parts[3] === "options" && parts.length >= 5) {
					// Handle: presets.water.options.clean
					if (!restructured[lang].presets.presets[itemId].options) {
						restructured[lang].presets.presets[itemId].options = {};
					}
					const optionId = parts[4];
					restructured[lang].presets.presets[itemId].options[
						optionId
					] = messageValue;
					console.log(
						`Restructured preset option ${lang}.${itemId}.options.${optionId}`,
					);
				}
			} else if (parts[0] === "fields" && parts.length >= 3) {
				const itemId = parts[1];
				const property = parts[2];

				// Initialize field object if needed
				if (!restructured[lang].presets.fields[itemId]) {
					restructured[lang].presets.fields[itemId] = {};
				}

				if (parts.length === 3) {
					// Handle: fields.waterType.label, fields.waterType.helperText
					restructured[lang].presets.fields[itemId][property] =
						messageValue;
					console.log(
						`Restructured field ${lang}.${itemId}.${property}`,
					);
				} else if (parts[3] === "options" && parts.length >= 5) {
					// Handle: fields.waterType.options.river
					if (!restructured[lang].presets.fields[itemId].options) {
						restructured[lang].presets.fields[itemId].options = {};
					}
					const optionId = parts[4];
					restructured[lang].presets.fields[itemId].options[optionId] =
						messageValue;
					console.log(
						`Restructured field option ${lang}.${itemId}.options.${optionId}`,
					);
				}
			}
		}
	}

	console.log(
		`Restructured translations for ${Object.keys(restructured).length} languages`,
	);
	return restructured;
}

/**
 * Parses the extracted files to get configuration data.
 * @param files - Array of extracted file blobs
 * @param tempFolder - The temporary folder where files are extracted
 * @param onProgress - Optional progress callback function
 * @returns Configuration data object
 */
function parseExtractedFiles(
	files: GoogleAppsScript.Base.Blob[] | undefined,
	tempFolder: GoogleAppsScript.Drive.Folder,
	onProgress?: (update: { percent: number; stage: string; detail?: string }) => void,
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
									// Handle array of strings or objects
									options = field.options.map((opt: any) => {
										if (typeof opt === "string") {
											return {
												label: opt,
												value: slugify(opt),
											};
										} else if (typeof opt === "object" && opt !== null) {
											// Option is already an object with label/value
											return {
												label: opt.label || opt.value || opt.name || String(opt),
												value: opt.value || slugify(opt.label || opt.name || ""),
											};
										}
										return {
											label: String(opt),
											value: slugify(String(opt)),
										};
									});
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
								helperText: field.helperText || field.placeholder || "",
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
				// Restructure flat translation keys to nested format
				configData.messages = restructureTranslations(content);
				console.log(
					`Parsed and restructured translations.json: ${Object.keys(content).length} languages`,
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

	// Try to extract PNG icons first (preferred format for spreadsheet import)
	console.log("Checking for PNG icons in icons/ directory...");
	if (hasPngIconsDirectory(tempFolder)) {
		console.log("Found icons/ directory, extracting PNG icons");
		try {
			const pngIcons = extractPngIcons(tempFolder, configData.presets, onProgress);
			console.log(`Extracted ${pngIcons.length} PNG icons`);

			if (pngIcons.length > 0) {
				// Create a map of existing icon names to avoid duplicates
				const existingIconNames = new Set<string>();
				configData.icons.forEach((icon: { name: string }) => {
					existingIconNames.add(icon.name);
				});

				// Add PNG icons (they take precedence over SVG)
				pngIcons.forEach(
					(icon: { name: string; svg: string; id: string }) => {
						if (!existingIconNames.has(icon.name)) {
							configData.icons.push(icon);
							existingIconNames.add(icon.name);
						}
					},
				);

				console.log(`Total icons after PNG extraction: ${configData.icons.length}`);
			}
		} catch (error) {
			console.error("Error extracting PNG icons:", error);
		}
	} else {
		console.log("No icons/ directory found, will try SVG sprite");
	}

	// Fall back to SVG sprite processing if available
	if (configData.iconsSvgFile) {
		console.log("Processing icons.svg sprite file");
		try {
			// Process the SVG sprite and get icon objects with URLs
			const extractedIcons = processIconSpriteBlob(
				tempFolder,
				configData.iconsSvgFile,
			);
			console.log(`Extracted ${extractedIcons.length} icons from SVG sprite`);

			// Add the extracted icons to the configData.icons array
			if (extractedIcons.length > 0) {
				// Create a map of existing icon names to avoid duplicates
				const existingIconNames = new Set<string>();
				configData.icons.forEach((icon: { name: string }) => {
					existingIconNames.add(icon.name);
				});

				// Add SVG icons that don't already exist (PNG icons take precedence)
				extractedIcons.forEach(
					(icon: { name: string; svg: string; id: string }) => {
						if (!existingIconNames.has(icon.name)) {
							configData.icons.push(icon);
						}
					},
				);

				console.log(`Total icons after SVG processing: ${configData.icons.length}`);
			}
		} catch (error) {
			console.error("Error processing icons.svg:", error);
		}

		// Remove the temporary file reference
		delete configData.iconsSvgFile;
	}

	return configData;
}
