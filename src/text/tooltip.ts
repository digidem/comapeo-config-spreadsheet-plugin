const duplicateCellText: Record<string,DuplicateCellText> = {
  en: (duplicateValue, rows) => `There's a duplicate value ("${duplicateValue}") in rows: ${rows}, please delete one of the duplicates`,
  es: (duplicateValue, rows) => `Hay un valor duplicado (${duplicateValue}) en filas: ${rows}, por favor, borre uno de los duplicados`
}

const emptyCellText = {
  en: "detail type cell empty. Setting it to default: ",
  es: "celda de tipo de detalle vacía. Completando con el valor predeterminado: "
}
const invalidOrMissingTypeText = {
  en: "invalid or missing type for detail. valid ones: text, number, multiple, single",
  es: "invalido o faltante typo de detalle. tipos validos: text, number, multiple, single"
}
