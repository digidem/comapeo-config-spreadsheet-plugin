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
			// Process icons.png sprite file
			else if (fileName === "icons.png") {
				console.log("Found PNG sprite file (icons.png)");
				// Store for detection, but cannot extract without external API
				configData.iconsPngFile = file;
			}
			// Process icons.json metadata file
			else if (fileName === "icons.json") {
				console.log("Found icon metadata file (icons.json)");
				// Contains coordinates for PNG sprite extraction
				configData.iconsJsonFile = file;
			}
			// Skip individual icon files here - they'll be processed later by processIconSpriteBlob() and extractPngIcons()
			// DO NOT add placeholder entries as they block proper extraction
			else if (
				fileName.endsWith(".svg") ||
				fileName.endsWith(".png") ||
				fileName.includes("/icons/") ||
				fileName.startsWith("icons/")
			) {
				// Individual icon files are handled by extraction phases:
				// Phase 1 (Primary): processIconSpriteBlob() for SVG sprite extraction
				// Phase 2 (Fallback): extractPngIcons() for PNG files in icons/ directory
				// Adding placeholder entries here would block actual extraction
				console.log(`Detected individual icon file: ${fileName} (will be processed later)`);
			}
		} catch (error) {
			console.warn(`Error processing file ${fileName}:`, error);
		}
	});

	// Try to extract SVG icons first (preferred format for scalability and display)
	console.log("=== ICON EXTRACTION PHASE 1: SVG Sprite (Primary) ===");
	if (configData.iconsSvgFile) {
		console.log("Processing icons.svg sprite file");
		console.log(`Icons before SVG extraction: ${configData.icons.length}`);
		try {
			// Process the SVG sprite and get icon objects with URLs
			const extractedIcons = processIconSpriteBlob(
				tempFolder,
				configData.iconsSvgFile,
			);
			console.log(`✓ Extracted ${extractedIcons.length} icons from SVG sprite`);

			// Add the extracted icons to the configData.icons array
			if (extractedIcons.length > 0) {
				// Create a map of existing icon names to avoid duplicates
				const existingIconNames = new Set<string>();
				configData.icons.forEach((icon: { name: string }) => {
					existingIconNames.add(icon.name);
				});

				if (existingIconNames.size > 0) {
					console.log(`Existing icon names: ${Array.from(existingIconNames).join(", ")}`);
				}

				// Add SVG icons (they now take precedence)
				let svgAdded = 0;
				let svgSkipped = 0;
				extractedIcons.forEach(
					(icon: { name: string; svg: string; id: string }) => {
						if (!existingIconNames.has(icon.name)) {
							configData.icons.push(icon);
							svgAdded++;
							console.log(`  ✓ Added SVG icon: ${icon.name} (URL: ${icon.svg.substring(0, 50)}...)`);
						} else {
							svgSkipped++;
							console.log(`  ⊘ Skipped duplicate SVG icon: ${icon.name}`);
						}
					},
				);

				console.log(`Added ${svgAdded} new SVG icons${svgSkipped > 0 ? `, skipped ${svgSkipped} duplicates` : ""}`);
				console.log(`Total icons after SVG processing: ${configData.icons.length}`);
			}
		} catch (error) {
			console.error("Error processing icons.svg:", error);
		}

		// Remove the temporary file reference
		delete configData.iconsSvgFile;
	} else {
		console.log("No icons.svg file found, will try PNG files");
	}

	// Fall back to PNG icons from icons/ directory if SVG extraction didn't find any
	console.log("=== ICON EXTRACTION PHASE 2: PNG Files (Fallback) ===");
	console.log(`Icons before PNG extraction: ${configData.icons.length}`);
	if (hasPngIconsDirectory(tempFolder)) {
		console.log("Found icons/ directory, extracting PNG icons");
		try {
			const pngIcons = extractPngIcons(tempFolder, configData.presets, onProgress);
			console.log(`✓ Extracted ${pngIcons.length} PNG icons`);

			if (pngIcons.length > 0) {
				// Create a map of existing icon names to avoid duplicates
				const existingIconNames = new Set<string>();
				configData.icons.forEach((icon: { name: string }) => {
					existingIconNames.add(icon.name);
				});

				if (existingIconNames.size > 0) {
					console.log(`Existing icon names (SVG takes precedence): ${Array.from(existingIconNames).join(", ")}`);
				}

				// Add PNG icons that don't already exist (SVG icons take precedence)
				let pngAdded = 0;
				let pngSkipped = 0;
				pngIcons.forEach(
					(icon: { name: string; svg: string; id: string }) => {
						if (!existingIconNames.has(icon.name)) {
							configData.icons.push(icon);
							existingIconNames.add(icon.name);
							pngAdded++;
							console.log(`  ✓ Added PNG icon: ${icon.name} (URL: ${icon.svg.substring(0, 50)}...)`);
						} else {
							pngSkipped++;
							console.log(`  ⊘ Skipped PNG icon (SVG exists): ${icon.name}`);
						}
					},
				);

				console.log(`Added ${pngAdded} new PNG icons${pngSkipped > 0 ? `, skipped ${pngSkipped} (SVG priority)` : ""}`);
				console.log(`Total icons after PNG extraction: ${configData.icons.length}`);
			}
		} catch (error) {
			console.error("Error extracting PNG icons:", error);
		}
	} else {
		console.log("No icons/ directory found, PNG extraction skipped");
	}

	// Check if PNG sprite was detected but not extracted
	console.log("=== ICON EXTRACTION COMPLETE ===");
	console.log(`Final icon count: ${configData.icons.length}`);

	if (configData.icons.length === 0) {
		if (configData.iconsPngFile) {
			console.warn("⚠️ PNG SPRITE DETECTED BUT CANNOT BE EXTRACTED");
			console.warn("   Google Apps Script cannot parse PNG sprites (icons.png)");
			console.warn("   Reason: No image processing libraries available");
			console.warn("");
			console.warn("   Options:");
			console.warn("   1. Use config with individual PNG files in icons/ directory");
			console.warn("   2. Use config with SVG sprite (icons.svg)");
			console.warn("   3. Contact support about external API for PNG extraction");

			if (configData.iconsJsonFile) {
				console.warn("   Note: icons.json metadata detected but unusable without PNG extraction");
			}
		} else {
			console.warn("⚠️ NO ICONS FOUND IN CONFIGURATION");
			console.warn("   Expected one of:");
			console.warn("   - icons/ directory with individual PNG files");
			console.warn("   - icons.svg sprite file");
			console.warn("   Please check configuration file structure");
		}
	} else {
		console.log(`✓ Successfully extracted ${configData.icons.length} icon(s)`);
	}

	// Clean up temporary file references
	delete configData.iconsSvgFile;
	delete configData.iconsPngFile;
	delete configData.iconsJsonFile;

	return configData;
}
