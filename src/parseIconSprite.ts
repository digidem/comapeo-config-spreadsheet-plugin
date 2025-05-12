/**
 * Deconstructs an SVG sprite (icons.svg) stored in a Google Drive folder into separate SVG icons as files.
 * @param {string} configFolderId - Google Drive folder ID containing icons.svg
 * @param {string} outputFolderId - Google Drive folder ID to save the individual icons into a subfolder called 'icons'
 */
function deconstructSvgSprite(configFolderId, outputFolderId) {
  try {
    Logger.log(
      `Deconstructing SVG sprite from ${configFolderId} to ${outputFolderId}`,
    );

    const configFolder = DriveApp.getFolderById(configFolderId);
    const outputFolder = DriveApp.getFolderById(outputFolderId);
    let iconsFile = null;
    const files = configFolder.getFilesByName("icons.svg");
    if (!files.hasNext()) {
      Logger.log(
        "No icons.svg found in folder, skipping SVG sprite deconstruction",
      );
      return;
    }
    iconsFile = files.next();
    const fileBlob = iconsFile.getBlob();
    Logger.log(
      `Processing SVG file: ${iconsFile.getName()} (${fileBlob.getContentType()})`,
    );

    const xml = XmlService.parse(fileBlob.getDataAsString());
    const svgRoot = xml.getRootElement();
    const symbols = svgRoot.getChildren("symbol");
    Logger.log(`Found ${symbols.length} symbols in SVG sprite`);

    if (!symbols || symbols.length === 0) {
      Logger.log("No <symbol> children in SVG");
      return;
    }

    // Create / find 'icons' subfolder in output folder
    let iconsSubfolder = null;
    const subfolders = outputFolder.getFoldersByName("icons");
    if (subfolders.hasNext()) {
      iconsSubfolder = subfolders.next();
      Logger.log(`Using existing icons subfolder: ${iconsSubfolder.getName()}`);
    } else {
      iconsSubfolder = outputFolder.createFolder("icons");
      Logger.log(`Created new icons subfolder: ${iconsSubfolder.getName()}`);
    }

    const iconBaseNames = {};
    // First pass: extract base names
    for (let i = 0; i < symbols.length; i++) {
      const id = symbols[i].getAttribute("id").getValue();
      const splitName = id.split("-12");
      const baseName = splitName.length > 1 ? splitName[0] : id.split("-")[0];
      iconBaseNames[baseName] = true;
    }
    Logger.log(
      `Extracted ${Object.keys(iconBaseNames).length} unique base names`,
    );

    // Second pass: process each icon
    for (let j = 0; j < symbols.length; j++) {
      const symbol = symbols[j];
      const id = symbol.getAttribute("id").getValue();
      const splitName = id.split("-12");
      const baseName = splitName.length > 1 ? splitName[0] : id.split("-")[0];
      Logger.log(`Processing symbol #${j + 1}: id=${id}, baseName=${baseName}`);

      // Build new SVG root with a single <symbol>
      const newSvg = XmlService.createElement("svg");
      // Copy all attributes from root <svg> to new <svg>
      const attrs = svgRoot.getAttributes();
      for (let k = 0; k < attrs.length; k++) {
        newSvg.setAttribute(attrs[k].copy());
      }
      newSvg.addContent(symbol.cloneContent()); // Add everything within <symbol> to the <svg> root

      const newDoc = XmlService.createDocument(newSvg);
      const newXmlString = XmlService.getPrettyFormat().format(newDoc);

      // Size logic: If '-12' present, treat as 24px, else as 100px.
      const currentSizeFileName =
        splitName.length > 1 ? `${baseName}-24px.svg` : `${baseName}-100px.svg`;

      // Write current size
      if (!fileExistsInFolder(iconsSubfolder, currentSizeFileName)) {
        iconsSubfolder.createFile(
          currentSizeFileName,
          newXmlString,
          MimeType.SVG,
        );
        Logger.log(`Wrote ${currentSizeFileName}`);
      } else {
        Logger.log(`File ${currentSizeFileName} already exists, skipping`);
      }

      // Other size version
      const otherSizeFileName =
        splitName.length > 1 ? `${baseName}-100px.svg` : `${baseName}-24px.svg`;
      if (!fileExistsInFolder(iconsSubfolder, otherSizeFileName)) {
        iconsSubfolder.createFile(
          otherSizeFileName,
          newXmlString,
          MimeType.SVG,
        );
        Logger.log(
          `Wrote ${otherSizeFileName} (duplicate of ${currentSizeFileName})`,
        );
      } else {
        Logger.log(`File ${otherSizeFileName} already exists, skipping`);
      }
    }

    // Final verification
    const allIconFiles = iconsSubfolder.getFiles();
    const iconsInFolder = {};
    let fileCount = 0;
    while (allIconFiles.hasNext()) {
      const f = allIconFiles.next();
      iconsInFolder[f.getName()] = true;
      fileCount++;
    }
    Logger.log(`Found ${fileCount} icon files in output folder`);

    let missingCount = 0;
    for (const baseName in iconBaseNames) {
      const f24 = `${baseName}-24px.svg`;
      const f100 = `${baseName}-100px.svg`;
      if (!iconsInFolder[f24]) {
        Logger.log(`Warning: Missing 24px version for ${baseName}`);
        missingCount++;
      }
      if (!iconsInFolder[f100]) {
        Logger.log(`Warning: Missing 100px version for ${baseName}`);
        missingCount++;
      }
    }
    Logger.log(`Verification complete. Missing files: ${missingCount}`);
  } catch (error) {
    Logger.log(`Error in deconstructSvgSprite: ${error}`);
    console.error(`SVG sprite processing error: ${error}`);
  }
}
