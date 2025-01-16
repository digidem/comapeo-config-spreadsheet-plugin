function generateDialog(title: string, message: string, buttonText?: string, buttonUrl?: string): string {
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
          width: 200px;
          height: 200px;
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
      </style>
    </head>
    <body>
      <img src="https://github.com/digidem/comapeo-mobile/blob/develop/assets/splash.png?raw=true" alt="CoMapeo Logo" class="logo">
      <h1>${title}</h1>
      <div class="container">
        ${message}
        ${(buttonUrl && buttonText)
            ? `<a href="${buttonUrl}" target="_blank" class="action-btn">${buttonText}</a>`
            : ''}
      </div>
    </body>
    </html>
  `;
}

function showIconsGeneratedDialog(folderUrl: string) {
  const title = iconDialogTexts[locale].title ;
  const message = iconDialogTexts[locale].message.map(msg => `<p>${msg}</p>`).join("\n")
  const buttonText = iconDialogTexts[locale].buttonText;
  const html = generateDialog(title, message, buttonText, folderUrl);
  SpreadsheetApp.getUi().showModalDialog(HtmlService.createHtmlOutput(html).setWidth(800).setHeight(600), title);
}

function showProcessingModalDialog(text:string){
  const title = "Generating Comapeo Config"
  const message = ` <p>${text}</p> `
  const html = generateDialog(title, message)
    SpreadsheetApp.getUi().showModalDialog(HtmlService.createHtmlOutput(html).setWidth(800).setHeight(600), title)

}

function showConfigurationGeneratedDialog(folderUrl: string) {
  const title =generatedConfigDialogTexts[locale].title ;
  const message =  generatedConfigDialogTexts[locale].message
  .map(msg => `<p>${msg}</p>`).join("\n")
  const buttonText = generatedConfigDialogTexts[locale].buttonText;
  const html = generateDialog(title, message, buttonText, folderUrl);
  SpreadsheetApp.getUi().showModalDialog(HtmlService.createHtmlOutput(html).setWidth(800).setHeight(980), title);
}

function showHelpDialog() {
  const title = helpDialogTexts[locale].title
  const msgHeader = helpDialogTexts[locale].message.map(msg => `<p>${msg}</p>`).join("\n");
  const instructions = helpDialogTexts[locale].instructions
  .map(instruction => `<li>${instruction}</li>`).join("\n");
  const footer = `<p>${helpDialogTexts[locale].footer}</p>`

  const message = `
  ${msgHeader}
  <ol style="text-align: left";>
  ${instructions}
  </ol>
  ${footer}
`
  const buttonText = helpDialogTexts[locale].buttonText;
  const buttonUrl = "https://github.com/digidem/comapeo-config-spreadsheet-plugin";
  const html = generateDialog(title, message, buttonText, buttonUrl);
  SpreadsheetApp.getUi().showModalDialog(HtmlService.createHtmlOutput(html).setWidth(800).setHeight(980), title);
}
