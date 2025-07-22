function generateDialog(
  title: string,
  message: string,
  buttonText?: string,
  buttonUrl?: string,
  buttonFunction?: string,
  secondaryButtonText?: string,
  secondaryButtonFunction?: string,
): string {
  return `
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
      <img src="https://github.com/digidem/comapeo-mobile/blob/develop/assets/splash.png?raw=true" alt="CoMapeo Logo" class="logo">
      <h1>${title}</h1>
      <div class="container">
        ${message}
        ${buttonUrl ? `<a href="${buttonUrl}" target="_blank" class="action-btn">${buttonText}</a>` : ""}
        ${
          buttonFunction || secondaryButtonFunction
            ? `
          <div class="button-container" style="display: flex; gap: 15px; justify-content: center; margin-top: 20px;">
            ${buttonFunction ? `
              <button onclick="handlePrimaryClick()" class="action-btn primary-btn">
                <span class="btn-text">${buttonText}</span>
                <span class="spinner"></span>
              </button>` : ''}
            ${secondaryButtonFunction ? `
              <button onclick="handleSecondaryClick()" class="action-btn secondary-btn" style="background: linear-gradient(45deg, #666, #888) !important;">
                <span class="btn-text">${secondaryButtonText}</span>
                <span class="spinner"></span>
              </button>` : ''}
          </div>
          <script>
            function handlePrimaryClick() {
              const button = document.querySelector('.primary-btn');
              button.classList.add('processing');
              try {
                ${buttonFunction}();
              } catch (error) {
                console.error('Error:', error);
                button.classList.remove('processing');
              }
            }
            ${secondaryButtonFunction ? `
            function handleSecondaryClick() {
              const button = document.querySelector('.secondary-btn');
              button.classList.add('processing');
              try {
                ${secondaryButtonFunction}();
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
}

function showIconsGeneratedDialog(folderUrl: string) {
  const title = iconDialogTexts[locale].title;
  const message = iconDialogTexts[locale].message
    .map((msg) => `<p>${msg}</p>`)
    .join("\n");
  const buttonText = iconDialogTexts[locale].buttonText;
  const html = generateDialog(title, message, buttonText, folderUrl);
  SpreadsheetApp.getUi().showModalDialog(
    HtmlService.createHtmlOutput(html).setWidth(800).setHeight(600),
    title,
  );
}

function showProcessingModalDialog(dialogText: DialogText) {
  const message = ` <p>${dialogText.message}</p> `;
  const html = generateDialog(dialogText.title, message);
  SpreadsheetApp.getUi().showModalDialog(
    HtmlService.createHtmlOutput(html).setWidth(800).setHeight(600),
    dialogText.title,
  );
}

function showConfigurationGeneratedDialog(folderUrl: string) {
  const title = generatedConfigDialogTexts[locale].title;
  const message = generatedConfigDialogTexts[locale].message
    .map((msg) => `<p>${msg}</p>`)
    .join("\n");
  const buttonText = generatedConfigDialogTexts[locale].buttonText;
  const html = generateDialog(title, message, buttonText, folderUrl);
  SpreadsheetApp.getUi().showModalDialog(
    HtmlService.createHtmlOutput(html).setWidth(800).setHeight(980),
    title,
  );
}

function showHelpDialog() {
  const title = helpDialogTexts[locale].title;
  const msgHeader = helpDialogTexts[locale].message
    .map((msg) => `<p>${msg}</p>`)
    .join("\n");
  const instructions = helpDialogTexts[locale].instructions
    .map((instruction) => `<li>${instruction}</li>`)
    .join("\n");
  const footer = `<p>${helpDialogTexts[locale].footer}</p>`;

  const message = `
  ${msgHeader}
  <ol style="text-align: left";>
  ${instructions}
  </ol>
  ${footer}
`;
  const buttonText = helpDialogTexts[locale].buttonText;
  const buttonUrl =
    "https://github.com/digidem/comapeo-config-spreadsheet-plugin";
  const html = generateDialog(title, message, buttonText, buttonUrl);
  SpreadsheetApp.getUi().showModalDialog(
    HtmlService.createHtmlOutput(html).setWidth(800).setHeight(980),
    title,
  );
}

function showAddLanguagesDialog() {
  const title = addLanguageDialogText[locale].title;
  const languages = getAllLanguages();
  const languageOptions = Object.entries(languages)
    .sort(([, nameA], [, nameB]) => nameA.localeCompare(nameB))
    .map(([code, name]) => `<option value="${code}">${name} (${code})</option>`)
    .join("");

  const message = `
    <p>${addLanguageDialogText[locale].message[0]}</p>
    <select id="languageSelect" class="language-select" onchange="updateFields()" style="margin-bottom: 15px;">
      <option value="">${addLanguageDialogText[locale].message[1]}</option>
      ${languageOptions}
    </select>
    <div id="languageInputs">
      <div class="language-row">
        <input type="text" class="language-name" placeholder="Language name (e.g. Spanish)" />
        <input type="text" class="language-iso" placeholder="ISO code (e.g. es)" />
      </div>
    </div>
    <button id="addLanguageBtn" onclick="addLanguageRow()" style="margin: 10px 0;">${addLanguageDialogText[locale].message[2]}</button>
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
  SpreadsheetApp.getUi().showModalDialog(
    HtmlService.createHtmlOutput(html).setWidth(600).setHeight(800),
    title,
  );
}

function showSelectTranslationLanguagesDialog() {
  const primaryLanguage = getPrimaryLanguage();
  const availableTargetLanguages = getAvailableTargetLanguages();

  const title = selectTranslationLanguagesDialogText[locale].title;
  const messageTemplate = selectTranslationLanguagesDialogText[locale].message;

  // Replace placeholder with actual source language
  const messages = messageTemplate.map(msg =>
    msg.replace('{{sourceLanguage}}', primaryLanguage.name)
  );

  // Sort languages alphabetically for better UX
  const sortedLanguages = Object.entries(availableTargetLanguages)
    .sort(([, nameA], [, nameB]) => nameA.localeCompare(nameB));

  // Generate checkboxes for each available target language
  const languageCheckboxes = sortedLanguages
    .map(([code, name]) =>
      `<div class="language-checkbox">
        <input type="checkbox" id="lang_${code}" value="${code}" />
        <label for="lang_${code}">${name} (${code})</label>
      </div>`
    )
    .join('');

  const message = `
    ${messages.map(msg => `<p>${msg}</p>`).join('')}
    <div class="language-selection-container">
      <div class="source-language-info">
        <strong>Source Language:</strong> ${primaryLanguage.name} (${primaryLanguage.code})
      </div>

      <div class="search-container">
        <input type="text" id="languageSearch" placeholder="Search languages..." oninput="filterLanguages()" />
      </div>

      <div class="target-languages">
        <strong>Target Languages:</strong>
        <div class="language-count">
          <span id="languageCount">${sortedLanguages.length}</span> languages available
        </div>
        <div class="languages-grid" id="languagesGrid">
          ${languageCheckboxes}
        </div>
      </div>

      <div class="select-all-container">
        <button type="button" onclick="selectAllLanguages()" class="select-all-btn">Select All</button>
        <button type="button" onclick="deselectAllLanguages()" class="select-all-btn">Deselect All</button>
        <button type="button" onclick="selectCommonLanguages()" class="select-all-btn">Select Common</button>
      </div>
    </div>
    <script>
      const commonLanguages = ['en', 'es', 'pt', 'fr', 'de', 'it', 'ja', 'ko', 'zh-CN', 'ru', 'ar', 'hi'];

      function filterLanguages() {
        const searchTerm = document.getElementById('languageSearch').value.toLowerCase();
        const checkboxes = document.querySelectorAll('.language-checkbox');
        let visibleCount = 0;

        checkboxes.forEach(checkbox => {
          const label = checkbox.querySelector('label').textContent.toLowerCase();
          if (label.includes(searchTerm)) {
            checkbox.style.display = 'flex';
            visibleCount++;
          } else {
            checkbox.style.display = 'none';
          }
        });

        document.getElementById('languageCount').textContent = visibleCount;
      }

      function selectAllLanguages() {
        const checkboxes = document.querySelectorAll('input[type="checkbox"]:not([style*="display: none"])');
        checkboxes.forEach(checkbox => checkbox.checked = true);
      }

      function deselectAllLanguages() {
        const checkboxes = document.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => checkbox.checked = false);
      }

      function selectCommonLanguages() {
        deselectAllLanguages();
        commonLanguages.forEach(langCode => {
          const checkbox = document.getElementById('lang_' + langCode);
          if (checkbox) {
            checkbox.checked = true;
          }
        });
      }

      function getSelectedTargetLanguages() {
        const checkboxes = document.querySelectorAll('input[type="checkbox"]:checked');
        const selectedLanguages = Array.from(checkboxes).map(checkbox => checkbox.value);

        if (selectedLanguages.length === 0) {
          alert('Please select at least one target language.');
          document.querySelector('.action-btn').classList.remove('processing');
          return;
        }

        google.script.run
          .withFailureHandler((error) => {
            console.error('Failed to generate CoMapeo config:', error);
            document.querySelector('.action-btn').classList.remove('processing');
            alert('CoMapeo config generation failed: ' + error.message);
          })
          .withSuccessHandler(() => {
            google.script.host.close();
          })
          .generateCoMapeoConfigWithSelectedLanguages(selectedLanguages);
      }

      function skipTranslation() {
        google.script.run
          .withFailureHandler((error) => {
            console.error('Failed to generate CoMapeo config:', error);
            document.querySelector('.skip-btn').classList.remove('processing');
            alert('CoMapeo config generation failed: ' + error.message);
          })
          .withSuccessHandler(() => {
            google.script.host.close();
          })
          .generateCoMapeoConfigWithSelectedLanguages([]);
      }
    </script>
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

  // Add the script functions for the dialog
  const scriptFunctions = `
    const commonLanguages = ['en', 'es', 'pt', 'fr', 'de', 'it', 'ja', 'ko', 'zh-CN', 'ru', 'ar', 'hi'];

    function filterLanguages() {
      const searchTerm = document.getElementById('languageSearch').value.toLowerCase();
      const checkboxes = document.querySelectorAll('.language-checkbox');
      let visibleCount = 0;

      checkboxes.forEach(checkbox => {
        const label = checkbox.querySelector('label').textContent.toLowerCase();
        if (label.includes(searchTerm)) {
          checkbox.style.display = 'flex';
          visibleCount++;
        } else {
          checkbox.style.display = 'none';
        }
      });

      document.getElementById('languageCount').textContent = visibleCount;
    }

    function selectAllLanguages() {
      const checkboxes = document.querySelectorAll('input[type="checkbox"]:not([style*="display: none"])');
      checkboxes.forEach(checkbox => checkbox.checked = true);
    }

    function deselectAllLanguages() {
      const checkboxes = document.querySelectorAll('input[type="checkbox"]');
      checkboxes.forEach(checkbox => checkbox.checked = false);
    }

    function selectCommonLanguages() {
      deselectAllLanguages();
      commonLanguages.forEach(langCode => {
        const checkbox = document.getElementById('lang_' + langCode);
        if (checkbox) {
          checkbox.checked = true;
        }
      });
    }

    function getSelectedTargetLanguages() {
      const checkboxes = document.querySelectorAll('input[type="checkbox"]:checked');
      const selectedLanguages = Array.from(checkboxes).map(checkbox => checkbox.value);

      if (selectedLanguages.length === 0) {
        alert('Please select at least one target language.');
        document.querySelector('.primary-btn').classList.remove('processing');
        return;
      }

      google.script.run
        .withFailureHandler((error) => {
          console.error('Failed to generate CoMapeo config:', error);
          document.querySelector('.primary-btn').classList.remove('processing');
          alert('CoMapeo config generation failed: ' + error.message);
        })
        .withSuccessHandler(() => {
          google.script.host.close();
        })
        .generateCoMapeoConfigWithSelectedLanguages(selectedLanguages);
    }

    function skipTranslation() {
      console.log('skipTranslation function called');
      google.script.run
        .withFailureHandler((error) => {
          console.error('Failed to generate CoMapeo config:', error);
          document.querySelector('.secondary-btn').classList.remove('processing');
          alert('CoMapeo config generation failed: ' + error.message);
        })
        .withSuccessHandler(() => {
          console.log('Skip translation completed successfully');
          google.script.host.close();
        })
        .generateCoMapeoConfigSkipTranslation();
    }
  `;

  // Add the message content with all the language selection UI
  const fullMessage = message + `<script>${scriptFunctions}</script>`;

  const html = generateDialog(
    title,
    fullMessage,
    buttonText,
    null,
    "getSelectedTargetLanguages",
    skipButtonText,
    "skipTranslation",
  );
  SpreadsheetApp.getUi().showModalDialog(
    HtmlService.createHtmlOutput(html).setWidth(750).setHeight(900),
    title,
  );
}
