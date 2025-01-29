// MENU
let menuTexts: Record<string,MainMenuText> = {
  es: {
    menu: "Herramientas CoMapeo",
    translateCoMapeoCategory: "Traducir Categorías de CoMapeo",
    addCustomLanguages: "Agregar lenguajes customizados",
    generateIcons:"Generar Íconos para Categorías",
    generateProjectKey:"Generar Clave de Proyecto",
    generateCoMapeoCategory: "Generar Categorías de CoMapeo",
    lintAllSheets: "Validar Planillas",
    cleanAllSheets: "Resetear Planillas",
    openHelpPage: "Ayuda"
  },
  en: {
    menu: "CoMapeo Tools",
    translateCoMapeoCategory: "Translate CoMapeo Category",
    addCustomLanguages: "Add Custom Languages",
    generateIcons:"Generate Category Icons",
    generateProjectKey:"Generate Project Key",
    generateCoMapeoCategory: "Generate CoMapeo Category",
    lintAllSheets: "Lint Sheets",
    cleanAllSheets: "Reset Spreadsheet",
    openHelpPage: "Help"
  }
}

let translateMenuTexts: Record<string,MenuText> = {
  es: {
    action: "Traducir Categoría de CoMapeo",
    actionText: "Esto traducirá todas las celdas vacías en todas las otras columnas de traducción de lenguages. Continuar?",
    completed: "Traducción Completada",
    completedText: "Todas las planillas fueron traducidas con éxito",
    error: "Error",
    errorText: "Ocurrió un error durante la traducción: "
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

let customLanguageMenuTexts: Record<string, MenuText> = {
  es: {
    action: "Agregar idioma",
    actionText: "Esta acción agregará un idioma. Continuar?",
    completed: "Idioma agregado",
    completedText: "Idioma agregado con éxito",
    error: "Error",
    errorText: "Ocurrió un error agregando un idioma: "
  },
  en: {
    action: "Add Custom Language",
    actionText: "This action will add a custom language. Continue?",
    completed: "Language added",
    completedText: "Language added sucessfully",
    error: "Error",
    errorText:  "An error occurred while adding languages: "
  }
}


let iconMenuTexts: Record<string,MenuText> = {
  es: {
    action: "Generar Íconos",
    actionText: "Esta acción generará íconos usando la información de la planilla actual. Esto puede llevar algunos minutos para processar. ¿Continuar?",
    error: "Error",
    errorText: "Un error ocurrió generando los íconos: "
  },
  en: {
    action: "Generate Icons",
    actionText: "This will generate icons based on the current spreadsheet data. It may take a few minutes to process. Continue?",
    error: "Error",
    errorText: "An error occurred while generating the icons: "
  }
}

let projectKeyMenuTexts: Record<string, MenuText> = {
  es: {
    action:"Generar Clave de Proyecto",
    actionText: "Esto generará una clave de proyecto para tus Categorías de CoMapeo. ¿Continuar?",
    error: "Error",
    errorText: "Ocurrió un error mientras se generaba la clave del proyecto: ",
  },
  en: {
    action:"Generate Project Key",
    actionText: "This will generate a project key for your CoMapeo Category. Continue?",
    error:"Error",
    errorText:"An error occurred while generating the configuration: "
  }
}

let categoryMenuTexts: Record<string,MenuText> = {
  es: {
    action: "Generar Categorías de CoMapeo",
    actionText: "Esto generará las categorías de CoMapeo basándose en la información de la planilla actual. Puede llevar unos minutos procesar. ¿Continuar?",
    error: "Error",
    errorText: "Ocurrió un error mientras se generaba la configuración: "
  },
  en: {
    action: "Generate CoMapeo Category",
    actionText: "This will generate a CoMapeo category based on the current spreadsheet data. It may take a few minutes to process. Continue?",
    error: "Error",
    errorText: "An error occurred while generating the configuration: "
  }
}

let lintMenuTexts: Record<string, MenuText> = {
  es: {
    action: "Validar Categorías de CoMapeo",
    actionText: "Esto validará todas las planillas en la hoja de cálculo. ¿Continuar?",
    completed: "Validación terminada",
    completedText: "Todas las planillas fueron validadas con éxito",
    error: "Error",
    errorText: "Un error ocurrió en la validación: "
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
    actionText: "!Atención! Esto eliminará todas las traducciones, metadata e íconos the la hoja de cálculos. Esta acción no se puede revertir. ¿Continuar?",
    completed: "Reseteo Completado",
    completedText: "Todas las planillas fueron reseteadas con éxito",
    error: "Error",
    errorText: "Un error ocurrió durante el reseteo: "
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
