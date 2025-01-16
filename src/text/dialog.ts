let iconDialogTexts: Record<string,DialogText> = {
  es: {
    title: "Íconos de CoMapeo Generados",
    message: [
      "Tus íconos de CoMapeo fueron creados con éxito y guardados a una carpeta en tu Google Drive.",
      "Para ver y administrar tus íconos generados, haz click en el botón debajo. Puedes descargar, modificar o reemplazar los íconos como necesites.",
      "Recuerda actualizar las URLs en la planillas si haces algún cambio."
    ],
    buttonText: "Ver íconos generados"
  },
  en: {
    title: "CoMapeo Icons Generated",
    message: [
      "Your CoMapeo icons have been successfully generated and saved to a folder in your Google Drive.",
      "To view and manage your generated icons, click the button below. You can download, modify, or replace icons as needed.",
      "Remember to update the icon URLs in the spreadsheet if you make any changes."
    ],
    buttonText: "View Generated Icons"
  }
}

let generatedConfigDialogTexts: Record<string,DialogText> = {
  es: {
    title: "Categorías de CoMapeo generadas",
    message: [
      "Tus categorías de CoMapeo fueron creadas con éxito y comprimidas en un archivo de formato ZIP.",
      "Para descargar tus Categorías, haz click en el botón debajo. Una vez descargadas, extrae los contenidos y busca el archivo con extensión '.comapeocat', que puede ser importado en la aplicación de CoMapeo."
    ],
    buttonText: "Descargar categorías de CoMapeo"
  },
  en: {
    title: "CoMapeo Category Generated",
    message: [
      "Your CoMapeo Category file has been successfully generated and compressed into a zip file.",
      "To download your Category, click the button below. Once downloaded, extract the contents to locate the .comapeocat file, which can be imported into the CoMapeo app."
    ],
    buttonText: "Download CoMapeo Category"
  }
}

let helpDialogTexts: Record<string,DialogText & DialogInstructions> = {
  es: {
    title: "Herramientas de CoMapeo - Ayuda",
    message: [
      "Bienvenido a las herramientas de CoMapeo! Este add-on te ayudará a organizar y crear categorías de CoMapeo. Se usa de esta manera:",
      "La lógica de trabajo para crear y organizar categorías de CoMapeo es la siguiente:"
    ],
    instructions: [
      // TODO: sheets shouls also be translated
      "Edita las hojas llamadas 'Categories' y 'Details' para definir sus categorías propias y sus detalles asociados. Note que el color de fondo que seleccione para las categorías e íconos se verá reflejado en la app de CoMapeo",
      "Usa la opción 'Traducir Categorías de CoMapeo' para generar traducciones automáticamente para celdas vacías en otras columnas de lenguaje",
      "Revise y refine las traducciones auto-generadas cuánto sea necesario",
      "Use la opción 'Generar Íconos para Categorías' para crear íconos para sus categorías. El color de fondo de los íconos coincidirá con el color que eliga en la planilla.",
      "Revise los íconos generados en la caerpa de íconos y modífiquelos usando la <br /><a href='https://icons.earthdefenderstoolkit.com' target='_blank'>Icon Generator App</a>  de ser necessario",
      "Copie el link compartido para cada ícono y péguelo en la celda de ícono correspondiente en la planilla",
      "Use la opción 'Validar Planillas' para asegurarse que su información está en el formato y capitalización correcta.",
      "Use la opción 'Generar Clave de Projecto' para crear una clave única para su proyecto. Esta llave le asegura que su configuración sólo puede ser compartida con projectos que tienen la misma clave, mejorando la seguridad de CoMapeo",
      "Repita los pasos 1 al 8 tal como necesite, actualizando traducciones, íconos y clave de projecto hasta que esté conforme con los resultados.",
      "Cuando sus categorías estén listas, use la opcíon 'Generar Categorías de CoMapeo' para crear sus categorías finales. Este proceso puede tardar varios minutos y producira un archivo de formato zip que contiene su archivo con extensión '.comapeocat', listo para ser importado a la app de CoMapeo"
    ],
    footer: "Para más información, visite nuestro repositorio de Github",
    buttonText: "Visite repositorio de Github"
  },
  en: {
    title:  "CoMapeo Tools Help",
    message: [
      "Welcome to CoMapeo Tools! This add-on helps you manage and generate CoMapeo categories. Here's how to use it:",
      "The general workflow for creating and managing CoMapeo categories is as follows:"
    ],
    instructions: [
      "Edit the 'Categories' and 'Details' sheets to define your custom categories and their associated details. Note that the background color you set for categories and icons will reflect their color in the CoMapeo app.",
      "Use the 'Translate CoMapeo Category' option to automatically generate translations for empty cells in other language columns.",
      "Review and refine the auto-generated translations as needed.",
      "Use the 'Generate Icons' option to create icons for your categories. The background color of the icons will match the color you set in the spreadsheet.",
      "Check the generated icons in the icons folder and modify them using the <br /><a href='https://icons.earthdefenderstoolkit.com' target='_blank'>Icon Generator App</a> if necessary.",
      "Copy the shared link for each icon and paste it into the corresponding icon cell in the spreadsheet.",
      "Use the 'Lint Sheets' option to ensure proper formatting and capitalization of your data.",
      "Use the 'Generate Project Key' option to create a unique key for your project. This key ensures that your configuration can only be synced with projects using the same key, enhancing security.",
      "Repeat steps 1-8 as needed, updating translations, icons, and the project key until you're satisfied with the results.",
      "When ready, use the 'Generate CoMapeo Category' option to create your final configuration. This process may take a few minutes and will produce a zip file containing your .comapeocat file, ready for use with the CoMapeo app.",
    ],
    footer: "For more information, visit our Github repository",
    buttonText:  "Visit GitHub Repository"
  }
}


