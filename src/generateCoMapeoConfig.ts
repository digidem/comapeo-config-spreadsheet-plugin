import { getSpreadsheetData } from '../spreadsheetData';
import { saveConfigToDrive, showDownloadLink } from '../driveService';
import { processPresets } from './generateConfig/processPresets';
import { processFields } from './generateConfig/processFields';
import { processTranslations } from './generateConfig/processTranslations';
import { SheetData, CoMapeoConfig } from '../types';

function generateCoMapeoConfig() {
  const data = getSpreadsheetData();
  const config = processDataForCoMapeo(data);
  const folderUrl = saveConfigToDrive(config);
  showDownloadLink(folderUrl);
}

function processDataForCoMapeo(data: SheetData): CoMapeoConfig {
  const fields = processFields(data);
  const presets = processPresets(data);
  return {
    fields,
    presets,
    messages: processTranslations(data, fields, presets)
  };
}
