// MENU
let menuTexts: Record<string,MainMenuText> = {
  es: {
    menu: "Herramientas CoMapeo",
    translateCoMapeoCategory: "Traducir Categorias de CoMapeo",
    addCustomLanguages: "Agregar lenguajes customizados",
    generateIcons:"Generar Iconos para Categorias",
    generateCoMapeoCategory: "Generar Categorias de CoMapeo",
    importCoMapeoCategory: "Importar Categorias de CoMapeo",
    lintAllSheets: "Validar Planillas",
    cleanAllSheets: "Resetear Planillas",
    openHelpPage: "Ayuda"
  },
  en: {
    menu: "CoMapeo Tools",
    translateCoMapeoCategory: "Translate CoMapeo Category",
    addCustomLanguages: "Add Custom Languages",
    generateIcons:"Generate Category Icons",
    generateCoMapeoCategory: "Generate CoMapeo Category",
    importCoMapeoCategory: "Import CoMapeo Category",
    lintAllSheets: "Lint Sheets",
    cleanAllSheets: "Reset Spreadsheet",
    openHelpPage: "Help"
  }
}

let translateMenuTexts: Record<string,MenuText> = {
  es: {
    action: "Traducir Categoria de CoMapeo",
    actionText: "Esto traducira todas las celdas vacias en todas las otras columnas de traduccion de lenguages. Continuar?",
    completed: "Traduccion Completada",
    completedText: "Todas las planillas fueron traducidas con exito",
    error: "Error",
    errorText: "Ocurrio un error durante la traduccion: "
  },
  en: {
    action: "Translate CoMapeo Category",
    actionText: "This will translate all empty cells in the other translation language columns. Continue?",
    completed: "Translation Complete",
    completedText: "All sheets have been translated successfully.",
    error: "Error",
    errorText: "An error occurred during translation: "

  }
}

let iconMenuTexts: Record<string,MenuText> = {
  es: {
    action: "Generar Iconos",
    actionText: "Esta accion generara iconos usando la informacion de la planilla actual. Esto puede llevar algunos minutos para processar. Continuar?",
    error: "Error",
    errorText: "Un error ocurrio generando los iconos: "
  },
  en: {
    action: "Generate Icons",
    actionText: "This will generate icons based on the current spreadsheet data. It may take a few minutes to process. Continue?",
    error: "Error",
    errorText: "An error occurred while generating the icons: "
  }
}

let categoryMenuTexts: Record<string,MenuText> = {
  es: {
    action: "Generar Categorias de CoMapeo",
    actionText: "Esto generara las categorias de CoMapeo basandose en la informacion de la planilla actual. Puede llevar unos minutos procesar. Continuar?",
    error: "Error",
    errorText: "Ocurrio un error mientras se generaba la configuracion: "
  },
  en: {
    action: "Generate CoMapeo Category",
    actionText: "This will generate a CoMapeo category based on the current spreadsheet data. It may take a few minutes to process. Continue?",
    error: "Error",
    errorText: "An error occurred while generating the configuration: "
  }
}

let importMenuTexts: Record<string,MenuText> = {
  es: {
    action: "Importar Categorias de CoMapeo",
    actionText: "Esto importara un archivo .comapeocat y poblara la planilla con los datos. Los datos existentes seran reemplazados. Continuar?",
    completed: "Importacion Completada",
    completedText: "El archivo fue importado con exito.",
    error: "Error",
    errorText: "Ocurrio un error durante la importacion: "
  },
  en: {
    action: "Import CoMapeo Category",
    actionText: "This will import a .comapeocat file and populate the spreadsheet with its data. Existing data will be replaced. Continue?",
    completed: "Import Complete",
    completedText: "The file was imported successfully.",
    error: "Error",
    errorText: "An error occurred during import: "
  }
}

let lintMenuTexts: Record<string, MenuText> = {
  es: {
    action: "Validar Categorias de CoMapeo",
    actionText: "Esto validara todas las planillas en la hoja de calculo. Continuar?",
    completed: "Validacion terminada",
    completedText: "Todas las planillas fueron validadas con exito",
    error: "Error",
    errorText: "Un error ocurrio en la validacion: "
  },
  en: {
    action: "Lint CoMapeo Category",
    actionText: "This will lint all sheets in the spreadsheet. Continue?",
    completed: "Linting Complete",
    completedText: "All sheets have been linted successfully.",
    error: "Error",
    errorText: "An error occurred during linting: "
  }
}

let cleanAllMenuTexts: Record<string, MenuText> = {
  es: {
    action: "Resetear Plantillas",
    actionText: "!Atencion! Esto eliminara todas las traducciones, metadata e iconos the la hoja de calculos. Esta accion no se puede revertir. Continuar?",
    completed: "Reseteo Completado",
    completedText: "Todas las planillas fueron reseteadas con exito",
    error: "Error",
    errorText: "Un error ocurrio durante el reseteo: "
  },
  en: {
    action: "Reset Spreadsheet",
    actionText: "Attention! This will remove all translations, metadata, and icons from the spreadsheet. This action cannot be undone. Continue?",
    completed: "Reset Complete",
    completedText: "All sheets have been reset successfully.",
    error: "Error",
    errorText:"An error occurred during reset: "
  }
}
