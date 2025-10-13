/// <reference path="./lint.ts" />

/**
 * CoMapeo logo as embedded SVG data URI
 * Eliminates external network dependency and improves security
 */
const COMAPEO_LOGO_SVG = "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20100%20100%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22grad1%22%20x1%3D%220%25%22%20y1%3D%220%25%22%20x2%3D%22100%25%22%20y2%3D%22100%25%22%3E%3Cstop%20offset%3D%220%25%22%20style%3D%22stop-color%3A%236d44d9%3Bstop-opacity%3A1%22%20%2F%3E%3Cstop%20offset%3D%22100%25%22%20style%3D%22stop-color%3A%23330B9E%3Bstop-opacity%3A1%22%20%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Ccircle%20cx%3D%2250%22%20cy%3D%2250%22%20r%3D%2248%22%20fill%3D%22url(%23grad1)%22%20%2F%3E%3Cpath%20fill%3D%22white%22%20d%3D%22M50%2025c-8.28%200-15%206.72-15%2015%200%2011.25%2015%2030%2015%2030s15-18.75%2015-30c0-8.28-6.72-15-15-15zm0%2020.5c-3.04%200-5.5-2.46-5.5-5.5s2.46-5.5%205.5-5.5%205.5%202.46%205.5%205.5-2.46%205.5-5.5%205.5z%22%2F%3E%3C%2Fsvg%3E";

/**
 * CRITICAL: Safe dialog wrapper that validates HTML before showing
 * This prevents "Malformed HTML content" errors
 */
function showModalDialogSafe(
  htmlContent: string,
  title: string,
  width: number,
  height: number,
  context: string
): void {
  try {
    // MANDATORY validation before showing dialog
    if (typeof validateDialogHtml === "function") {
      validateDialogHtml(htmlContent, context);
    } else {
      console.warn("validateDialogHtml function not available - skipping validation");
    }

    // If we get here, HTML is valid - show the dialog
    const output = HtmlService.createHtmlOutput(htmlContent)
      .setWidth(width)
      .setHeight(height);

    SpreadsheetApp.getUi().showModalDialog(output, title);

  } catch (error) {
    // HTML validation failed - show error to user
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Dialog validation failed for ${context}:`, errorMessage);

    // Show simple error dialog instead
    const ui = SpreadsheetApp.getUi();
    ui.alert(
      "Dialog Error",
      `Unable to show ${context} dialog due to a technical error.\n\nError: ${errorMessage}\n\nPlease report this issue.`,
      ui.ButtonSet.OK
    );
  }
}

/**
 * Escapes HTML special characters to prevent XSS attacks
 */
function escapeHtml(unsafe: string): string {
  if (!unsafe) return "";
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Validates and sanitizes HTML message content before passing to generateDialog
 * Use this for messages that contain user-generated or dynamic HTML
 * @param messageLines - Array of message strings that may contain HTML
 * @returns Validated HTML string with proper structure
 */
function validateAndSanitizeMessage(messageLines: string[]): string {
  // Join message lines with proper paragraph tags
  const message = messageLines
    .map((line) => {
      // Check if line already has HTML tags
      if (/<\w+/.test(line)) {
        // Validate the HTML structure
        const validation = typeof validateHtmlContent === "function"
          ? validateHtmlContent(line)
          : { isValid: true, errors: [] };

        if (!validation.isValid) {
          console.warn(`Invalid HTML in message line: ${line}`);
          console.warn(`Errors: ${validation.errors.join(", ")}`);
          // Escape the entire line if it has invalid HTML
          return `<p>${escapeHtml(line)}</p>`;
        }
        return line;
      } else {
        // Plain text - wrap in paragraph tags
        return `<p>${line}</p>`;
      }
    })
    .join("\n");

  return message;
}

/**
 * Validates that a string contains only safe function identifier characters
 * to prevent JavaScript injection
 */
function sanitizeFunctionName(funcName: string): string {
  if (!funcName) return "";
  // Only allow alphanumeric, underscore, and dot (for namespaced functions)
  const sanitized = funcName.replace(/[^a-zA-Z0-9_.]/g, "");
  // Prevent empty or invalid function names
  if (!sanitized || !/^[a-zA-Z_][a-zA-Z0-9_.]*$/.test(sanitized)) {
    console.error(`Invalid function name: ${funcName}`);
    return "";
  }
  return sanitized;
}

function generateDialog(
  title: string,
  message: string,
  buttonText?: string,
  buttonUrl?: string,
  buttonFunction?: string,
  secondaryButtonText?: string,
  secondaryButtonFunction?: string,
): string {
  // Escape user-controlled inputs
  const safeTitle = escapeHtml(title);
  const safeButtonText = escapeHtml(buttonText || "");
  const safeSecondaryButtonText = escapeHtml(secondaryButtonText || "");
  const safeButtonUrl = escapeHtml(buttonUrl || "");

  // Sanitize function names to prevent JavaScript injection
  const safeButtonFunction = sanitizeFunctionName(buttonFunction || "");
  const safeSecondaryButtonFunction = sanitizeFunctionName(secondaryButtonFunction || "");

  // Note: message is not escaped as it contains intentional HTML from calling functions
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;700&display=swap');
        body {
          font-family: 'Roboto', sans-serif;
          line-height: 1.6;
          color: #e0e0e0;
          background: linear-gradient(135deg, #1a1a1a, #2c2c2c);
          max-width: 800px;
          margin: 0 auto;
          padding: 40px;
          text-align: center;
          box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
          border-radius: 10px;
        }
        h1 {
          color: #6d44d9;
          font-size: 1.2em;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
          margin-bottom: 30px;
        }
        p {
          margin-bottom: 25px;
          font-size: 1.1em;
        }
        .logo {
          width: 80px;
          height: 80px;
          margin-bottom: 30px;
          border-radius: 50%;
          box-shadow: 0 0 15px rgba(109, 68, 217, 0.7);
          transition: transform 0.3s ease;
        }
        .logo:hover {
          transform: scale(1.05);
        }
        .action-btn {
          display: inline-block;
          background: linear-gradient(45deg, #330B9E, #6d44d9);
          color: white;
          padding: 15px 30px;
          text-decoration: none;
          border-radius: 50px;
          font-weight: bold;
          font-size: 1.2em;
          transition: all 0.3s ease;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          border: none;
          cursor: pointer;
        }
        .action-btn:hover {
          background: linear-gradient(45deg, #4A0ED6, #8a67e8);
          transform: translateY(-2px);
          box-shadow: 0 6px 8px rgba(0, 0, 0, 0.2);
        }
        .container {
          background-color: rgba(255, 255, 255, 0.05);
          padding: 30px;
          border-radius: 15px;
          margin-top: 30px;
        }
        a {
          font-weight: bold;
          color: #ffffff;
          text-decoration: none;
          position: relative;
          transition: color 0.3s ease;
        }
        a::before {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 0;
          height: 100%;
          background-color: rgba(255, 255, 255, 0.9);
          transition: width 0.3s ease;
          z-index: -1;
        }
        a:hover {
          color: #330B9E;
        }
        a:hover::before {
          width: 100%;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .spinner {
          display: none;
          width: 20px;
          height: 20px;
          margin: 0 10px;
          border: 3px solid #f3f3f3;
          border-top: 3px solid #6d44d9;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        .processing .spinner {
          display: inline-block;
        }
        .processing .btn-text {
          display: none;
        }
      </style>
    </head>
    <body>
      <img src="${COMAPEO_LOGO_SVG}" alt="CoMapeo Logo" class="logo">
      <h1>${safeTitle}</h1>
      <div class="container">
        ${message}
        ${safeButtonUrl ? `<a href="${safeButtonUrl}" target="_blank" class="action-btn">${safeButtonText}</a>` : ""}
        ${
          safeButtonFunction || safeSecondaryButtonFunction
            ? `
          <div class="button-container" style="display: flex; gap: 15px; justify-content: center; margin-top: 20px;">
            ${safeButtonFunction ? `
              <button onclick="handlePrimaryClick()" class="action-btn primary-btn">
                <span class="btn-text">${safeButtonText}</span>
                <span class="spinner"></span>
              </button>` : ''}
            ${safeSecondaryButtonFunction ? `
              <button onclick="handleSecondaryClick()" class="action-btn secondary-btn" style="background: linear-gradient(45deg, #666, #888) !important;">
                <span class="btn-text">${safeSecondaryButtonText}</span>
                <span class="spinner"></span>
              </button>` : ''}
          </div>
          <script>
            function handlePrimaryClick() {
              const button = document.querySelector('.primary-btn');
              button.classList.add('processing');
              try {
                ${safeButtonFunction}();
              } catch (error) {
                console.error('Error:', error);
                button.classList.remove('processing');
              }
            }
            ${safeSecondaryButtonFunction ? `
            function handleSecondaryClick() {
              const button = document.querySelector('.secondary-btn');
              button.classList.add('processing');
              try {
                ${safeSecondaryButtonFunction}();
              } catch (error) {
                console.error('Error:', error);
                button.classList.remove('processing');
              }
            }` : ''}
          </script>
        `
            : ""
        }
      </div>
    </body>
    </html>
  `;

  // Validate HTML before returning to prevent "Malformed HTML content" errors
  if (typeof validateDialogHtml === "function") {
    try {
      validateDialogHtml(html, title || "Dialog");
    } catch (error) {
      console.error("HTML validation error in generateDialog:", error);
      // Return a safe fallback dialog
      return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>Error</title>
        </head>
        <body>
          <h1>Dialog Error</h1>
          <p>Unable to generate dialog due to malformed HTML content.</p>
          <p>Error: ${escapeHtml(String(error))}</p>
        </body>
        </html>
      `;
    }
  }

  return html;
}

function showIconsGeneratedDialog(folderUrl: string) {
  const title = iconDialogTexts[locale].title;
  const message = validateAndSanitizeMessage(iconDialogTexts[locale].message);
  const buttonText = iconDialogTexts[locale].buttonText;
  const html = generateDialog(title, message, buttonText, folderUrl);
  showModalDialogSafe(html, title, 800, 600, "Icons Generated");
}

function showProcessingModalDialog(dialogText: DialogText) {
  const messageLines = Array.isArray(dialogText.message)
    ? dialogText.message
    : [dialogText.message];

  // Use validateAndSanitizeMessage to ensure proper HTML structure
  const message = validateAndSanitizeMessage(messageLines);
  const html = generateDialog(dialogText.title, message);
  showModalDialogSafe(html, dialogText.title, 800, 600, "Processing");
}

/**
 * Updates the processing dialog with a new progress message without closing it.
 * Uses Google Apps Script's sidebar update mechanism.
 * Note: Due to Apps Script limitations, we can't update modals in real-time.
 * This function will close and reopen the dialog with updated content.
 */
function updateProcessingDialogProgress(mainMessage: string, detailMessage?: string) {
  const title = processingDialogTitle[locale];
  const messageLines = detailMessage
    ? [mainMessage, detailMessage]
    : [mainMessage];

  // Use validateAndSanitizeMessage to ensure proper HTML structure
  const message = validateAndSanitizeMessage(messageLines);
  const html = generateDialog(title, message);

  // Apps Script limitation: We have to close and reopen to update
  // This creates a brief flicker but provides progress feedback
  showModalDialogSafe(html, title, 800, 600, "Processing Progress");
}

function showConfigurationGeneratedDialog(folderUrl: string) {
  const title = generatedConfigDialogTexts[locale].title;
  const message = validateAndSanitizeMessage(generatedConfigDialogTexts[locale].message);
  const buttonText = generatedConfigDialogTexts[locale].buttonText;
  const html = generateDialog(title, message, buttonText, folderUrl);
  showModalDialogSafe(html, title, 800, 980, "Configuration Generated");
}

function showHelpDialog() {
  const title = helpDialogTexts[locale].title;
  const msgHeader = validateAndSanitizeMessage(helpDialogTexts[locale].message);

  // Instructions already contain HTML tags (like <br /> and <a>), validate them
  const instructions = helpDialogTexts[locale].instructions
    .map((instruction) => {
      // Validate each instruction's HTML if it contains tags
      if (/<\w+/.test(instruction)) {
        const validation = typeof validateHtmlContent === "function"
          ? validateHtmlContent(instruction)
          : { isValid: true, errors: [] };

        if (!validation.isValid) {
          console.warn(`Invalid HTML in help instruction: ${instruction}`);
          return `<li>${escapeHtml(instruction)}</li>`;
        }
      }
      return `<li>${instruction}</li>`;
    })
    .join("\n");

  const footer = `<p>${escapeHtml(helpDialogTexts[locale].footer)}</p>`;

  const message = `
  ${msgHeader}
  <ol style="text-align: left;">
  ${instructions}
  </ol>
  ${footer}
`;
  const buttonText = helpDialogTexts[locale].buttonText;
  const buttonUrl =
    "https://github.com/digidem/comapeo-config-spreadsheet-plugin";
  const html = generateDialog(title, message, buttonText, buttonUrl);
  showModalDialogSafe(html, title, 800, 980, "Help");
}

function showAddLanguagesDialog() {
  const title = addLanguageDialogText[locale].title;
  const languages = getAllLanguages();
  const languageOptions = Object.entries(languages)
    .sort(([, nameA], [, nameB]) => nameA.localeCompare(nameB))
    .map(([code, name]) => `<option value="${escapeHtml(code)}">${escapeHtml(name)} (${escapeHtml(code)})</option>`)
    .join("");

  const message = `
    <p>${escapeHtml(addLanguageDialogText[locale].message[0])}</p>
    <select id="languageSelect" class="language-select" onchange="updateFields()" style="margin-bottom: 15px;">
      <option value="">${escapeHtml(addLanguageDialogText[locale].message[1])}</option>
      ${languageOptions}
    </select>
    <div id="languageInputs">
      <div class="language-row">
        <input type="text" class="language-name" placeholder="Language name (e.g. Spanish)" />
        <input type="text" class="language-iso" placeholder="ISO code (e.g. es)" />
      </div>
    </div>
    <button id="addLanguageBtn" onclick="addLanguageRow()" style="margin: 10px 0;">${escapeHtml(addLanguageDialogText[locale].message[2])}</button>
    <script>
      function updateFields() {
        const select = document.getElementById('languageSelect');
        const rows = document.querySelectorAll('.language-row');
        const lastRow = rows[rows.length - 1];
        const option = select.options[select.selectedIndex];
        if (option.value) {
          const name = option.text.split(' (')[0];
          const iso = option.value;
          lastRow.querySelector('.language-name').value = name;
          lastRow.querySelector('.language-iso').value = iso;
        }
      }

      function addLanguageRow() {
        const container = document.getElementById('languageInputs');
        const newRow = document.createElement('div');
        newRow.className = 'language-row';
        newRow.innerHTML = container.querySelector('.language-row').innerHTML;
        // Reset values in the new row
        newRow.querySelector('.language-name').value = '';
        newRow.querySelector('.language-iso').value = '';
        container.appendChild(newRow);
      }

      function getSelectedLanguages() {
        const rows = document.querySelectorAll('.language-row');
        const languages = Array.from(rows)
          .map(row => ({
            name: row.querySelector('.language-name').value,
            iso: row.querySelector('.language-iso').value
          }))
          .filter(lang => lang.name && lang.iso);
        if (languages.length === 0) {
          return;
        }
        google.script.run
          .withFailureHandler((error) => {
            console.error('Failed to add languages:', error);
            document.querySelector('.action-btn').classList.remove('processing');
          })
          .withSuccessHandler(() => {
            google.script.host.close();
          })
          .addNewLanguages(languages);
      }
    </script>
    <style>
      .language-row { margin: 10px 0; display: flex; gap: 5px; }
      input { width: 180px; padding: 5px; }
      select { width: 100%; padding: 5px; }
      button { padding: 8px 16px; }
      button:disabled { opacity: 0.6; cursor: not-allowed; }
    </style>
  `;
  const buttonText = addLanguageDialogText[locale].buttonText;
  const html = generateDialog(
    title,
    message,
    buttonText,
    null,
    "getSelectedLanguages",
  );
  showModalDialogSafe(html, title, 600, 800, "Add Languages");
}

function showSelectTranslationLanguagesDialog() {
  const primaryLanguage = getPrimaryLanguage();
  const availableTargetLanguages = getAvailableTargetLanguages();

  const title = selectTranslationLanguagesDialogText[locale].title;
  const messageTemplate = selectTranslationLanguagesDialogText[locale].message;

  // Replace placeholder with actual source language (escaped)
  const messages = messageTemplate.map(msg =>
    msg.replace('{{sourceLanguage}}', escapeHtml(primaryLanguage.name))
  );

  // Convert languages to JSON for client-side rendering (much safer!)
  const languagesJson = JSON.stringify(availableTargetLanguages);
  const primaryLanguageJson = JSON.stringify(primaryLanguage);

  const message = `
    ${messages.map(msg => `<p>${escapeHtml(msg)}</p>`).join('')}
    <div class="language-selection-container">
      <div class="source-language-info">
        <strong>Source Language:</strong> <span id="sourceLangDisplay"></span>
      </div>

      <div class="search-container">
        <input type="text" id="languageSearch" placeholder="Search languages..." oninput="filterLanguages()" />
      </div>

      <div class="target-languages">
        <strong>Target Languages:</strong>
        <div class="language-count">
          <span id="languageCount">0</span> languages available
        </div>
        <div class="languages-grid" id="languagesGrid">
          <!-- Generated client-side from JSON -->
        </div>
      </div>

      <div class="select-all-container">
        <button type="button" onclick="selectAllLanguages()" class="select-all-btn">Select All</button>
        <button type="button" onclick="deselectAllLanguages()" class="select-all-btn">Deselect All</button>
        <button type="button" onclick="selectCommonLanguages()" class="select-all-btn">Select Common</button>
      </div>
    </div>
    <style>
      .language-selection-container {
        text-align: left;
        margin: 20px 0;
        padding: 20px;
        background-color: rgba(255, 255, 255, 0.1);
        border-radius: 10px;
      }
      .source-language-info {
        margin-bottom: 20px;
        font-size: 1.1em;
      }
      .search-container {
        margin-bottom: 20px;
      }
      .search-container input {
        width: 100%;
        padding: 10px;
        border: 1px solid #6d44d9;
        border-radius: 5px;
        background-color: rgba(255, 255, 255, 0.1);
        color: #e0e0e0;
        font-size: 1em;
      }
      .search-container input::placeholder {
        color: #a0a0a0;
      }
      .target-languages {
        margin-bottom: 20px;
      }
      .language-count {
        margin: 10px 0;
        font-size: 0.9em;
        color: #a0a0a0;
      }
      .languages-grid {
        max-height: 300px;
        overflow-y: auto;
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 5px;
        padding: 10px;
        background-color: rgba(255, 255, 255, 0.05);
      }
      .language-checkbox {
        margin: 8px 0;
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .language-checkbox input[type="checkbox"] {
        width: 18px;
        height: 18px;
        margin: 0;
      }
      .language-checkbox label {
        font-size: 1.0em;
        cursor: pointer;
      }
      .select-all-container {
        display: flex;
        gap: 10px;
        margin-top: 15px;
        flex-wrap: wrap;
      }
      .select-all-btn {
        padding: 8px 16px;
        background-color: rgba(109, 68, 217, 0.3);
        border: 1px solid #6d44d9;
        color: #e0e0e0;
        border-radius: 5px;
        cursor: pointer;
        font-size: 0.9em;
      }
      .select-all-btn:hover {
        background-color: rgba(109, 68, 217, 0.5);
      }
    </style>
  `;

  const buttonText = selectTranslationLanguagesDialogText[locale].buttonText;
  const skipButtonText = selectTranslationLanguagesDialogText[locale].skipButtonText;

  // CRITICAL: Use string concatenation instead of template literals to avoid
  // JSON injection breaking the template literal context (e.g., if JSON contains ` or ${})
  const allJavaScript =
    '// Data from server (safe JSON)\n' +
    'var availableLanguages = ' + languagesJson + ';\n' +
    'var primaryLanguage = ' + primaryLanguageJson + ';\n' +
    "var commonLanguages = ['en', 'es', 'pt', 'fr', 'de', 'it', 'ja', 'ko', 'zh-CN', 'ru', 'ar', 'hi'];\n" +
    '\n' +
    '// Initialize on page load\n' +
    "document.addEventListener('DOMContentLoaded', function() {\n" +
    '  initializeLanguageSelection();\n' +
    '});\n' +
    '\n' +
    'function initializeLanguageSelection() {\n' +
    "  // Display source language\n" +
    "  document.getElementById('sourceLangDisplay').textContent =\n" +
    "    primaryLanguage.name + ' (' + primaryLanguage.code + ')';\n" +
    '\n' +
    '  // Generate language checkboxes client-side\n' +
    '  renderLanguageCheckboxes(availableLanguages);\n' +
    '}\n' +
    '\n' +
    'function renderLanguageCheckboxes(languages) {\n' +
    '  var sortedLanguages = Object.entries(languages).sort(function(a, b) {\n' +
    '    return a[1].localeCompare(b[1]);\n' +
    '  });\n' +
    '\n' +
    "  var grid = document.getElementById('languagesGrid');\n" +
    "  grid.innerHTML = '';\n" +
    '\n' +
    '  for (var i = 0; i < sortedLanguages.length; i++) {\n' +
    '    var code = sortedLanguages[i][0];\n' +
    '    var name = sortedLanguages[i][1];\n' +
    '\n' +
    "    var checkbox = document.createElement('div');\n" +
    "    checkbox.className = 'language-checkbox';\n" +
    '\n' +
    "    var input = document.createElement('input');\n" +
    "    input.type = 'checkbox';\n" +
    "    input.id = 'lang_' + code;\n" +
    '    input.value = code;\n' +
    '\n' +
    "    var label = document.createElement('label');\n" +
    "    label.htmlFor = 'lang_' + code;\n" +
    "    label.textContent = name + ' (' + code + ')';\n" +
    '\n' +
    '    checkbox.appendChild(input);\n' +
    '    checkbox.appendChild(label);\n' +
    '    grid.appendChild(checkbox);\n' +
    '  }\n' +
    '\n' +
    "  document.getElementById('languageCount').textContent = sortedLanguages.length;\n" +
    '}\n' +
    '\n' +
    'function filterLanguages() {\n' +
    "  var searchTerm = document.getElementById('languageSearch').value.toLowerCase();\n" +
    "  var checkboxes = document.querySelectorAll('.language-checkbox');\n" +
    '  var visibleCount = 0;\n' +
    '\n' +
    '  for (var i = 0; i < checkboxes.length; i++) {\n' +
    '    var checkbox = checkboxes[i];\n' +
    "    var label = checkbox.querySelector('label').textContent.toLowerCase();\n" +
    '    if (label.includes(searchTerm)) {\n' +
    "      checkbox.style.display = 'flex';\n" +
    '      visibleCount++;\n' +
    '    } else {\n' +
    "      checkbox.style.display = 'none';\n" +
    '    }\n' +
    '  }\n' +
    '\n' +
    "  document.getElementById('languageCount').textContent = visibleCount;\n" +
    '}\n' +
    '\n' +
    'function selectAllLanguages() {\n' +
    '  var allCheckboxes = document.querySelectorAll(\'input[type="checkbox"]\');\n' +
    '  for (var i = 0; i < allCheckboxes.length; i++) {\n' +
    '    var cb = allCheckboxes[i];\n' +
    "    var parent = cb.closest('.language-checkbox');\n" +
    "    if (parent && parent.style.display !== 'none') {\n" +
    '      cb.checked = true;\n' +
    '    }\n' +
    '  }\n' +
    '}\n' +
    '\n' +
    'function deselectAllLanguages() {\n' +
    '  var checkboxes = document.querySelectorAll(\'input[type="checkbox"]\');\n' +
    '  for (var i = 0; i < checkboxes.length; i++) {\n' +
    '    checkboxes[i].checked = false;\n' +
    '  }\n' +
    '}\n' +
    '\n' +
    'function selectCommonLanguages() {\n' +
    '  deselectAllLanguages();\n' +
    '  for (var i = 0; i < commonLanguages.length; i++) {\n' +
    '    var langCode = commonLanguages[i];\n' +
    "    var checkbox = document.getElementById('lang_' + langCode);\n" +
    '    if (checkbox) {\n' +
    '      checkbox.checked = true;\n' +
    '    }\n' +
    '  }\n' +
    '}\n' +
    '\n' +
    'function getSelectedTargetLanguages() {\n' +
    '  var checkedBoxes = document.querySelectorAll(\'input[type="checkbox"]:checked\');\n' +
    '  var selectedLanguages = [];\n' +
    '  for (var i = 0; i < checkedBoxes.length; i++) {\n' +
    '    selectedLanguages.push(checkedBoxes[i].value);\n' +
    '  }\n' +
    '\n' +
    '  if (selectedLanguages.length === 0) {\n' +
    "    alert('Please select at least one target language.');\n" +
    "    var btn = document.querySelector('.primary-btn');\n" +
    "    if (btn) btn.classList.remove('processing');\n" +
    '    return;\n' +
    '  }\n' +
    '\n' +
    '  google.script.run\n' +
    '    .withFailureHandler(function(error) {\n' +
    "      console.error('Failed to generate CoMapeo config:', error);\n" +
    "      var btn = document.querySelector('.primary-btn');\n" +
    "      if (btn) btn.classList.remove('processing');\n" +
    "      alert('CoMapeo config generation failed: ' + error.message);\n" +
    '    })\n' +
    '    .withSuccessHandler(function() {\n' +
    '      google.script.host.close();\n' +
    '    })\n' +
    '    .generateCoMapeoConfigWithSelectedLanguages(selectedLanguages);\n' +
    '}\n' +
    '\n' +
    'function skipTranslation() {\n' +
    "  console.log('[CLIENT] Skip Translation button clicked');\n" +
    '  google.script.run\n' +
    '    .withFailureHandler(function(error) {\n' +
    "      console.error('[CLIENT] Failed to generate CoMapeo config:', error);\n" +
    "      var btn = document.querySelector('.secondary-btn');\n" +
    "      if (btn) btn.classList.remove('processing');\n" +
    "      alert('CoMapeo config generation failed: ' + error.message);\n" +
    '    })\n' +
    '    .withSuccessHandler(function() {\n' +
    '      google.script.host.close();\n' +
    '    })\n' +
    '    .generateCoMapeoConfigSkipTranslation();\n' +
    '}';

  // Add the message content with consolidated JavaScript
  const fullMessage = message + '<script>' + allJavaScript + '</script>';

  const html = generateDialog(
    title,
    fullMessage,
    buttonText,
    null,
    "getSelectedTargetLanguages",
    skipButtonText,
    "skipTranslation",
  );
  showModalDialogSafe(html, title, 750, 900, "Translation Language Selection");
}
