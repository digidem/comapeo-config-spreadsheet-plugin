# SVG Error Detection - Remaining Implementation Work

## Status Summary

✅ **Completed Phases (1-4)**:
- Phase 1: Centralized error collection system (`iconErrors.ts`)
- Phase 2: SVG validation layer (`svgValidator.ts`)
- Phase 3: Icon processor integration with error collection
- Phase 4: Enhanced icon API error reporting

📋 **Remaining Phases (5-8)**:
- Phase 5: Import icon error detection
- Phase 6: User-facing error dialog
- Phase 7: Pre-flight validation
- Phase 8: Integration and testing

---

## Phase 5: Import Icon Error Detection

### Objective
Add error tracking to the icon import pipeline to detect and report issues when importing `.comapeocat` files.

### Files to Modify

#### 1. `src/importCategory/parseIconSprite.ts`

**Add at top:**
```typescript
/// <reference path="../generateIcons/iconErrors.ts" />

interface SpriteProcessingResult {
  icons: { name: string; svg: string; id: string }[];
  errors: Array<{
    symbolId: string;
    error: string;
    context?: Record<string, any>;
  }>;
}
```

**Update `processIconSpriteBlob()`** (line 34):
```typescript
function processIconSpriteBlob(
  tempFolder: GoogleAppsScript.Drive.Folder,
  iconsSvgBlob?: GoogleAppsScript.Base.Blob,
): SpriteProcessingResult {
  const result: SpriteProcessingResult = {
    icons: [],
    errors: []
  };

  try {
    // ... existing code ...
    const icons = deconstructSvgSprite(
      iconsSvgFolder.getId(),
      iconsOutputFolder.getId(),
      result.errors  // Pass errors array
    );
    result.icons = icons;
    return result;
  } catch (error) {
    console.error("Error processing icon sprite blob:", error);
    result.errors.push({
      symbolId: "sprite-processing",
      error: `Failed to process SVG sprite: ${error.message}`,
      context: { stack: error.stack }
    });
    return result;
  }
}
```

**Update `deconstructSvgSprite()`** (line 171):
- Add `errors` parameter: `errors?: Array<{symbolId: string; error: string; context?: any}>`
- Instead of logging failures silently, push to errors array:
```typescript
if (!symbols || symbols.length === 0) {
  const errorMsg = "No <symbol> children in SVG";
  safeDebugLog(errorMsg);
  if (errors) {
    errors.push({
      symbolId: "sprite",
      error: errorMsg,
      context: { rootChildren: allChildren.map(c => c.getName()) }
    });
  }
  return [];
}
```

- In the symbol processing loop (line 272), replace `failedSymbols` array with errors array:
```typescript
catch (error) {
  const symbolId = i < symbols.length && symbols[i].getAttribute("id")
    ? symbols[i].getAttribute("id").getValue()
    : `symbol-${i + 1}`;
  safeDebugLog(`❌ ERROR processing symbol #${i + 1} (${symbolId}): ${error}`);

  if (errors) {
    errors.push({
      symbolId,
      error: String(error),
      context: { symbolIndex: i, stack: error.stack }
    });
  }
  continue;
}
```

#### 2. `src/importCategory/applyCategories.ts`

**Update `applyCategories()`** (line 31):
- Add `iconErrors` parameter
- Track icons that fail to map to presets
- Report missing icons

**Add after icon mapping** (line 73):
```typescript
// Track unmapped icons
if (preset.icon && !iconUrl) {
  if (iconErrors) {
    iconErrors.push({
      iconName: preset.icon,
      presetName: preset.name,
      error: "Icon not found in imported sprite",
      context: { searchedFor: preset.icon, availableIcons: Object.keys(iconMap) }
    });
  }
}
```

---

## Phase 6: User-Facing Error Dialog

### Objective
Create a comprehensive, user-friendly dialog to display icon processing errors with actionable guidance.

### Files to Modify

#### 1. `src/dialog.ts`

**Add new function** (after existing dialogs, ~line 900):
```typescript
/**
 * Show icon processing error report dialog
 * @param errorSummary - Summary of icon errors from processing
 */
function showIconErrorDialog(errorSummary: IconErrorSummary): void {
  const title = iconErrorDialogTexts[locale].title;

  // Build summary message
  const summaryLines: string[] = [];
  if (errorSummary.errorCount === 0) {
    summaryLines.push(`<p class="success">✅ All ${errorSummary.totalProcessed} icons processed successfully</p>`);
  } else {
    summaryLines.push(`<p>Processed <strong>${errorSummary.totalProcessed}</strong> icon(s):</p>`);
    summaryLines.push(`<ul>`);
    summaryLines.push(`  <li>✅ <strong>${errorSummary.successCount}</strong> successful</li>`);
    summaryLines.push(`  <li>⚠️ <strong>${errorSummary.errorCount}</strong> with issues</li>`);
    if (errorSummary.fallbackCount > 0) {
      summaryLines.push(`  <li>🔄 <strong>${errorSummary.fallbackCount}</strong> using fallback icon</li>`);
    }
    summaryLines.push(`</ul>`);
  }

  // Group errors by type
  const errorsByType = errorSummary.errorsByType;
  const errorSections: string[] = [];

  if (errorsByType.size > 0) {
    errorSections.push(`<h3>Issues by Category:</h3>`);

    for (const [errorType, errors] of errorsByType) {
      errorSections.push(`<div class="error-category">`);
      errorSections.push(`  <h4>${getErrorTypeLabel(errorType)} (${errors.length})</h4>`);
      errorSections.push(`  <ul class="error-list">`);

      // Show first 5 errors, collapse rest
      const visibleErrors = errors.slice(0, 5);
      for (const error of visibleErrors) {
        errorSections.push(`    <li>`);
        errorSections.push(`      <strong>${escapeHtml(error.iconName)}</strong>: ${escapeHtml(error.userMessage)}`);
        errorSections.push(`      <br/><span class="suggestion">→ ${escapeHtml(error.suggestedAction)}</span>`);
        if (error.context && error.context.fileId) {
          errorSections.push(`      <br/><span class="context">File ID: ${escapeHtml(error.context.fileId)}</span>`);
        }
        errorSections.push(`    </li>`);
      }

      if (errors.length > 5) {
        errorSections.push(`    <li class="more-errors">... and ${errors.length - 5} more</li>`);
      }

      errorSections.push(`  </ul>`);
      errorSections.push(`</div>`);
    }
  }

  const message = `
    <div class="icon-error-report">
      ${summaryLines.join("\n")}
      ${errorSections.join("\n")}
      ${errorSummary.hasCriticalErrors ?
        `<div class="critical-warning">⚠️ Critical errors detected. Please address permission and validation issues.</div>`
        : ''}
    </div>
    <style>
      .icon-error-report { text-align: left; }
      .success { color: #4caf50; font-size: 1.1em; }
      .error-category { margin: 15px 0; padding: 10px; background: rgba(255,255,255,0.05); border-radius: 5px; }
      .error-category h4 { margin: 5px 0; color: #ff9800; }
      .error-list { list-style: none; padding-left: 10px; }
      .error-list li { margin: 8px 0; padding: 5px; background: rgba(255,255,255,0.02); border-left: 3px solid #ff9800; }
      .suggestion { color: #81c784; font-size: 0.9em; }
      .context { color: #90caf9; font-size: 0.85em; }
      .more-errors { font-style: italic; color: #999; }
      .critical-warning { margin-top: 20px; padding: 15px; background: rgba(255,152,0,0.2); border: 2px solid #ff9800; border-radius: 5px; font-weight: bold; }
    </style>
  `;

  const html = generateDialog(
    title,
    message,
    iconErrorDialogTexts[locale].downloadButtonText,
    undefined,
    "downloadIconErrorReport",
    errorSummary.errorCount > 0 ? iconErrorDialogTexts[locale].continueButtonText : iconErrorDialogTexts[locale].okButtonText,
    "google.script.host.close"
  );

  showModalDialogSafe(html, title, 800, 600, "Icon Error Report");
}

function getErrorTypeLabel(errorType: string): string {
  const labels: Record<string, string> = {
    format: "📄 Format Errors",
    permission: "🔒 Permission Errors",
    api: "🌐 API Errors",
    drive: "💾 Drive Errors",
    validation: "✓ Validation Errors",
    network: "📡 Network Errors",
    timeout: "⏱️ Timeout Errors",
    unknown: "❓ Unknown Errors"
  };
  return labels[errorType] || errorType;
}

function downloadIconErrorReport(): void {
  // This function would be called from the dialog
  // It should retrieve the error summary and trigger CSV download
  google.script.run
    .withSuccessHandler(function(csvContent: string) {
      const blob = Utilities.newBlob(csvContent, 'text/csv', 'icon-errors.csv');
      // Trigger download via dialog
      const downloadUrl = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent);
      window.open(downloadUrl);
      google.script.host.close();
    })
    .withFailureHandler(function(error: Error) {
      alert('Failed to generate error report: ' + error.message);
    })
    .getIconErrorReportCsv();
}
```

#### 2. `src/text/dialog.ts`

**Add new dialog texts** (in appropriate section):
```typescript
export const iconErrorDialogTexts = {
  en: {
    title: "Icon Processing Report",
    downloadButtonText: "Download Error Report",
    continueButtonText: "Continue Anyway",
    okButtonText: "OK"
  },
  // ... add other languages
};
```

---

## Phase 7: Pre-flight Validation

### Objective
Add quick validation before icon processing starts to catch obvious issues early.

### Files to Modify

#### 1. `src/icons.ts`

**Add new function** (before `generateIconsConfig`):
```typescript
/**
 * Validates icons before processing to catch obvious issues
 * @returns Validation result with warnings
 */
function validateIconsBeforeProcessing(): {
  canContinue: boolean;
  warnings: string[];
  errors: string[];
} {
  const result = {
    canContinue: true,
    warnings: [],
    errors: []
  };

  try {
    const { categories, iconUrls } = getCategoryData();

    for (let i = 0; i < categories.length; i++) {
      const [name] = categories[i];
      const iconValue = iconUrls[i][0];

      // Quick validation
      if (!quickValidateIcon(iconValue)) {
        result.warnings.push(`Icon for "${name}" may have issues (empty or invalid format)`);
      }

      // Check Drive URLs for accessibility (quick check)
      if (typeof iconValue === "string" && iconValue.startsWith("https://drive.google.com")) {
        const fileId = iconValue.split("/d/")[1]?.split("/")[0];
        if (fileId) {
          const validation = validateDriveAccess(fileId);
          if (!validation.valid) {
            result.errors.push(`Cannot access Drive file for "${name}": ${validation.error}`);
            result.canContinue = false;
          }
        }
      }
    }

    return result;
  } catch (error) {
    result.errors.push(`Pre-flight validation failed: ${error.message}`);
    result.canContinue = false;
    return result;
  }
}
```

**Update `generateIconsConfig()`** (line 12):
```typescript
function generateIconsConfig() {
  // Run pre-flight validation
  const validation = validateIconsBeforeProcessing();

  if (!validation.canContinue) {
    const ui = SpreadsheetApp.getUi();
    ui.alert(
      "Icon Validation Failed",
      "Critical issues detected:\n\n" + validation.errors.join("\n") +
      "\n\nPlease fix these issues before generating icons.",
      ui.ButtonSet.OK
    );
    return;
  }

  if (validation.warnings.length > 0) {
    const ui = SpreadsheetApp.getUi();
    const response = ui.alert(
      "Icon Validation Warnings",
      "Some potential issues detected:\n\n" + validation.warnings.join("\n") +
      "\n\nDo you want to continue anyway?",
      ui.ButtonSet.YES_NO
    );

    if (response !== ui.Button.YES) {
      return;
    }
  }

  // Continue with existing icon generation
  // ... existing code ...
}
```

---

## Phase 8: Integration and Testing

### Objective
Integrate error reporting into the main config generation pipeline and test all scenarios.

### Files to Modify

#### 1. `src/generateCoMapeoConfig.ts`

**Update `processDataForCoMapeo()`** (line 331):
```typescript
function processDataForCoMapeo(data: SheetData): CoMapeoConfig {
  // ... existing code ...

  log.info("Processing icons...");
  const iconResult = processIcons();  // Now returns IconProcessingResult
  const icons = iconResult.icons;
  log.info(`Done processing ${icons.length} icons`);

  // Check for errors
  if (iconResult.errorSummary.errorCount > 0) {
    log.warn(`Icon processing completed with ${iconResult.errorSummary.errorCount} errors`);
    // Store error summary for later display
    PropertiesService.getScriptProperties().setProperty(
      "lastIconErrorSummary",
      JSON.stringify(iconResult.errorSummary)
    );
  }

  // ... rest of existing code ...
}
```

**Update completion section** (line 298):
```typescript
// Step 8: Complete
showProcessingModalDialog(processingDialogTexts[7][locale]);
log.info("Step 8: Finalizing...");

// Check if there were icon errors and show report
const errorSummaryJson = PropertiesService.getScriptProperties().getProperty("lastIconErrorSummary");
if (errorSummaryJson) {
  try {
    const errorSummary = JSON.parse(errorSummaryJson);
    if (errorSummary.errorCount > 0) {
      showIconErrorDialog(errorSummary);
    }
    // Clear after showing
    PropertiesService.getScriptProperties().deleteProperty("lastIconErrorSummary");
  } catch (e) {
    log.warn("Failed to parse icon error summary", e);
  }
}

showConfigurationGeneratedDialog(configUrl);
log.info("===== CoMapeo Config Generation Complete =====");
```

#### 2. `src/importCategory/applyConfiguration.ts`

**Update import completion** to show error dialog if there were icon import errors.

### Testing Scenarios

Create test cases for each error type:

1. **Format Errors**:
   - Cell with invalid SVG (missing tags, malformed XML)
   - Empty cell
   - Non-SVG content

2. **Permission Errors**:
   - Drive URL to file without access
   - Drive URL to deleted file
   - Drive URL with invalid file ID

3. **API Errors**:
   - Network disconnected (simulate)
   - API timeout (slow network)
   - Invalid icon search terms
   - Rate limiting (many rapid requests)

4. **Drive Errors**:
   - No storage space
   - Invalid folder permissions

5. **Import Errors**:
   - Malformed SVG sprite
   - Missing symbol IDs
   - Invalid XML structure
   - Missing namespace

6. **Mixed Scenarios**:
   - Some icons succeed, some fail
   - All icons fail
   - Critical vs non-critical errors

### Test Checklist

- [ ] Pre-flight validation catches Drive access issues
- [ ] Format errors show precise line/column information
- [ ] Permission errors show file IDs and sharing links
- [ ] API errors distinguish between network, timeout, and server issues
- [ ] Error dialog displays all error categories correctly
- [ ] CSV download works and contains all error details
- [ ] Fallback icons are used when specified
- [ ] Error summary is accurate
- [ ] Import errors are tracked and reported
- [ ] Multiple errors for same icon are aggregated
- [ ] Errors don't prevent successful icons from being processed
- [ ] Console logs provide sufficient debugging information

---

## Estimated Effort for Remaining Work

- **Phase 5** (Import errors): 2-3 hours
- **Phase 6** (Error dialog): 3-4 hours
- **Phase 7** (Pre-flight): 1-2 hours
- **Phase 8** (Integration/testing): 3-4 hours

**Total**: 9-13 hours

---

## Key Design Decisions

1. **Non-blocking errors**: Icon processing continues even when some icons fail, using fallback icons
2. **Detailed context**: Every error includes actionable suggestions and relevant context
3. **Categorization**: Errors grouped by type for easier understanding
4. **CSV export**: Full error details available for offline analysis
5. **Pre-flight validation**: Catches critical issues before time-consuming processing
6. **Progressive enhancement**: Error system doesn't break existing functionality

---

## Benefits

- **User Experience**: Clear, actionable error messages instead of silent failures
- **Debugging**: Comprehensive context for troubleshooting
- **Reliability**: Pre-flight validation prevents wasted processing time
- **Transparency**: Users see exactly what succeeded and what failed
- **Professionalism**: Detailed error reporting demonstrates quality and attention to detail
