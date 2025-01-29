function generateDialog(title: string, message: string, buttonText: string, buttonUrl?: string, buttonFunction?: string): string {
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
        ${buttonUrl ? `<a href="${buttonUrl}" target="_blank" class="action-btn">${buttonText}</a>` : ''}
        ${buttonFunction ? `
          <button onclick="handleClick()" class="action-btn">
            <span class="btn-text">${buttonText}</span>
            <span class="spinner"></span>
          </button>
          <script>
            function handleClick() {
              const button = document.querySelector('.action-btn');
              button.classList.add('processing');
              try {
                ${buttonFunction}();
              } catch (error) {
                console.error('Error:', error);
                button.classList.remove('processing');
              }
            }
          </script>
        ` : ''}
      </div>
    </body>
    </html>
  `;
}

function showIconsGeneratedDialog(folderUrl: string) {
  const title = "CoMapeo Icons Generated";
  const message = `
    <p>Your CoMapeo icons have been successfully generated and saved to a folder in your Google Drive.</p>
    <p>To view and manage your generated icons, click the button below. You can download, modify, or replace icons as needed.</p>
    <p>Remember to update the icon URLs in the spreadsheet if you make any changes.</p>
  `;
  const buttonText = "View Generated Icons";
  const html = generateDialog(title, message, buttonText, folderUrl);
  SpreadsheetApp.getUi().showModalDialog(HtmlService.createHtmlOutput(html).setWidth(800).setHeight(600), title);
}

function showConfigurationGeneratedDialog(folderUrl: string) {
  const title = "CoMapeo Category Generated";
  const message = `
    <p>Your CoMapeo Category file has been successfully generated and compressed into a zip file.</p>
    <p>To download your Category, click the button below. Once downloaded, extract the contents to locate the .comapeocat file, which can be imported into the CoMapeo app.</p>
  `;
  const buttonText = "Download CoMapeo Category";
  const html = generateDialog(title, message, buttonText, folderUrl);
  SpreadsheetApp.getUi().showModalDialog(HtmlService.createHtmlOutput(html).setWidth(800).setHeight(980), title);
}

function showHelpDialog() {
  const title = "CoMapeo Tools Help";
  const message = `
    <p>Welcome to CoMapeo Tools! This add-on helps you manage and generate CoMapeo categories. Here's how to use it:</p>
    <p>The general workflow for creating and managing CoMapeo categories is as follows:</p>
    <ol style="text-align: left;">
      <li>Edit the "Categories" and "Details" sheets to define your custom categories and their associated details. Note that the background color you set for categories and icons will reflect their color in the CoMapeo app.</li>
      <li>Use the "Translate CoMapeo Category" option to automatically generate translations for empty cells in other language columns.</li>
      <li>Review and refine the auto-generated translations as needed.</li>
      <li>Use the "Generate Icons" option to create icons for your categories. The background color of the icons will match the color you set in the spreadsheet.</li>
      <li>Check the generated icons in the icons folder and modify them using the <br /><a href="https://icons.earthdefenderstoolkit.com" target="_blank">Icon Generator App</a> if necessary.</li>
      <li>Copy the shared link for each icon and paste it into the corresponding icon cell in the spreadsheet.</li>
      <li>Use the "Lint Sheets" option to ensure proper formatting and capitalization of your data.</li>
      <li>Use the "Generate Project Key" option to create a unique key for your project. This key ensures that your configuration can only be synced with projects using the same key, enhancing security.</li>
      <li>Repeat steps 1-8 as needed, updating translations, icons, and the project key until you're satisfied with the results.</li>
      <li>When ready, use the "Generate CoMapeo Category" option to create your final configuration. This process may take a few minutes and will produce a zip file containing your .comapeocat file, ready for use with the CoMapeo app.</li>
    </ol>
    <p>For more detailed information, visit our GitHub repository:</p>
  `;
  const buttonText = "Visit GitHub Repository";
  const buttonUrl = "https://github.com/digidem/comapeo-config-spreadsheet-plugin";
  const html = generateDialog(title, message, buttonText, buttonUrl);
  SpreadsheetApp.getUi().showModalDialog(HtmlService.createHtmlOutput(html).setWidth(800).setHeight(980), title);
}

function showAddLanguagesDialog() {
  const title = "Add Languages for Translation";
  const languagesUrl = "https://raw.githubusercontent.com/digidem/comapeo-mobile/refs/heads/develop/src/frontend/languages.json";
  const languages = JSON.parse(UrlFetchApp.fetch(languagesUrl).getContentText());
  const languageOptions = Object.entries(languages)
    .map(([code, lang]) => `<option value="${code}">${(lang as {englishName: string}).englishName} (${code})</option>`)
    .join('');

  const message = `
    <p>Add custom languages for translation. Enter the language name and ISO code, or select from common languages. Click "Add Another Language" to add more.</p>
    <select id="languageSelect" class="language-select" onchange="updateFields()" style="margin-bottom: 15px;">
      <option value="">Select a common language...</option>
      ${languageOptions}
    </select>
    <div id="languageInputs">
      <div class="language-row">
        <input type="text" class="language-name" placeholder="Language name (e.g. Spanish)" />
        <input type="text" class="language-iso" placeholder="ISO code (e.g. es)" />
      </div>
    </div>
    <button id="addLanguageBtn" onclick="addLanguageRow()" style="margin: 10px 0;">Add Another Language</button>
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
  const buttonText = "Add Languages";
  const html = generateDialog(title, message, buttonText, null, 'getSelectedLanguages');
  SpreadsheetApp.getUi().showModalDialog(
    HtmlService.createHtmlOutput(html)
      .setWidth(600)
      .setHeight(800),
    title
  );
}
