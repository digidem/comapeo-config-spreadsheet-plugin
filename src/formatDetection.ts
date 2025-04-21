/**
 * Format detection and normalization module
 * Handles detection of configuration file formats and mapping between different formats
 */

/**
 * Configuration format types
 */
export enum ConfigFormat {
  COMAPEO = 'comapeo',
  MAPEO = 'mapeo',
  UNKNOWN = 'unknown'
}

/**
 * Normalized field structure that works with our spreadsheet format
 */
export interface NormalizedField {
  id: string;          // Original ID/key
  tagKey: string;      // Normalized ID for CoMapeo
  label: string;       // Display label
  type: string;        // Normalized type (selectOne, selectMultiple, text, number)
  helperText: string;  // Helper text/placeholder
  options?: Array<{ label: string; value: string }>; // Normalized options
  universal?: boolean; // Whether the field is universal
}

/**
 * Normalized preset/category structure
 */
export interface NormalizedPreset {
  id: string;          // Original ID
  name: string;        // Display name
  icon: string;        // Icon identifier
  color: string;       // Color (hex)
  fields: string[];    // Array of field IDs
}

/**
 * Normalized metadata structure
 */
export interface NormalizedMetadata {
  dataset_id: string;  // Dataset ID
  name: string;        // Configuration name
  version: string;     // Version string
  [key: string]: any;  // Additional metadata properties
}

/**
 * Normalized configuration data structure
 */
export interface NormalizedConfig {
  format: ConfigFormat;       // Detected format
  metadata: NormalizedMetadata;
  fields: NormalizedField[];
  presets: NormalizedPreset[];
  icons: any[];               // Icon data
  messages?: any;             // Translation messages
}

/**
 * Detects the format of a configuration based on its structure
 * @param configData - The configuration data to analyze
 * @returns The detected format
 */
export function detectConfigFormat(configData: any): ConfigFormat {
  console.log('Detecting configuration format...');
  
  // Check for empty or invalid data
  if (!configData) {
    console.warn('Empty configuration data');
    return ConfigFormat.UNKNOWN;
  }
  
  // Check for CoMapeo format indicators
  if (
    // Check for CoMapeo metadata structure
    (configData.metadata && 
     typeof configData.metadata.dataset_id === 'string' &&
     typeof configData.metadata.name === 'string') ||
    // Check for CoMapeo fields structure
    (Array.isArray(configData.fields) && 
     configData.fields.length > 0 &&
     configData.fields[0].tagKey) ||
    // Check for CoMapeo presets structure
    (Array.isArray(configData.presets) && 
     configData.presets.length > 0 &&
     configData.presets[0].geometry)
  ) {
    console.log('Detected CoMapeo format');
    return ConfigFormat.COMAPEO;
  }
  
  // Check for Mapeo format indicators
  if (
    // Check for Mapeo presets structure (object with preset IDs as keys)
    (configData.presets && 
     !Array.isArray(configData.presets) && 
     typeof configData.presets === 'object') ||
    // Check for Mapeo fields structure (object with field IDs as keys)
    (configData.fields && 
     !Array.isArray(configData.fields) && 
     typeof configData.fields === 'object') ||
    // Check for Mapeo metadata structure
    (configData.metadata && 
     typeof configData.metadata.name === 'string' &&
     !configData.metadata.dataset_id)
  ) {
    console.log('Detected Mapeo format');
    return ConfigFormat.MAPEO;
  }
  
  console.warn('Unknown configuration format');
  return ConfigFormat.UNKNOWN;
}

/**
 * Normalizes configuration data to a consistent format
 * @param configData - The configuration data to normalize
 * @returns Normalized configuration data
 */
export function normalizeConfig(configData: any): NormalizedConfig {
  const format = detectConfigFormat(configData);
  
  console.log(`Normalizing configuration from ${format} format...`);
  
  switch (format) {
    case ConfigFormat.COMAPEO:
      return normalizeCoMapeoConfig(configData);
    case ConfigFormat.MAPEO:
      return normalizeMapeoConfig(configData);
    default:
      // For unknown formats, try to extract as much as possible
      console.warn('Attempting to normalize unknown format');
      return {
        format: ConfigFormat.UNKNOWN,
        metadata: extractMetadata(configData),
        fields: extractFields(configData),
        presets: extractPresets(configData),
        icons: configData.icons || []
      };
  }
}

/**
 * Normalizes a CoMapeo configuration
 * @param configData - CoMapeo configuration data
 * @returns Normalized configuration
 */
function normalizeCoMapeoConfig(configData: any): NormalizedConfig {
  console.log('Normalizing CoMapeo configuration...');
  
  // CoMapeo format is already close to our normalized format
  return {
    format: ConfigFormat.COMAPEO,
    metadata: configData.metadata || {},
    fields: Array.isArray(configData.fields) 
      ? configData.fields.map(normalizeCoMapeoField)
      : [],
    presets: Array.isArray(configData.presets)
      ? configData.presets.map(normalizeCoMapeoPreset)
      : [],
    icons: configData.icons || [],
    messages: configData.messages
  };
}

/**
 * Normalizes a Mapeo configuration
 * @param configData - Mapeo configuration data
 * @returns Normalized configuration
 */
function normalizeMapeoConfig(configData: any): NormalizedConfig {
  console.log('Normalizing Mapeo configuration...');
  
  // Convert Mapeo fields (object with keys) to array of normalized fields
  const fields: NormalizedField[] = [];
  if (configData.fields && typeof configData.fields === 'object') {
    for (const fieldId in configData.fields) {
      if (configData.fields.hasOwnProperty(fieldId)) {
        const field = configData.fields[fieldId];
        fields.push(normalizeMapeoField(fieldId, field));
      }
    }
  }
  
  // Convert Mapeo presets (object with keys) to array of normalized presets
  const presets: NormalizedPreset[] = [];
  if (configData.presets && typeof configData.presets === 'object') {
    for (const presetId in configData.presets) {
      if (configData.presets.hasOwnProperty(presetId)) {
        const preset = configData.presets[presetId];
        presets.push(normalizeMapeoPreset(presetId, preset));
      }
    }
  }
  
  return {
    format: ConfigFormat.MAPEO,
    metadata: normalizeMapeoMetadata(configData.metadata || {}),
    fields,
    presets,
    icons: configData.icons || []
  };
}

/**
 * Normalizes a CoMapeo field
 * @param field - CoMapeo field object
 * @returns Normalized field
 */
function normalizeCoMapeoField(field: any): NormalizedField {
  return {
    id: field.tagKey || '',
    tagKey: field.tagKey || '',
    label: field.label || '',
    type: field.type || 'text',
    helperText: field.helperText || '',
    options: field.options || undefined,
    universal: field.universal || false
  };
}

/**
 * Normalizes a Mapeo field
 * @param fieldId - Field ID
 * @param field - Mapeo field object
 * @returns Normalized field
 */
function normalizeMapeoField(fieldId: string, field: any): NormalizedField {
  // Convert Mapeo field type to CoMapeo field type
  let normalizedType = 'text';
  if (field.type) {
    switch (field.type.toLowerCase()) {
      case 'select_one':
        normalizedType = 'selectOne';
        break;
      case 'select_multiple':
        normalizedType = 'selectMultiple';
        break;
      case 'number':
        normalizedType = 'number';
        break;
      default:
        normalizedType = 'text';
    }
  }
  
  // Convert Mapeo options to CoMapeo options format
  let normalizedOptions;
  if (field.options) {
    if (Array.isArray(field.options)) {
      // If options is an array of strings
      normalizedOptions = field.options.map((opt: any) => {
        if (typeof opt === 'string') {
          return { label: opt, value: slugify(opt) };
        } else if (typeof opt === 'object' && opt.label) {
          return { 
            label: opt.label, 
            value: opt.value || slugify(opt.label) 
          };
        }
        return null;
      }).filter(Boolean);
    } else if (typeof field.options === 'object') {
      // If options is an object with keys
      normalizedOptions = Object.entries(field.options).map(([key, value]) => ({
        label: typeof value === 'string' ? value : key,
        value: key
      }));
    }
  }
  
  return {
    id: fieldId,
    tagKey: fieldId,
    label: field.label || fieldId,
    type: normalizedType,
    helperText: field.placeholder || field.helperText || '',
    options: normalizedOptions,
    universal: field.universal || false
  };
}

/**
 * Normalizes a CoMapeo preset
 * @param preset - CoMapeo preset object
 * @returns Normalized preset
 */
function normalizeCoMapeoPreset(preset: any): NormalizedPreset {
  return {
    id: preset.icon || '',
    name: preset.name || '',
    icon: preset.icon || '',
    color: preset.color || '#0000FF',
    fields: preset.fields || []
  };
}

/**
 * Normalizes a Mapeo preset
 * @param presetId - Preset ID
 * @param preset - Mapeo preset object
 * @returns Normalized preset
 */
function normalizeMapeoPreset(presetId: string, preset: any): NormalizedPreset {
  return {
    id: presetId,
    name: preset.name || presetId,
    icon: preset.icon || presetId,
    color: preset.color || '#0000FF',
    fields: preset.fields || []
  };
}

/**
 * Normalizes Mapeo metadata to CoMapeo format
 * @param metadata - Mapeo metadata
 * @returns Normalized metadata
 */
function normalizeMapeoMetadata(metadata: any): NormalizedMetadata {
  // Create a dataset_id from the name if not present
  const name = metadata.name || 'mapeo-config';
  const dataset_id = metadata.dataset_id || `comapeo-${slugify(name)}`;
  
  return {
    dataset_id,
    name,
    version: metadata.version || new Date().toISOString().slice(0, 10).replace(/-/g, '.'),
    ...metadata // Include all other metadata properties
  };
}

/**
 * Extracts metadata from an unknown configuration format
 * @param configData - Configuration data
 * @returns Extracted metadata
 */
function extractMetadata(configData: any): NormalizedMetadata {
  const metadata: NormalizedMetadata = {
    dataset_id: 'unknown-config',
    name: 'Unknown Configuration',
    version: new Date().toISOString().slice(0, 10).replace(/-/g, '.')
  };
  
  // Try to extract metadata from various possible locations
  if (configData.metadata) {
    Object.assign(metadata, configData.metadata);
  }
  
  // Ensure required fields exist
  if (!metadata.dataset_id && metadata.name) {
    metadata.dataset_id = `comapeo-${slugify(metadata.name)}`;
  }
  
  return metadata;
}

/**
 * Extracts fields from an unknown configuration format
 * @param configData - Configuration data
 * @returns Extracted fields
 */
function extractFields(configData: any): NormalizedField[] {
  const fields: NormalizedField[] = [];
  
  // Try to extract fields from various possible locations
  if (Array.isArray(configData.fields)) {
    // Fields as array
    configData.fields.forEach((field: any) => {
      if (field) {
        fields.push({
          id: field.id || field.key || field.tagKey || '',
          tagKey: field.tagKey || field.key || field.id || '',
          label: field.label || '',
          type: field.type || 'text',
          helperText: field.helperText || field.placeholder || '',
          options: field.options
        });
      }
    });
  } else if (configData.fields && typeof configData.fields === 'object') {
    // Fields as object with keys
    for (const fieldId in configData.fields) {
      if (configData.fields.hasOwnProperty(fieldId)) {
        const field = configData.fields[fieldId];
        fields.push({
          id: fieldId,
          tagKey: fieldId,
          label: field.label || fieldId,
          type: field.type || 'text',
          helperText: field.helperText || field.placeholder || '',
          options: field.options
        });
      }
    }
  }
  
  return fields;
}

/**
 * Extracts presets from an unknown configuration format
 * @param configData - Configuration data
 * @returns Extracted presets
 */
function extractPresets(configData: any): NormalizedPreset[] {
  const presets: NormalizedPreset[] = [];
  
  // Try to extract presets from various possible locations
  if (Array.isArray(configData.presets)) {
    // Presets as array
    configData.presets.forEach((preset: any) => {
      if (preset) {
        presets.push({
          id: preset.id || preset.icon || '',
          name: preset.name || '',
          icon: preset.icon || '',
          color: preset.color || '#0000FF',
          fields: preset.fields || []
        });
      }
    });
  } else if (configData.presets && typeof configData.presets === 'object') {
    // Presets as object with keys
    for (const presetId in configData.presets) {
      if (configData.presets.hasOwnProperty(presetId)) {
        const preset = configData.presets[presetId];
        presets.push({
          id: presetId,
          name: preset.name || presetId,
          icon: preset.icon || presetId,
          color: preset.color || '#0000FF',
          fields: preset.fields || []
        });
      }
    }
  }
  
  return presets;
}

/**
 * Converts a string to a slug format.
 * @param input The input string to be converted.
 * @returns The slugified string.
 */
function slugify(input: any): string {
  const str = typeof input === 'string' ? input : String(input);
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
