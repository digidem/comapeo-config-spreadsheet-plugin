/**
 * Functions for parsing and processing SVG sprite files (icons.svg)
 */

/**
 * Processes an SVG sprite blob and extracts individual icons
 * @param tempFolder - The temporary folder to save the extracted icons
 * @param iconsSvgBlob - Optional blob containing the icons.svg file
 * @returns An array of icon objects with name and URL
 */
function processIconSpriteBlob(
  tempFolder: GoogleAppsScript.Drive.Folder,
  iconsSvgBlob?: GoogleAppsScript.Base.Blob,
): { name: string; svg: string; id: string }[] {
  try {
    console.log("Processing icons.svg sprite blob");

    // Get permanent config folder for icon storage
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const parentFolder = DriveApp.getFileById(spreadsheet.getId())
      .getParents()
      .next();
    const configFolderName = slugify(spreadsheet.getName());

    console.log(`Looking for config folder: ${configFolderName}`);

    // Find or create config folder
    let configFolder: GoogleAppsScript.Drive.Folder;
    const configFolders = parentFolder.getFoldersByName(configFolderName);
    if (configFolders.hasNext()) {
      configFolder = configFolders.next();
      console.log(`Using existing config folder: ${configFolder.getName()}`);
    } else {
      configFolder = parentFolder.createFolder(configFolderName);
      console.log(`Created new config folder: ${configFolder.getName()}`);
    }

    // Find or create permanent icons folder
    let permanentIconsFolder: GoogleAppsScript.Drive.Folder;
    const iconsFolders = configFolder.getFoldersByName("icons");
    if (iconsFolders.hasNext()) {
      permanentIconsFolder = iconsFolders.next();
      console.log(`Using existing icons folder: ${permanentIconsFolder.getName()}`);
    } else {
      permanentIconsFolder = configFolder.createFolder("icons");
      console.log(`Created new icons folder: ${permanentIconsFolder.getName()}`);
    }

    // Create temporary folders for extraction
    const iconsSvgFolder = tempFolder.createFolder("icons_svg_temp");
    const iconsOutputFolder = tempFolder.createFolder("icons_output");

    // If blob provided, save it to the iconsSvgFolder
    if (iconsSvgBlob) {
      console.log("Saving provided icons.svg blob to temp folder");
      iconsSvgFolder.createFile(iconsSvgBlob);
    } else {
      console.log("No blob provided, checking for icons.svg in temp folder files");
    }

    // Process the sprite
    const icons = deconstructSvgSprite(
      iconsSvgFolder.getId(),
      iconsOutputFolder.getId(),
    );

    console.log(`Extracted ${icons.length} icons from sprite`);

    // Move icons to permanent folder and update URLs
    const permanentIcons = icons.map((icon) => {
      try {
        // Find the icons subfolder in the temp output folder
        const iconsSubfolders = iconsOutputFolder.getFoldersByName("icons");
        if (!iconsSubfolders.hasNext()) {
          console.warn(`No icons subfolder found for ${icon.name}`);
          return icon;
        }

        const iconsSubfolder = iconsSubfolders.next();
        const fileName = `${icon.name}.svg`;
        const tempFiles = iconsSubfolder.getFilesByName(fileName);

        if (!tempFiles.hasNext()) {
          console.warn(`Icon file not found: ${fileName}`);
          return icon;
        }

        const tempFile = tempFiles.next();
        console.log(`Moving icon ${fileName} to permanent folder`);

        // Check if file already exists in permanent folder
        const existingFiles = permanentIconsFolder.getFilesByName(fileName);
        let permanentFile;

        if (existingFiles.hasNext()) {
          // Update existing file content
          permanentFile = existingFiles.next();
          permanentFile.setContent(tempFile.getBlob().getDataAsString());
          console.log(`Updated existing icon: ${fileName}`);
        } else {
          // Create new file in permanent folder
          permanentFile = permanentIconsFolder.createFile(
            tempFile.getBlob().setName(fileName),
          );
          console.log(`Created new icon: ${fileName}`);
        }

        // Return icon with permanent URL
        return {
          name: icon.name,
          svg: permanentFile.getUrl(),
          id: icon.id,
        };
      } catch (error) {
        console.error(`Error moving icon ${icon.name} to permanent folder:`, error);
        return icon;
      }
    });

    console.log(`Successfully moved ${permanentIcons.length} icons to permanent folder`);
    return permanentIcons;
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
      // CRITICAL: Create SVG element with proper namespace
      const svgNamespace = svgRoot.getNamespace();
      const newSvg = XmlService.createElement("svg", svgNamespace);
      Logger.log(`Created new SVG with namespace: ${svgNamespace.getURI()}`);

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

      // Get ALL child elements from the symbol (path, rect, circle, etc.)
      const children = symbol.getChildren();
      Logger.log(`Symbol ${id} has ${children.length} child element(s)`);

      // Clone each child element with all its attributes and content
      for (let c = 0; c < children.length; c++) {
        const child = children[c];
        const childName = child.getName();
        Logger.log(`  - Processing child element #${c + 1}: <${childName}>`);

        // Create new element with same name and namespace
        const newChild = XmlService.createElement(childName, child.getNamespace());

        // Copy all attributes
        const childAttrs = child.getAttributes();
        Logger.log(`    - Has ${childAttrs.length} attribute(s)`);
        for (let a = 0; a < childAttrs.length; a++) {
          const attr = childAttrs[a];
          newChild.setAttribute(attr.getName(), attr.getValue());
          Logger.log(`      - ${attr.getName()}="${attr.getValue()}"`);
        }

        // Copy text content if any
        const textContent = child.getText();
        if (textContent) {
          newChild.setText(textContent);
        }

        // Recursively copy nested children if any
        const nestedChildren = child.getChildren();
        if (nestedChildren.length > 0) {
          Logger.log(`    - Has ${nestedChildren.length} nested child(ren)`);
          // For nested children, we'll use detach since they're less common
          for (let n = 0; n < nestedChildren.length; n++) {
            newChild.addContent(nestedChildren[n].detach());
          }
        }

        // Add the cloned child to the new SVG
        newSvg.addContent(newChild);
      }

      const newDoc = XmlService.createDocument(newSvg);
      const newXmlString = XmlService.getPrettyFormat().format(newDoc);

      // Debug log to check what's being created
      Logger.log(`Generated SVG XML for ${id} (${baseName}):`);
      if (newXmlString.length <= 500) {
        Logger.log(newXmlString); // Log full content if small
      } else {
        Logger.log(newXmlString.substring(0, 500) + "..."); // Log first 500 chars
      }

      // Verify namespace is present in output
      if (newXmlString.indexOf('xmlns=') !== -1) {
        Logger.log(`✓ Namespace present in generated SVG`);
      } else {
        Logger.log(`✗ WARNING: Namespace missing in generated SVG!`);
      }

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
