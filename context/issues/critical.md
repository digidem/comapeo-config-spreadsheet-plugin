# Critical Issues

**6 Critical Issues Requiring Immediate Action**

These issues pose significant security, reliability, or performance risks and should be addressed as soon as possible.

---

## 🔴 CRITICAL #1: HTTP API Endpoint (Security) - BLOCKED

**File**: `src/apiService.ts:39`
**Priority**: CRITICAL - Security
**Effort**: N/A - Cannot implement until upstream is ready
**Dependencies**: **REQUIRES** upstream API server to support HTTPS

### 🚨 Current Status: NOT APPLICABLE / BLOCKED

**❌ CANNOT IMPLEMENT HTTPS** - Upstream API server does not support HTTPS

The upstream API endpoint `http://137.184.153.36:3000/` **does not support SSL/TLS**. Attempting to force HTTPS connections will result in:
- Connection failures
- **Complete breakdown of the export functionality**
- App becomes unusable for all users

**⚠️ CRITICAL**: The app **WILL BREAK** if we try to implement HTTPS before the upstream server is ready.

### Current Implementation
```typescript
const apiUrl = "http://137.184.153.36:3000/";
```

### Why This Issue Exists
1. **Server Limitation**: The upstream API server at `137.184.153.36:3000` does not have SSL configured
2. **No Domain**: Server is accessed by IP address directly, not a domain with SSL certificate
3. **Breaking Change**: Switching to HTTPS would make all API calls fail

### Impact (While Using HTTP)
- All configuration files transmitted **without encryption**
- Man-in-the-middle attacks possible
- Data interception risk
- Violation of security best practices
- **However**: App currently **works reliably**

### Next Steps - What Needs to Happen

#### Phase 1: Upstream Server Upgrades (Required BEFORE we can act)
**Owner**: Infrastructure/DevOps team
**Timeline**: Unknown - depends on upstream provider

1. **Configure SSL/TLS on upstream server**:
   - Set up SSL certificate for domain or IP
   - Configure HTTPS listener on port 443
   - Test SSL certificate validity

2. **Migration Options**:
   ```
   Option A (RECOMMENDED): Move to domain with SSL
   - Domain: https://api.comapeo.app/process
   - Full SSL/TLS support
   - Professional setup with Let's Encrypt

   Option B (NOT RECOMMENDED): SSL on IP
   - https://137.184.153.36:3000
   - Self-signed certificates may cause issues
   - Not ideal for production
   ```

3. **Verify HTTPS works**:
   - Test with curl: `curl -v https://api.comapeo.app/process`
   - Verify SSL certificate chain
   - Confirm API responses over HTTPS

#### Phase 2: Code Updates (Can only happen AFTER Phase 1)
**Owner**: Development team
**Effort**: 1-2 hours
**Dependencies**: Phase 1 must be complete

1. **Update API URL**:
   ```typescript
   const apiUrl = "https://api.comapeo.app/process";
   ```

2. **Add configuration management**:
   - Move URL to ScriptProperties
   - Add environment-specific URLs
   - Add fallback handling

3. **Test thoroughly**:
   - [ ] Test successful file upload via HTTPS
   - [ ] Verify SSL certificate validation
   - [ ] Test error handling for SSL failures
   - [ ] Verify no performance regression

### Immediate Actions Required

1. **Contact upstream API provider** to request HTTPS support
2. **Track upstream progress** on SSL/TLS implementation
3. **Prepare code changes** (ready to deploy once server is ready)
4. **Monitor upstream roadmap** for HTTPS timeline

### What NOT to Do

❌ **DO NOT** attempt to implement HTTPS in code while server only supports HTTP
❌ **DO NOT** use workarounds or unofficial SSL proxies
❌ **DO NOT** ignore this issue hoping it will resolve itself

### Regression Safety
⚠️ **HIGH RISK** - Cannot test until upstream is ready

**When server is ready**:
- Test HTTPS endpoint independently BEFORE changing code
- Have rollback plan ready (switch back to HTTP if issues)
- Add comprehensive error handling
- Test with various file sizes

### Related Documentation
- [High Priority Issues](high.md) - See HIGH-009 for API configuration management
- [Regression Prevention Strategy](../process/regression-strategy.md)
- [Production Hardening Summary](../historical/production-hardening-2025-10-28.md)

**Status**: 🚫 **BLOCKED** - Waiting for upstream API server to support HTTPS
**Last Reviewed**: 2025-11-01

---

## 🔴 CRITICAL #2: Dead Code - Entire Error Handling Module (Technical Debt)

**File**: `src/errorHandling.ts` (508 lines)
**Priority**: CRITICAL - Technical Debt
**Effort**: 30 minutes
**Dependencies**: None

### Issue
Comprehensive transaction system with backup/restore **completely unused**

- **508 lines of code** for transaction system, backup/restore, error handling
- **ZERO references** outside of `errorHandling.ts` itself
- `startImportTransaction`, `commitImportTransaction`, `rollbackImportTransaction` - **NEVER CALLED**
- Comprehensive `ImportError`, `ImportResult`, `ImportTransaction` types - **NEVER USED**
- Sophisticated backup/restore system - **NEVER INVOKED**

### Impact
- Code maintenance burden
- Confusion for developers
- False sense of safety
- Technical debt accumulation

### Decision Required
1. **Option A (RECOMMENDED)**: DELETE this entire file
   - Reduces codebase by 508 lines
   - Eliminates confusion about unused infrastructure
   - Can be restored from git history if truly needed later

2. **Option B**: INTEGRATE the transaction system into import/export flows
   - Significant refactoring required
   - Wrap all operations in transactions
   - Add rollback capability to all mutating operations

3. **Option C**: Keep for future use
   - NOT recommended - dead code rots
   - Continues to confuse developers
   - No clear benefit

### Implementation Steps (Option A - Recommended)

1. **Verify zero usage** (double-check):
   ```bash
   grep -r "startImportTransaction\|commitImportTransaction\|rollbackImportTransaction" src/
   grep -r "ImportError\|ImportResult\|ImportTransaction" src/
   ```

2. **Create backup**:
   ```bash
   git mv src/errorHandling.ts context/archived/errorHandling.ts.backup
   git commit -m "Archive unused errorHandling.ts module"
   ```

3. **Delete file**:
   ```bash
   rm src/errorHandling.ts
   ```

4. **Update documentation**:
  - Add note to `context/reference/architecture.md` about removal
   - Document rationale: "Removed 508-line unused transaction system. Current error handling is adequate for use case. Can be restored from git history if needed."

### Testing Requirements
- [ ] Verify build succeeds
- [ ] Run all test functions
- [ ] Test import/export flows
- [ ] Verify no runtime errors

### Regression Safety
✅ **LOW RISK** - Code is unused

**Mitigation**:
- Archive file, don't delete permanently
- Verify zero usage with multiple grep patterns
- Keep in git history for easy restoration

**Status**: ⬜ Not Started

---

## 🔴 CRITICAL #3: No Caching - Performance Issue

**File**: `src/spreadsheetData.ts`
**Priority**: CRITICAL - Performance
**Effort**: 4-6 hours
**Dependencies**: None

### Issue
Multiple performance problems from lack of caching:

- `getAllLanguages()` fetches from GitHub **every time** (15 calls across 7 files)
- A1 cell accessed repeatedly without caching
- `getActiveSpreadsheet()` called 61 times across 26 files

### Impact
- Slow performance
- Unnecessary network calls
- API quota waste
- Poor user experience

### Implementation Steps

1. **Create cache module** (`src/cache.ts`):
   ```typescript
   // Simple in-memory cache for Apps Script session
   class SessionCache {
     private static cache: Map<string, any> = new Map();

     static get<T>(key: string): T | undefined {
       return this.cache.get(key);
     }

     static set<T>(key: string, value: T, ttlMs?: number): void {
       this.cache.set(key, value);
       if (ttlMs) {
         setTimeout(() => this.cache.delete(key), ttlMs);
       }
     }

     static clear(): void {
       this.cache.clear();
     }
   }
   ```

2. **Update `getAllLanguages()`**:
   ```typescript
   function getAllLanguages(): Record<string, string> {
     // Check cache first
     const cached = SessionCache.get<Record<string, string>>('allLanguages');
     if (cached) return cached;

     try {
       const languagesUrl = "https://...";
       const response = UrlFetchApp.fetch(languagesUrl);
       const languagesData = JSON.parse(response.getContentText());
       // ... existing logic ...

       // Cache for 1 hour
       SessionCache.set('allLanguages', allLanguages, 3600000);
       return allLanguages;
     } catch (error) {
       // ... fallback logic ...
     }
   }
   ```

3. **Create spreadsheet accessor helper**:
   ```typescript
   function getActiveSpreadsheetCached() {
     const cached = SessionCache.get('activeSpreadsheet');
     if (cached) return cached;

     const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
     SessionCache.set('activeSpreadsheet', spreadsheet);
     return spreadsheet;
   }

   function getPrimaryLanguageCached(): { code: string; name: string } {
     const cached = SessionCache.get('primaryLanguage');
     if (cached) return cached;

     const result = getPrimaryLanguage(); // existing function
     SessionCache.set('primaryLanguage', result);
     return result;
   }
   ```

4. **Update all references**:
   - Global find/replace with validation
   - Test each module after update

5. **Add cache invalidation**:
   - Clear cache on sheet data changes
   - Clear cache on A1 cell edit

### Testing Requirements
- [ ] Measure before/after performance (time all operations)
- [ ] Verify cache hits vs misses (console logging)
- [ ] Test cache invalidation on sheet changes
- [ ] Verify no stale data issues

### Expected Impact
- Reduce GitHub API calls from 15 → 1 per session
- Reduce spreadsheet access calls from 61 → ~5 per session
- Estimated 30-50% performance improvement

### Regression Safety
⚠️ **MEDIUM RISK** - Stale data, cache invalidation bugs

**Mitigation**:
- Start with OPTIONAL caching (feature flag)
- Add cache validity indicators (console logs)
- Test cache invalidation thoroughly
- Monitor for stale data issues in production

**Status**: ⬜ Not Started

---

## 🔴 CRITICAL #4: Infinite Loop in Icon Generation (Reliability)

**File**: `src/generateIcons/iconProcessor.ts:246-249`
**Priority**: CRITICAL - Reliability
**Effort**: 30 minutes
**Dependencies**: None

### Issue
Infinite while loop with no break condition or max retry limit

```typescript
// CRITICAL BUG - Infinite loop if search never succeeds!
while (!searchData) {
  console.log(`Retrying search for ${preset.name}`);
  searchData = findValidSearchData(searchParams);
}
```

### Impact
- Script will hang forever if icon search fails
- Consumes quota and blocks execution
- Script timeout (6 minutes)
- Quota exhaustion
- Poor user experience

### Solution
Add max retry counter or timeout to prevent infinite loop

```typescript
// FIX: Add max retries
const MAX_ICON_SEARCH_RETRIES = 3;
let retryCount = 0;

while (!searchData && retryCount < MAX_ICON_SEARCH_RETRIES) {
  console.log(`Retrying search for ${preset.name} (attempt ${retryCount + 1}/${MAX_ICON_SEARCH_RETRIES})`);
  searchData = findValidSearchData(searchParams);
  retryCount++;
}

if (!searchData) {
  console.warn(`Failed to find icon data for ${preset.name} after ${MAX_ICON_SEARCH_RETRIES} attempts`);
  // Return fallback or empty string
  return getFallbackIcon(preset.name);
}
```

### Testing Requirements
- [ ] Test with successful icon search
- [ ] Test with failed icon search (max retries)
- [ ] Verify fallback behavior
- [ ] Test timeout doesn't break other operations

### Regression Safety
✅ **LOW RISK** - Bug fix, improves reliability

**Mitigation**:
- Keep existing behavior for successful cases
- Add logging for retry attempts
- Test with various preset configurations

**Status**: ⬜ Not Started

---

## 🔴 CRITICAL #5: XSS and Code Injection Vulnerabilities (Security)

**File**: `src/dialog.ts`
**Priority**: CRITICAL - Security
**Effort**: 2-3 hours
**Dependencies**: None

### Issue
Multiple injection vulnerabilities in HTML dialog generation:

1. **No HTML escaping** for user-provided content: `${title}`, `${message}`, `${buttonText}` (lines 124-126)
2. **Direct code injection** via `buttonFunction` parameter injected into onclick (line 148)
3. **No input sanitization** for language selection dialog user input (lines 280-330)

### Impact
- Malicious content in spreadsheet could execute arbitrary JavaScript in user's browser
- Compromised language data could inject malicious scripts
- User sessions could be hijacked via XSS attacks
- High risk: User data exposure, session hijacking, malicious code execution

### Solution

1. **Add HTML escaping function**:
   ```typescript
   /**
    * Escapes HTML special characters to prevent XSS attacks
    */
   function escapeHtml(text: string): string {
     if (!text) return '';
     return text
       .replace(/&/g, '&amp;')
       .replace(/</g, '&lt;')
       .replace(/>/g, '&gt;')
       .replace(/"/g, '&quot;')
       .replace(/'/g, '&#039;');
   }
   ```

2. **Update all dialog generation**:
   ```typescript
   function generateDialog(params: DialogParams): string {
     const safeTitle = escapeHtml(params.title);
     const safeMessage = Array.isArray(params.message)
       ? params.message.map(escapeHtml)
       : [escapeHtml(params.message)];
     const safeButtonText = escapeHtml(params.buttonText || 'OK');

     // ... rest of template with safe values ...
   }
   ```

3. **Use HtmlTemplate instead of string concatenation**:
   ```typescript
   const template = HtmlService.createTemplateFromFile('dialog-template');
   template.title = params.title;  // Auto-escapes in template
   template.message = params.message;
   return template.evaluate();
   ```

4. **Sanitize buttonFunction or use safer callback**:
   ```typescript
   // Instead of direct injection:
   // onclick="${buttonFunction}()"

   // Use predefined safe callbacks:
   const SAFE_CALLBACKS = {
     'closeDialog': 'google.script.host.close',
     'refreshDialog': 'location.reload',
     // ... other safe callbacks
   };

   const safeCallback = SAFE_CALLBACKS[params.buttonFunction] || SAFE_CALLBACKS['closeDialog'];
   ```

### Testing Requirements
- [ ] Test with normal content (no escaping needed)
- [ ] Test with HTML characters in user input
- [ ] Test with script tags in spreadsheet data
- [ ] Test with malicious language data
- [ ] Verify all dialogs render correctly after escaping

### Additional Actions
- Add Content Security Policy headers
- Validate all user input before use
- Review all template string usage
- Consider using HtmlTemplate for all dialogs

### Regression Safety
⚠️ **MEDIUM RISK** - HTML escaping might break existing formatting

**Mitigation**:
- Test all dialogs after changes
- Ensure no double-escaping
- Verify proper rendering of special characters
- Keep user experience identical

**Status**: ⬜ Not Started

---

## 🔴 CRITICAL #6: Duplicate Code - slugify() Function (Maintainability)

**Files**: `src/utils.ts` and `src/importCategory/utils.ts`
**Priority**: CRITICAL - Technical Debt
**Effort**: 30 minutes
**Dependencies**: None

### Issue
`slugify()` function duplicated in two locations

- Same implementation exists in both files
- Changes must be made in two places
- Increases maintenance burden
- Risk of diverging implementations

### Impact
- Code maintenance burden
- Potential for bugs if one copy is updated but not the other
- Violates DRY principle
- Confuses developers about which version to use

### Solution

1. **Remove duplicate from importCategory/utils.ts**:
   ```typescript
   // Remove the entire slugify function from src/importCategory/utils.ts
   ```

2. **Import from utils.ts** (if needed):
   ```typescript
   // Note: Apps Script uses global scope, so no import needed
   // Just reference the global slugify() function
   ```

3. **Verify all usages work**:
   - Test import functionality
   - Test export functionality
   - Verify no breaking changes

### Testing Requirements
- [ ] Run all import tests
- [ ] Run all export tests
- [ ] Verify slugify behavior unchanged
- [ ] Test with special characters

### Regression Safety
✅ **LOW RISK** - Simple deduplication

**Mitigation**:
- Verify exact same implementation before removal
- Test all uses of slugify()
- Keep backup for quick rollback

**Status**: ⬜ Not Started

---

## Summary Table

| # | Issue | File | Effort | Risk | Status |
|---|-------|------|--------|------|--------|
| 1 | HTTP API Endpoint | apiService.ts:39 | N/A | High | 🚫 BLOCKED (upstream) |
| 2 | Dead Code | errorHandling.ts | 30min | Low | ✅ COMPLETED |
| 3 | No Caching | spreadsheetData.ts | 4-6h | Medium | ✅ COMPLETED |
| 4 | Infinite Loop | iconProcessor.ts:246 | 30min | Low | ✅ COMPLETED |
| 5 | XSS Vulnerabilities | dialog.ts | 2-3h | Medium | ✅ COMPLETED |
| 6 | Duplicate Code | utils.ts, importCategory/utils.ts | 30min | Low | ✅ COMPLETED |

**Total Estimated Effort**: ~8 hours (5 issues completed)
**Remaining**: 1 blocked issue (requires upstream action)

---

## Implementation Priority

**✅ COMPLETED - All Feasible Critical Issues**

All critical issues have been resolved except HTTPS, which is **BLOCKED by upstream infrastructure**:

### Completed (5/6 issues)
1. **FIX-004 (Infinite Loop)** - 30min, Low Risk ✅
2. **FIX-002 (Dead Code)** - 30min, Low Risk ✅
3. **FIX-006 (Duplicate Code)** - 30min, Low Risk ✅
4. **FIX-005 (XSS)** - 2-3h, Medium Risk ✅
5. **FIX-003 (Caching)** - 4-6h, Medium Risk ✅

### Blocked (1/6 issues)
6. **FIX-001 (HTTPS)** - 🚫 **BLOCKED**
   - **Cannot proceed** until upstream API server supports HTTPS
   - Implementation requires **zero effort** from our side
   - **Waiting on**: Infrastructure/DevOps team
   - **Next action**: Contact upstream API provider

### What's Next
1. **Monitor upstream API provider** for HTTPS support timeline
2. **Prepare code changes** (simple URL update once server is ready)
3. **Proceed to HIGH priority issues** - all critical issues are now addressed
4. **Document the limitation** in production deployment notes

---

**See also**:
- [High Priority Issues](high.md)
- [Implementation Plan - Sprint 1](../implementation/sprint-01-critical.md)
- [Regression Prevention Strategy](../regression-strategy.md)
