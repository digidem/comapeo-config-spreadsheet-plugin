# PNG Sprite Limitations in Google Apps Script

## Executive Summary

**PNG sprite extraction is NOT supported** in Google Apps Script due to technical limitations. However, **most mapeosettings files will work fine** because they include individual PNG files that ARE supported.

## What Works ✅

### 1. Individual PNG Files from `icons/` Directory ✅ SUPPORTED

**What it looks like:**
```
mapeosettings/
├── icons/
│   ├── animal-small@1x.png
│   ├── animal-medium@1x.png
│   ├── animal-large@1x.png
│   ├── building-small@1x.png
│   ├── building-medium@1x.png
│   └── ... (18 total files)
```

**Status:** Fully supported and working

**Implementation:** `src/importCategory/extractPngIcons.ts`

**Priority Order:**
1. medium@1x.png (preferred)
2. small@1x.png (fallback)
3. large@1x.png (fallback)
4. Then tries @2x and @3x resolutions

**Test File:** `src/test/mapeo-default-min.mapeosettings` (18 PNG files)

---

### 2. SVG Sprite from `icons.svg` ✅ SUPPORTED

**What it looks like:**
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <symbol id="building-12px">
    <rect width="20" height="20" x="2" y="2" fill="#B209B2" />
  </symbol>
  <symbol id="river-12px">
    <path d="M2,12 C5,8 8,16..." stroke="#0D8DEF" />
  </symbol>
</svg>
```

**Status:** Fully supported with recent fixes

**Implementation:** `src/importCategory/parseIconSprite.ts`

**Fixes Applied:**
- ✅ Proper XML namespace handling
- ✅ Universal element support (rect, circle, path, polygon, etc.)
- ✅ Nested element handling
- ✅ Attribute preservation

**Recent Improvements:** See `ICON_PARSING_FIX.md`

---

## What Doesn't Work ❌

### PNG Sprite from `icons.png` ❌ NOT SUPPORTED

**What it looks like:**
```
mapeosettings/
├── icons.png        (200x100 PNG with 2 icons)
└── icons.json       (metadata with coordinates)
```

**icons.json example:**
```json
{
  "animal-100px": {
    "width": 100,
    "height": 100,
    "x": 0,
    "y": 0,
    "pixelRatio": 1
  },
  "building-100px": {
    "width": 100,
    "height": 100,
    "x": 100,
    "y": 0,
    "pixelRatio": 1
  }
}
```

**Status:** NOT SUPPORTED

**Why not supported:**

Google Apps Script lacks essential image processing capabilities:

1. **No Image Processing Libraries**
   - No Canvas API
   - No ImageMagick, Sharp, Jimp, etc.
   - No pixel manipulation capabilities

2. **No Binary Data Access**
   - Cannot decode PNG format
   - Cannot read pixel data
   - Cannot extract sub-regions

3. **No Native Image APIs**
   - `DriveApp` handles files as opaque blobs
   - No cropping/transformation functions
   - No image composition capabilities

**What Would Be Needed:**

```javascript
// PSEUDOCODE - NOT POSSIBLE IN APPS SCRIPT
const iconMetadata = JSON.parse(iconsJson);
const spriteImage = loadPNG(iconsPng);

for (const [iconName, coords] of Object.entries(iconMetadata)) {
  // Cannot do this in Apps Script:
  const croppedImage = cropImage(
    spriteImage,
    coords.x,
    coords.y,
    coords.width,
    coords.height
  );

  saveToDrive(croppedImage, `${iconName}.png`);
}
```

All of the above operations are impossible in Apps Script.

---

## Typical mapeosettings File Structure

Most mapeosettings files contain **multiple icon formats**:

```
mapeosettings-file/
├── icons.png          ← PNG sprite (CAN'T PARSE)
├── icons.json         ← Metadata (detected but unusable)
├── icons.svg          ← SVG sprite (CAN PARSE ✓)
├── icons/             ← Individual PNGs (CAN PARSE ✓)
│   ├── animal-small@1x.png
│   ├── animal-medium@1x.png
│   ├── animal-large@1x.png
│   └── ...
├── metadata.json
├── presets.json
├── translations.json
└── VERSION
```

**Result:** Even though PNG sprite can't be parsed, **the individual PNGs or SVG sprite work fine**.

---

## Icon Extraction Priority Order

**UPDATED Oct 9, 2025:** Priority changed to SVG-first

The import process tries multiple sources in this order:

```
1. SVG sprite (icons.svg) ← PRIMARY (changed)
   ↓ If none found
2. Individual PNG files (icons/ directory) ← FALLBACK
   ↓ If none found
3. PNG sprite (icons.png) → ⚠️ Shows warning, cannot extract
```

**Code Location:** `src/importCategory/parseFiles.ts:304-433`

**Why Changed:**
- ✅ Matches `mapeo-config-deconstructor` behavior
- ✅ SVG files are scalable and higher quality
- ✅ Resolves "broken PNG" issues

**See:** `SVG_PRIORITY_CHANGE.md` for detailed information about this change.

---

## Console Output Examples

### Success Case (Individual PNGs):
```
=== ICON EXTRACTION PHASE 1: PNG Icons ===
Icons before PNG extraction: 0
Found icons/ directory, extracting PNG icons
✓ Extracted 18 PNG icons
  ✓ Added PNG icon: animal (URL: https://drive.google.com/file/d/...)
  ✓ Added PNG icon: building (URL: https://drive.google.com/file/d/...)
Added 18 new PNG icons
Total icons after PNG extraction: 18

=== ICON EXTRACTION PHASE 2: SVG Sprite ===
No icons.svg file found, skipping SVG extraction

=== ICON EXTRACTION COMPLETE ===
Final icon count: 18
✓ Successfully extracted 18 icon(s)
```

### Success Case (SVG Sprite):
```
=== ICON EXTRACTION PHASE 1: PNG Icons ===
No icons/ directory found, will try SVG sprite

=== ICON EXTRACTION PHASE 2: SVG Sprite ===
Processing icons.svg sprite file
✓ Extracted 5 icons from SVG sprite
  ✓ Added SVG icon: building (URL: https://drive.google.com/file/d/...)
  ✓ Added SVG icon: river (URL: https://drive.google.com/file/d/...)
Added 5 new SVG icons, skipped 0 (PNG priority)

=== ICON EXTRACTION COMPLETE ===
Final icon count: 5
✓ Successfully extracted 5 icon(s)
```

### Warning Case (PNG Sprite Only):
```
=== ICON EXTRACTION PHASE 1: PNG Icons ===
No icons/ directory found, will try SVG sprite

=== ICON EXTRACTION PHASE 2: SVG Sprite ===
No icons.svg file found, skipping SVG extraction

=== ICON EXTRACTION COMPLETE ===
Final icon count: 0
⚠️ PNG SPRITE DETECTED BUT CANNOT BE EXTRACTED
   Google Apps Script cannot parse PNG sprites (icons.png)
   Reason: No image processing libraries available

   Options:
   1. Use config with individual PNG files in icons/ directory
   2. Use config with SVG sprite (icons.svg)
   3. Contact support about external API for PNG extraction

   Note: icons.json metadata detected but unusable without PNG extraction
```

---

## Solutions & Workarounds

### For Users

#### Option 1: Use Configs with Individual PNGs (Recommended)
Most mapeosettings files already include individual PNG files. These work perfectly.

**Check if your file has individual PNGs:**
1. Extract the mapeosettings file
2. Look for `icons/` directory
3. If it contains PNG files → ✅ Will work

#### Option 2: Use Configs with SVG Sprites
If your config has `icons.svg`, it will work with our recent fixes.

#### Option 3: Convert Your Config
If you only have PNG sprites:
1. Use `mapeo-settings-builder` to rebuild config
2. Ensure it outputs individual PNG files or SVG sprite
3. Or manually extract icons from PNG sprite using external tools

### For Developers

#### Option A: External API (If PNG Sprite Support Needed)

Create Node.js service:

```javascript
// External API endpoint
const express = require('express');
const sharp = require('sharp');

app.post('/extract-png-sprite', async (req, res) => {
  const { pngSprite, metadata } = req.body;

  const icons = [];
  for (const [name, coords] of Object.entries(metadata)) {
    const extracted = await sharp(pngSprite)
      .extract({
        left: coords.x,
        top: coords.y,
        width: coords.width,
        height: coords.height
      })
      .toBuffer();

    icons.push({ name, data: extracted });
  }

  res.json({ icons });
});
```

**Deployment:** Vercel, Railway, Heroku, Google Cloud Functions

**Integration:**
```typescript
// In Apps Script
function extractPngSpriteViaAPI(pngBlob, iconsJson) {
  const response = UrlFetchApp.fetch('https://api.example.com/extract-png-sprite', {
    method: 'post',
    payload: {
      pngSprite: pngBlob.getBytes(),
      metadata: JSON.parse(iconsJson.getDataAsString())
    }
  });

  const icons = JSON.parse(response.getContentText());
  return icons;
}
```

**Pros:**
- ✅ Full PNG sprite support
- ✅ Can handle any image format

**Cons:**
- ❌ Requires hosting
- ❌ Network latency
- ❌ Additional costs
- ❌ Security considerations

**Effort:** 2-3 days development + deployment

---

## Testing Recommendations

### Test with Real Files

**Test File 1:** `mapeo-default-min.mapeosettings`
- Has individual PNGs in `icons/` directory (18 files)
- **Expected:** All icons extracted successfully ✅

**Test File 2:** Custom config with SVG sprite only
- Has `icons.svg` but no `icons/` directory
- **Expected:** SVG icons extracted successfully ✅

**Test File 3:** Config with PNG sprite only
- Has `icons.png` and `icons.json` but no individual PNGs or SVG
- **Expected:** Warning shown, no icons extracted ⚠️

### Validation Steps

1. Import mapeosettings file
2. Check console logs for extraction phase messages
3. Verify Categories sheet column B has icon URLs
4. Click icon URLs to confirm files accessible
5. Check if icons display properly in Drive

---

## Frequently Asked Questions

### Q: Why can't you just use ImageMagick or Sharp?

**A:** Google Apps Script is a sandboxed JavaScript environment that doesn't allow installing Node.js packages or running external binaries. It only supports built-in Google services.

### Q: Can you use Google Vision API or similar?

**A:** Google Vision API can analyze images but cannot crop/extract sub-regions. It's designed for AI/ML tasks (OCR, label detection), not image manipulation.

### Q: What about Canvas API?

**A:** Google Apps Script doesn't have access to browser Canvas API. It runs server-side without DOM or Canvas.

### Q: Can you parse the PNG binary format directly?

**A:** Theoretically possible but extremely complex:
- Would need to implement full PNG decoder in JavaScript
- Would need to handle compression (zlib/deflate)
- Would need to re-encode extracted regions
- Effort: 2-3 weeks of development
- Performance: Very slow (JavaScript not optimized for this)
- Reliability: High risk of bugs
- **Not recommended**

### Q: Will this ever be supported natively?

**A:** Unlikely. Google Apps Script is designed for document automation, not image processing. Use external services for image tasks.

### Q: Do most mapeosettings files work?

**A:** Yes! Most mapeosettings files include:
- Individual PNG files in `icons/` directory ✅
- Or SVG sprite in `icons.svg` ✅
- PNG sprite is usually just an additional format

---

## Related Documentation

- **ICON_PARSING_FIX.md** - SVG sprite parsing improvements
- **ICON_IMPORT_FIX.md** - PNG file extraction from icons/ directory
- **IMPORT_CAT.md** - Overall import process documentation

---

## Summary

| Format | Status | Notes |
|--------|--------|-------|
| Individual PNGs (`icons/*.png`) | ✅ Supported | Preferred format, works great |
| SVG Sprite (`icons.svg`) | ✅ Supported | Works with recent fixes |
| PNG Sprite (`icons.png`) | ❌ Not Supported | Requires external API |

**Bottom Line:** The import feature works for standard mapeosettings files. PNG sprite-only configs would need external API support (not currently implemented).
