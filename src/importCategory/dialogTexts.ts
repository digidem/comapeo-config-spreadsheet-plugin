/**
 * Dialog texts for the import category functionality.
 * This file contains the texts used in the import category dialog.
 */

// Dialog texts for different languages
const importCategoryDialogTexts = {
  en: {
    title: "Import Category Configuration",
    message: [
      "Upload a .comapeocat or .mapeosettings file to import a category configuration.",
      "This will replace all current categories, details, and translations.",
      "Make sure you have a backup of your current configuration before proceeding.",
    ],
    buttonText: "Select File",
    progressStages: {
      extracting: "Extracting files",
      parsing: "Processing configuration",
      icons: "Extracting icons",
      applying: "Updating spreadsheet",
      finalizing: "Finalizing",
    },
  },
  es: {
    title: "Importar Configuración de Categoría",
    message: [
      "Sube un archivo .comapeocat o .mapeosettings para importar una configuración de categoría.",
      "Esto reemplazará todas las categorías, detalles y traducciones actuales.",
      "Asegúrate de tener una copia de seguridad de tu configuración actual antes de continuar.",
    ],
    buttonText: "Seleccionar Archivo",
    progressStages: {
      extracting: "Extrayendo archivos",
      parsing: "Procesando configuración",
      icons: "Extrayendo iconos",
      applying: "Actualizando hoja de cálculo",
      finalizing: "Finalizando",
    },
  },
  pt: {
    title: "Importar Configuração de Categoria",
    message: [
      "Carregue um arquivo .comapeocat ou .mapeosettings para importar uma configuração de categoria.",
      "Isso substituirá todas as categorias, detalhes e traduções atuais.",
      "Certifique-se de ter um backup da sua configuração atual antes de prosseguir.",
    ],
    buttonText: "Selecionar Arquivo",
    progressStages: {
      extracting: "Extraindo arquivos",
      parsing: "Processando configuração",
      icons: "Extraindo ícones",
      applying: "Atualizando planilha",
      finalizing: "Finalizando",
    },
  },
};
