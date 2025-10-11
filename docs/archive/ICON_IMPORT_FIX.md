# Icon Import Fix - Implementation Summary

## Problem Solved

Icons were not showing up during the import process when testing with `.mapeosettings` files because:

1. **TAR extraction was incomplete**: Only extracted 4 core files (metadata.json, presets.json, translations.json, icons.svg) and ignored the entire `icons/` directory containing individual PNG files
2. **No PNG support**: The import flow only supported SVG sprite processing, not individual PNG files
3. **Missing permanent storage**: While SVG icons were correctly moved to permanent storage, there was no equivalent for PNG files

## Solution Implemented

### 1. Enhanced TAR Extraction (`src/importCategory/fileExtractor.ts`)

**Changes**:
- Added detection for files in `icons/` directory (lines 528-530)
- Expanded file extraction to include icon files, not just core config files (line 532)
- Added MIME type detection for PNG files (lines 541-547)
- Implemented nested folder structure creation for icon files (lines 552-589)
- Icons are now extracted to `temp_folder/icons/` preserving directory structure

**Key Logic**:
```typescript
// Check if file is in icons/ directory
const isIconFile = fileName.includes("/icons/") || fileName.startsWith("icons/");
const shouldExtract = isCoreFile || isIconFile;

// Create nested folder structure for icon files
if (isIconFile && fileName.includes("/")) {
  // Creates temp_folder/icons/ subdirectory
  // Saves files like "animal-medium@1x.png" to correct location
}
```

### 2. New PNG Icon Extractor (`src/importCategory/extractPngIcons.ts` - NEW FILE)

**Purpose**: Extract individual PNG files from temp `icons/` directory and copy to permanent storage

**Key Features**:
- Searches for PNG icons matching preset icon names
- **Size/resolution priority**: Prefers `medium@1x`, falls back to `small@1x`, `large@1x`, etc.
- Creates permanent icons folder in config directory structure
- Copies PNGs to permanent location with simplified names (`{icon-name}.png`)
- Returns icon objects with permanent Drive URLs

**Functions**:
- `extractPngIcons(tempFolder, presets)` - Main extraction function
- `hasPngIconsDirectory(tempFolder)` - Helper to check for icons/ directory

**Extraction Priority**:
1. `{icon-name}-medium@1x.png` (preferred)
2. `{icon-name}-small@1x.png` (fallback)
3. `{icon-name}-large@1x.png` (fallback)
4. Then tries @2x and @3x resolutions

### 3. Updated Parse Flow (`src/importCategory/parseFiles.ts`)

**Changes**:
- Added PNG extraction before SVG sprite processing (lines 279-311)
- PNG icons take precedence over SVG icons
- Falls back to SVG sprite if PNG directory not found
- Prevents duplicate icons when both formats exist

**Processing Order**:
1. **First**: Try PNG extraction from `icons/` directory
2. **Second**: Fall back to SVG sprite processing
3. **Result**: Icon URLs point to permanent storage, survive temp folder cleanup

**Logic Flow**:
```typescript
// 1. Try PNG icons first
if (hasPngIconsDirectory(tempFolder)) {
  const pngIcons = extractPngIcons(tempFolder, configData.presets);
  // Add PNG icons to configData.icons
}

// 2. Fall back to SVG sprite
if (configData.iconsSvgFile) {
  const extractedIcons = processIconSpriteBlob(tempFolder, configData.iconsSvgFile);
  // Add SVG icons that don't already exist (PNG takes precedence)
}
```

## File Structure

### Before:
```
temp_import_123456/
├── metadata.json
├── presets.json
├── translations.json
└── icons.svg
```
❌ Icons directory completely ignored

### After:
```
temp_import_123456/
├── metadata.json
├── presets.json
├── translations.json
├── icons.svg
└── icons/                          ← NEW
    ├── animal-small@1x.png         ← NEW
    ├── animal-medium@1x.png        ← NEW
    ├── animal-large@1x.png         ← NEW
    ├── building-small@1x.png       ← NEW
    └── ... (all 18 PNG files)      ← NEW
```
✅ Complete extraction with folder structure preserved

### Permanent Storage:
```
{spreadsheet-name}/
└── icons/
    ├── animal.png     ← Copied from temp, permanent URL
    ├── building.png   ← Copied from temp, permanent URL
    └── ...
```
✅ Icons persist after temp folder cleanup

## Benefits

1. **Complete Icon Support**: Handles both PNG (preferred) and SVG icon formats
2. **Smart Fallback**: PNG → SVG → empty if nothing available
3. **Permanent Storage**: Icons survive temp folder cleanup
4. **Format Flexibility**: Works with .mapeosettings (TAR with PNGs) and .comapeocat (may only have SVG)
5. **Size Optimization**: Prefers medium@1x for good balance of quality/size
6. **Backward Compatible**: Existing SVG-only files still work

## Performance Optimization (Critical Fix)

**Problem Identified**: Import was hanging/taking too long with large icon sets
- Test `.comapeocat` file has **189 PNG files** (21 icons × 9 variants)
- Original code used repeated `getFilesByName()` calls: O(n × m) complexity
- Worst case: 189 files × 21 presets × up to 9 attempts = ~4,000 slow file searches

**Solution Implemented**: File indexing for O(1) lookup
- Build Map index of all files once: O(n) = 189 operations
- Use Map for instant lookups: O(1) per icon
- Total complexity: O(n + m) = 189 + 21 = 210 operations
- **Performance gain: ~19x faster**

**Code Changes** (`extractPngIcons.ts`):
```typescript
// Build index once (fast)
const availableFiles = new Map<string, File>();
const fileIterator = tempIconsFolder.getFiles();
while (fileIterator.hasNext()) {
  const file = fileIterator.next();
  availableFiles.set(file.getName(), file);
}

// Use indexed lookup (instant)
if (availableFiles.has(fileName)) {
  const file = availableFiles.get(fileName);
}
```

**Progress Logging Added**:
- Shows file indexing progress
- Updates every 5 icons during extraction
- Provides percentage completion
- User knows the process is working, not hanging

## Testing Checklist

### .mapeosettings Format (TAR Archive)
- [ ] Import `src/test/mapeo-default-min.mapeosettings` (18 PNG files)
- [ ] Verify extraction completes in <10 seconds
- [ ] Check Categories sheet column B contains valid Drive URLs
- [ ] Click icon URLs to confirm files are accessible
- [ ] Verify icons persist after temp folder cleanup

### .comapeocat Format (ZIP Archive)
- [ ] Import `src/test/generated-config.comapeocat` (189 PNG files)
- [ ] Verify file indexing completes quickly (~2-5 seconds)
- [ ] Check console logs show progress: "Extracting icons: X/21 (Y%)"
- [ ] Confirm extraction completes in reasonable time (~30-60 seconds)
- [ ] Verify all 21 icons extracted to permanent folder
- [ ] Check icon URLs work in Categories sheet
- [ ] Confirm temp folder cleanup doesn't break icons

### Performance & Error Handling
- [ ] Monitor console logs for progress indicators
- [ ] Verify no hanging or timeout issues
- [ ] Test with malformed archive to ensure graceful error handling
- [ ] Check that SVG fallback works if PNG directory missing

## Technical Details

### File Changes:
1. **src/importCategory/fileExtractor.ts**: TAR extraction enhancement (~70 lines modified)
2. **src/importCategory/extractPngIcons.ts**: New PNG processor (~170 lines new file)
3. **src/importCategory/parseFiles.ts**: Integration logic (~50 lines modified)

### Dependencies:
- Existing `slugify()` function from utils.ts
- Existing permanent folder creation pattern from processIconSpriteBlob()
- Google Apps Script Drive API

### Error Handling:
- Graceful degradation if PNG extraction fails
- Falls back to SVG sprite
- Logs warnings for missing icons
- Continues import even if some icons unavailable

## Next Steps

For production deployment:
1. Test with actual user .mapeosettings files
2. Monitor console logs for extraction success
3. Verify Drive quota/permissions for icon storage
4. Consider adding progress indicators for icon extraction
5. Add user notification if icons are missing from archive

## Related Documentation

- See `IMPORT_CAT.md` for complete .mapeosettings structure documentation
- See `CAT_GEN.md` for export process reference
