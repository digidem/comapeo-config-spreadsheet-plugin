# SVG-First Priority Change Summary

## Change Made

**Date:** October 9, 2025

**What Changed:** Icon extraction priority order reversed to prefer SVG over PNG

## Previous Behavior ❌

**Priority Order:**
1. Phase 1: Extract PNG files from `icons/` directory (PRIMARY)
2. Phase 2: Extract SVG sprite from `icons.svg` (FALLBACK)
3. Result: PNG icons displayed, SVG icons skipped

**Problem:**
- User reported "icons are still broken PNG"
- Expected SVG icons (like `mapeo-config-deconstructor` outputs)
- Got PNG icons instead

## New Behavior ✅

**Priority Order:**
1. Phase 1: Extract SVG sprite from `icons.svg` (PRIMARY)
2. Phase 2: Extract PNG files from `icons/` directory (FALLBACK)
3. Result: SVG icons displayed, PNG icons only used if no SVG available

**Benefits:**
- ✅ Matches `mapeo-config-deconstructor` behavior
- ✅ SVG files are scalable and higher quality
- ✅ Better for display and export workflows
- ✅ Industry standard for icon storage

## Code Changes

### File: `src/importCategory/parseFiles.ts`

**Lines Changed:** 304-403

**Before:**
```typescript
// Phase 1: PNG extraction
console.log("=== ICON EXTRACTION PHASE 1: PNG Icons ===");
if (hasPngIconsDirectory(tempFolder)) {
  const pngIcons = extractPngIcons(...);
  // Add PNG icons
}

// Phase 2: SVG extraction
console.log("=== ICON EXTRACTION PHASE 2: SVG Sprite ===");
if (configData.iconsSvgFile) {
  const svgIcons = processIconSpriteBlob(...);
  // Add SVG icons if PNG doesn't exist
}
```

**After:**
```typescript
// Phase 1: SVG extraction (PRIMARY)
console.log("=== ICON EXTRACTION PHASE 1: SVG Sprite (Primary) ===");
if (configData.iconsSvgFile) {
  const svgIcons = processIconSpriteBlob(...);
  // Add SVG icons
}

// Phase 2: PNG extraction (FALLBACK)
console.log("=== ICON EXTRACTION PHASE 2: PNG Files (Fallback) ===");
if (hasPngIconsDirectory(tempFolder)) {
  const pngIcons = extractPngIcons(...);
  // Add PNG icons if SVG doesn't exist
}
```

## Testing

### Test File: `mapeo-default-min.mapeosettings`

**Contents:**
- ✅ `icons.svg` - SVG sprite with 2 icons (animal, building)
- ✅ `icons/*.png` - 18 individual PNG files
- ⚠️ `icons.png` - PNG sprite (cannot parse, ignored)

**Expected Result:**
- Icons extracted from `icons.svg` SVG sprite
- Individual PNG files ignored (SVG takes precedence)
- Spreadsheet displays SVG file URLs

### Console Output Example:

```
=== ICON EXTRACTION PHASE 1: SVG Sprite (Primary) ===
Processing icons.svg sprite file
Icons before SVG extraction: 0
✓ Extracted 2 icons from SVG sprite
  ✓ Added SVG icon: animal (URL: https://drive.google.com/...)
  ✓ Added SVG icon: building (URL: https://drive.google.com/...)
Added 2 new SVG icons
Total icons after SVG processing: 2

=== ICON EXTRACTION PHASE 2: PNG Files (Fallback) ===
Icons before PNG extraction: 2
Found icons/ directory, extracting PNG icons
✓ Extracted 18 PNG icons
Existing icon names (SVG takes precedence): animal, building
  ⊘ Skipped PNG icon (SVG exists): animal
  ⊘ Skipped PNG icon (SVG exists): building
Added 0 new PNG icons, skipped 2 (SVG priority)
Total icons after PNG extraction: 2

=== ICON EXTRACTION COMPLETE ===
Final icon count: 2
✓ Successfully extracted 2 icon(s)
```

## Fallback Behavior

### Scenario 1: Only SVG Sprite Available
- SVG icons extracted ✅
- No PNG extraction needed ✅

### Scenario 2: Only Individual PNGs Available
- SVG extraction skipped (no file)
- PNG icons extracted as fallback ✅

### Scenario 3: Both SVG and PNG Available
- SVG icons extracted ✅
- PNG icons skipped (SVG priority) ✅

### Scenario 4: Neither Available
- Warning displayed ⚠️
- No icons extracted ❌

## Migration Notes

**For Users:**
- If you were getting PNG icons before, you'll now get SVG icons
- This is the correct behavior matching mapeo-config-deconstructor
- SVG icons are higher quality and more appropriate

**For Developers:**
- Order of extraction phases swapped
- Logging updated to reflect new priority
- Documentation updated

## Related Files

- `src/importCategory/parseFiles.ts` - Main changes
- `src/importCategory/parseIconSprite.ts` - SVG extraction (already fixed)
- `src/importCategory/extractPngIcons.ts` - PNG extraction (unchanged)
- `ICON_PARSING_FIX.md` - Overall icon parsing improvements
- `PNG_SPRITE_LIMITATIONS.md` - Technical limitations reference

## Verification

**To verify the change worked:**

1. Import a mapeosettings file
2. Check console logs - should see "Phase 1: SVG Sprite (Primary)"
3. Check Categories sheet column B - URLs should point to .svg files
4. Click an icon URL - should open SVG file in Google Drive

**If you see PNG URLs instead:**
- Config file doesn't have SVG sprite
- PNG fallback is working correctly
- This is expected behavior

## Rollback Instructions

**If you need to revert to PNG-first priority:**

Edit `src/importCategory/parseFiles.ts` lines 304-403 and swap the two phases back:
1. Move PNG extraction block to line 304 (Phase 1)
2. Move SVG extraction block to line 358 (Phase 2)
3. Update console logging accordingly

**Why you might want to rollback:**
- SVG files not displaying properly in Google Sheets
- Specific requirement for PNG icons
- Compatibility issues

**Current recommendation:** Keep SVG-first priority (current state)
