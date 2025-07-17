/**
 * Functions for parsing and processing SVG sprite files (icons.svg)
 */

/**
 * Processes an SVG sprite blob and extracts individual icons
 * @param tempFolder - The temporary folder to save the extracted icons
 * @returns An array of icon objects with name and URL
 */
function processIconSpriteBlob(
  tempFolder: GoogleAppsScript.Drive.Folder,
): { name: string; svg: string; id: string }[] {
  try {
    console.log("Processing icons.svg sprite blob");

    // Create a temporary folder to store the icons.svg file
    const iconsSvgFolder = tempFolder.createFolder("icons_svg_temp");

    // Create a folder for the extracted icons
    const iconsOutputFolder = tempFolder.createFolder("icons_output");

    // Process the sprite
    const icons = deconstructSvgSprite(
      iconsSvgFolder.getId(),
      iconsOutputFolder.getId(),
    );

    console.log(`Extracted ${icons.length} icons from sprite`);
    return icons;
  } catch (error) {
    console.error("Error processing icon sprite blob:", error);
    return [];
  }
}

/**
 * Checks if a file with the given name exists in a folder
 * @param folder - The folder to check
 * @param fileName - The name of the file to look for
 * @returns True if the file exists, false otherwise
 */
function fileExistsInFolder(
  folder: GoogleAppsScript.Drive.Folder,
  fileName: string,
): boolean {
  const files = folder.getFilesByName(fileName);
  return files.hasNext();
}

/**
 * Deconstructs an SVG sprite (icons.svg) stored in a Google Drive folder into separate SVG icons as files.
 * @param configFolderId - Google Drive folder ID containing icons.svg
 * @param outputFolderId - Google Drive folder ID to save the individual icons into a subfolder called 'icons'
 * @returns An array of icon objects with name and URL
 */
function deconstructSvgSprite(
  configFolderId: string,
  outputFolderId: string,
): { name: string; svg: string; id: string }[] {
  try {
    Logger.log(
      `Deconstructing SVG sprite from ${configFolderId} to ${outputFolderId}`,
    );

    const configFolder = DriveApp.getFolderById(configFolderId);
    const outputFolder = DriveApp.getFolderById(outputFolderId);

    // Check if icons.svg exists
    const files = configFolder.getFilesByName("icons.svg");
    if (!files.hasNext()) {
      Logger.log(
        "No icons.svg found in folder, skipping SVG sprite deconstruction",
      );
      return [];
    }

    const iconsFile = files.next();
    const fileBlob = iconsFile.getBlob();
    Logger.log(
      `Processing SVG file: ${iconsFile.getName()} (${fileBlob.getContentType()})`,
    );

    const svgContent = fileBlob.getDataAsString();
    Logger.log(`SVG content length: ${svgContent.length} characters`);
    Logger.log(`SVG content preview: ${svgContent.substring(0, 200)}...`);

    const xml = XmlService.parse(svgContent);
    const svgRoot = xml.getRootElement();
    Logger.log(
      `SVG root element name: ${svgRoot.getName()}, namespace: ${svgRoot.getNamespace().getURI()}`,
    );

    // Get all children to see what's available
    const allChildren = svgRoot.getChildren();
    Logger.log(
      `SVG root has ${allChildren.length} total children of various types`,
    );
    Logger.log(
      `SVG root children types: ${allChildren.map((child) => child.getName()).join(", ")}`,
    );

    // Get symbol elements
    let symbols = svgRoot.getChildren("symbol");
    if (!symbols || symbols.length === 0) {
      // Alternative approach: filter all children to find symbols
      symbols = svgRoot
        .getChildren()
        .filter((child) => child.getName() === "symbol");
      Logger.log(
        `Found ${symbols.length} symbols using alternative filter approach`,
      );
    }

    Logger.log(`Found ${symbols.length} symbols in SVG sprite`);

    if (!symbols || symbols.length === 0) {
      Logger.log("No <symbol> children in SVG");
      return [];
    }

    // Log first few symbols if they exist
    if (symbols.length > 0) {
      const sampleSymbol = symbols[0];
      Logger.log(
        `First symbol ID: ${sampleSymbol.getAttribute("id")?.getValue() || "no id"}`,
      );
      Logger.log(
        `First symbol children count: ${sampleSymbol.getChildren().length}`,
      );
      Logger.log(
        `First symbol children types: ${sampleSymbol
          .getChildren()
          .map((c) => c.getName())
          .join(", ")}`,
      );
    }

    // Create / find 'icons' subfolder in output folder
    let iconsSubfolder: GoogleAppsScript.Drive.Folder;
    const subfolders = outputFolder.getFoldersByName("icons");
    if (subfolders.hasNext()) {
      iconsSubfolder = subfolders.next();
      Logger.log(`Using existing icons subfolder: ${iconsSubfolder.getName()}`);
    } else {
      iconsSubfolder = outputFolder.createFolder("icons");
      Logger.log(`Created new icons subfolder: ${iconsSubfolder.getName()}`);
    }

    // Process each icon
    const iconObjects: { name: string; svg: string; id: string }[] = [];

    for (let i = 0; i < symbols.length; i++) {
      const symbol = symbols[i];
      const id = symbol.getAttribute("id").getValue();
      const baseName = id.split("-")[0]; // Just use the first part of the ID as the base name

      Logger.log(`Processing symbol #${i + 1}: id=${id}, baseName=${baseName}`);
      Logger.log(`Symbol children count: ${symbol.getChildren().length}`);
      Logger.log(
        `Symbol children types: ${symbol
          .getChildren()
          .map((c) => c.getName())
          .join(", ")}`,
      );

      // Build new SVG root with a single symbol's content
      const newSvg = XmlService.createElement("svg");

      // Copy all attributes from root <svg> to new <svg>
      const attrs = svgRoot.getAttributes();
      for (let k = 0; k < attrs.length; k++) {
        const attr = attrs[k];
        newSvg.setAttribute(attr.getName(), attr.getValue());
      }

      // Add viewBox attribute if not present
      if (!newSvg.getAttribute("viewBox")) {
        newSvg.setAttribute("viewBox", "0 0 24 24");
      }

      // Get all path elements from the symbol and add them to the new SVG
      const paths = symbol.getChildren("path");
      Logger.log(`Symbol ${id} has ${paths.length} path elements`);

      if (paths && paths.length > 0) {
        for (let p = 0; p < paths.length; p++) {
          const path = paths[p];
          // Clone the path element
          const newPath = XmlService.createElement("path");
          // Copy all attributes from the original path
          const pathAttrs = path.getAttributes();
          Logger.log(`Path #${p} has ${pathAttrs.length} attributes`);

          for (let a = 0; a < pathAttrs.length; a++) {
            const pathAttr = pathAttrs[a];
            newPath.setAttribute(pathAttr.getName(), pathAttr.getValue());
            Logger.log(
              `  - Attribute: ${pathAttr.getName()}="${pathAttr.getValue()}"`,
            );
          }
          // Add the path to the new SVG
          newSvg.addContent(newPath);
        }
      } else {
        // If no paths found, try to get all children and add them
        const children = symbol.getChildren();
        Logger.log(
          `No paths found, adding ${children.length} direct children instead`,
        );

        for (let c = 0; c < children.length; c++) {
          const child = children[c];
          Logger.log(`  - Child element: ${child.getName()}`);
          newSvg.addContent(child.detach());
        }
      }

      const newDoc = XmlService.createDocument(newSvg);
      const newXmlString = XmlService.getPrettyFormat().format(newDoc);

      // Debug log to check what's being created
      Logger.log(`Generated SVG XML for ${id}:`);
      Logger.log(newXmlString.substring(0, 200) + "..."); // Log first 200 chars

      // Create a single file with format {name}.svg
      const fileName = `${baseName}.svg`;

      // Write the file if it doesn't exist
      if (!fileExistsInFolder(iconsSubfolder, fileName)) {
        const iconFile = iconsSubfolder.createFile(
          fileName,
          newXmlString,
          MimeType.SVG,
        );
        Logger.log(`Wrote ${fileName}`);

        // Add to icon objects
        iconObjects.push({
          name: baseName,
          svg: iconFile.getUrl(),
          id: baseName,
        });
      } else {
        // If file exists, create a v2 version
        const v2FileName = `${baseName}-v2.svg`;
        const iconFile = iconsSubfolder.createFile(
          v2FileName,
          newXmlString,
          MimeType.SVG,
        );
        Logger.log(`File ${fileName} already exists, created ${v2FileName} instead`);

        // Add to icon objects
        iconObjects.push({
          name: baseName,
          svg: iconFile.getUrl(),
          id: baseName,
        });
      }
    }

    Logger.log(`Processed ${iconObjects.length} icons successfully`);
    return iconObjects;
  } catch (error) {
    Logger.log(`Error in deconstructSvgSprite: ${error}`);
    console.error(`SVG sprite processing error: ${error}`);
    return [];
  }
}
