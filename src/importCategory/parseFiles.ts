/**
 * File parsing functions for the import category functionality.
 * This file contains functions related to parsing extracted files.
 *
 * Uses the slugify function from utils.ts
 */

/**
 * Parses the extracted files to get configuration data.
 * @param files - Array of extracted file blobs
 * @returns Configuration data object
 */
function parseExtractedFiles(
  files: GoogleAppsScript.Base.Blob[] | undefined,
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

      // Process icon files
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
          svg: "icon_url_placeholder", // In a real implementation, save the icon and get its URL
          id: iconName,
        });
      }
    } catch (error) {
      console.warn(`Error processing file ${fileName}:`, error);
    }
  });

  return configData;
}
