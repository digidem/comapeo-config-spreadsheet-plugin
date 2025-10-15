// MENU
let menuTexts: Record<string, MainMenuText> = {
  es: {
    menu: "Herramientas CoMapeo",
    translateCoMapeoCategory: "Traducir Categorías de CoMapeo",
    addCustomLanguages: "Agregar lenguajes customizados",
    generateIcons: "Generar Íconos para Categorías",
    generateCoMapeoCategory: "Generar Categorías de CoMapeo",
    generateCoMapeoCategoryInMemory: "Generar Categorías (solo ZIP)",
    importCategoryFile: "Importar archivo de categoría",
    lintAllSheets: "Validar Planillas",
    cleanAllSheets: "Resetear Planillas",
    openHelpPage: "Ayuda",
  },
  en: {
    menu: "CoMapeo Tools",
    translateCoMapeoCategory: "Translate CoMapeo Category",
    addCustomLanguages: "Add Custom Languages",
    generateIcons: "Generate Category Icons",
    generateCoMapeoCategory: "Generate CoMapeo Category",
    generateCoMapeoCategoryInMemory: "Generate CoMapeo Category (ZIP only)",
    importCategoryFile: "Import category file",
    lintAllSheets: "Lint Sheets",
    cleanAllSheets: "Reset Spreadsheet",
    openHelpPage: "Help",
  },
};

let translateMenuTexts: Record<string, MenuText> = {
  es: {
    action: "Traducir Categoría de CoMapeo",
    actionText:
      "Esto traducirá todas las celdas vacías en todas las otras columnas de traducción de lenguages. Continuar?",
    completed: "Traducción Completada",
    completedText: "Todas las planillas fueron traducidas con éxito",
    error: "Error",
    errorText: "Ocurrió un error durante la traducción: ",
  },
  en: {
    action: "Translate CoMapeo Category",
    actionText:
      "This will translate all empty cells in the other translation language columns. Continue?",
    completed: "Translation Complete",
    completedText: "All sheets have been translated successfully.",
    error: "Error",
    errorText: "An error occurred during translation: ",
  },
};

let iconMenuTexts: Record<string, MenuText> = {
  es: {
    action: "Generar Íconos",
    actionText:
      "Esta acción generará íconos usando la información de la planilla actual. Esto puede llevar algunos minutos para processar. ¿Continuar?",
    error: "Error",
    errorText: "Un error ocurrió generando los íconos: ",
  },
  en: {
    action: "Generate Icons",
    actionText:
      "This will generate icons based on the current spreadsheet data. It may take a few minutes to process. Continue?",
    error: "Error",
    errorText: "An error occurred while generating the icons: ",
  },
};

let categoryMenuTexts: Record<string, MenuText> = {
  es: {
    action: "Generar Categorías de CoMapeo",
    actionText:
      "Esto generará las categorías de CoMapeo basándose en la información de la planilla actual. Puede llevar unos minutos procesar. ¿Continuar?",
    error: "Error",
    errorText: "Ocurrió un error mientras se generaba la configuración: ",
  },
  en: {
    action: "Generate CoMapeo Category",
    actionText:
      "This will generate a CoMapeo category based on the current spreadsheet data. It may take a few minutes to process. Continue?",
    error: "Error",
    errorText: "An error occurred while generating the configuration: ",
  },
};

let categoryInMemoryMenuTexts: Record<string, MenuText> = {
  es: {
    action: "Generar ZIP sin guardar en Drive",
    actionText:
      "Esto generará el paquete de CoMapeo exclusivamente en memoria y lo enviará al API sin escribir archivos en Drive. ¿Continuar?",
    error: "Error",
    errorText:
      "Ocurrió un error mientras se generaba la configuración en modo solo ZIP: ",
  },
  en: {
    action: "Generate ZIP without Drive writes",
    actionText:
      "This will build the CoMapeo package entirely in memory and send it to the API without writing raw files to Drive. Continue?",
    error: "Error",
    errorText:
      "An error occurred while generating the configuration in ZIP-only mode: ",
  },
};

let lintMenuTexts: Record<string, MenuText> = {
  es: {
    action: "Validar Categorías de CoMapeo",
    actionText:
      "Esto validará todas las planillas en la hoja de cálculo. ¿Continuar?",
    completed: "Validación terminada",
    completedText: "Todas las planillas fueron validadas con éxito",
    error: "Error",
    errorText: "Un error ocurrió en la validación: ",
  },
  en: {
    action: "Lint CoMapeo Category",
    actionText: "This will lint all sheets in the spreadsheet. Continue?",
    completed: "Linting Complete",
    completedText: "All sheets have been linted successfully.",
    error: "Error",
    errorText: "An error occurred during linting: ",
  },
};

let cleanAllMenuTexts: Record<string, MenuText> = {
  es: {
    action: "Resetear Plantillas",
    actionText:
      "!Atención! Esto eliminará todas las traducciones, metadata e íconos the la hoja de cálculos. Esta acción no se puede revertir. ¿Continuar?",
    completed: "Reseteo Completado",
    completedText: "Todas las planillas fueron reseteadas con éxito",
    error: "Error",
    errorText: "Un error ocurrió durante el reseteo: ",
  },
  en: {
    action: "Reset Spreadsheet",
    actionText:
      "Attention! This will remove all translations, metadata, and icons from the spreadsheet. This action cannot be undone. Continue?",
    completed: "Reset Complete",
    completedText: "All sheets have been reset successfully.",
    error: "Error",
    errorText: "An error occurred during reset: ",
  },
};

let importCategoryMenuTexts: Record<string, MenuText> = {
  es: {
    action: "Importar archivo de categoría",
    actionText:
      "Esto te permitirá importar un archivo de categoría de CoMapeo (.comapeocat) o archivo de configuración de Mapeo (.mapeosettings) para editar. ADVERTENCIA: Esto borrará todos los datos actuales de la hoja de cálculo y los reemplazará con el contenido del archivo. ¿Continuar?",
    completed: "Importación Completada",
    completedText: "El archivo de categoría ha sido importado con éxito.",
    error: "Error",
    errorText: "Un error ocurrió durante la importación: ",
  },
  en: {
    action: "Import category file",
    actionText:
      "This will allow you to import a CoMapeo category file (.comapeocat) or Mapeo settings file (.mapeosettings) for editing. WARNING: This will erase all current spreadsheet data and replace it with content from the file. Continue?",
    completed: "Import Complete",
    completedText: "The category file has been successfully imported.",
    error: "Error",
    errorText: "An error occurred during import: ",
  },
};

let testExtractMenuTexts: Record<string, MenuText> = {
  es: {
    action: "Probar extracción y validación",
    actionText:
      "Esto descargará un archivo de prueba y ejecutará el proceso de extracción y validación para diagnosticar problemas. No se modificarán los datos de la hoja de cálculo. ¿Continuar?",
    completed: "Prueba Completada",
    completedText:
      "La prueba de extracción y validación se ha completado con éxito. Revisa los registros para obtener información detallada.",
    error: "Error",
    errorText: "Un error ocurrió durante la prueba: ",
  },
  en: {
    action: "Test extraction and validation",
    actionText:
      "This will download a test file and run the extraction and validation process to diagnose issues. No spreadsheet data will be modified. Continue?",
    completed: "Test Complete",
    completedText:
      "The extraction and validation test has completed successfully. Check the logs for detailed information.",
    error: "Error",
    errorText: "An error occurred during testing: ",
  },
};
