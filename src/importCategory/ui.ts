/**
 * UI functions for the import category functionality.
 * This file contains functions related to the user interface.
 */

// Reference to the global locale variable
declare const locale: string;

/**
 * Creates the HTML for the import category dialog.
 * @returns HTML string for the dialog
 */
function createImportCategoryHtml(): string {
  const title = importCategoryDialogTexts[locale].title;
  const messages = importCategoryDialogTexts[locale].message
    .map((msg) => "<p>" + msg + "</p>")
    .join("");
  const buttonText = importCategoryDialogTexts[locale].buttonText;

  return (
    "<!DOCTYPE html>" +
    "<html>" +
    "<head>" +
    '  <base target="_top">' +
    "  <style>" +
    "    body { font-family: 'Roboto', sans-serif; line-height: 1.6; color: #e0e0e0; background: linear-gradient(135deg, #1a1a1a, #2c2c2c); padding: 20px; }" +
    "    h1 { color: #6d44d9; font-size: 1.2em; margin-bottom: 20px; text-align: center; }" +
    "    p { margin-bottom: 15px; text-align: center; }" +
    "    .file-upload-container { margin: 20px 0; text-align: center; }" +
    "    .file-upload-label { display: inline-block; padding: 12px 20px; background: linear-gradient(45deg, #330B9E, #6d44d9); color: white; border-radius: 50px; cursor: pointer; transition: all 0.3s ease; }" +
    "    .file-upload-label:hover { background: linear-gradient(45deg, #4A0ED6, #8a67e8); transform: translateY(-2px); }" +
    "    .upload-icon { margin-right: 8px; font-size: 1.2em; }" +
    "    .file-info { margin: 15px 0; text-align: center; }" +
    "    .upload-status { margin: 15px 0; text-align: center; }" +
    "    .success { color: #4CAF50; font-weight: bold; }" +
    "    .error { color: #F44336; font-weight: bold; }" +
    "  </style>" +
    "</head>" +
    "<body>" +
    "  <h1>" +
    title +
    "</h1>" +
    "  " +
    messages +
    "" +
    "  " +
    '  <div class="file-upload-container">' +
    '    <label for="file" class="file-upload-label">' +
    '      <span class="upload-icon">📂</span>' +
    '      <span class="upload-text">' +
    buttonText +
    "</span>" +
    "    </label>" +
    '    <input type="file" id="file" name="file" accept=".comapeocat,.zip,.mapeosettings" style="display: none;" onchange="handleFileSelect()">' +
    "  </div>" +
    '  <div id="file-info" class="file-info"></div>' +
    '  <div id="upload-status" class="upload-status"></div>' +
    "  " +
    "  <script>" +
    "    function handleFileSelect() {" +
    '      const fileInput = document.getElementById("file");' +
    '      const fileInfo = document.getElementById("file-info");' +
    '      const uploadStatus = document.getElementById("upload-status");' +
    "      " +
    "      if (fileInput.files.length > 0) {" +
    "        const file = fileInput.files[0];" +
    '        fileInfo.innerHTML = "<p>Selected file: " + file.name + " (" + (file.size / 1024).toFixed(2) + " KB)</p>";' +
    '        uploadStatus.innerHTML = "<p>Processing file...</p>";' +
    "        " +
    "        // Read the file and convert to base64" +
    "        const reader = new FileReader();" +
    "        reader.onload = function(e) {" +
    '          const base64data = e.target.result.split(",")[1];' +
    "          google.script.run" +
    "            .withSuccessHandler(onSuccess)" +
    "            .withFailureHandler(onFailure)" +
    "            .processImportedCategoryFile(file.name, base64data);" +
    "        };" +
    "        reader.readAsDataURL(file);" +
    "      }" +
    "    }" +
    "    " +
    "    function onSuccess(result) {" +
    '      const uploadStatus = document.getElementById("upload-status");' +
    "      uploadStatus.innerHTML = \"<p class='success'>File imported successfully!</p>\";" +
    "      setTimeout(function() {" +
    "        google.script.host.close();" +
    "      }, 2000);" +
    "    }" +
    "    " +
    "    function onFailure(error) {" +
    '      const uploadStatus = document.getElementById("upload-status");' +
    '      uploadStatus.innerHTML = "<p class=\'error\'>Error: " + error.message + "</p>";' +
    "    }" +
    "  </script>" +
    "</body>" +
    "</html>"
  );
}
