# Sprint 2: Code Quality & DRY

**Duration**: Week 2
**Focus**: Improve code maintainability and reduce duplication

---

## Sprint Goals

1. Extract hardcoded data to external files
2. Create DRY helper functions
3. Add cleanup logic for reliability

---

## Sprint Backlog

### HIGH-001: Extract Language Fallback Data

**File**: `src/spreadsheetData.ts` (lines 17-142)
**Effort**: 1-2 hours

#### Tasks
- [ ] Create `src/data/languages-fallback.json` or const
- [ ] Update `getAllLanguages()` to use external data
- [ ] Test network success and failure paths
- [ ] Deploy

**Risk**: ⚠️ MEDIUM - Fallback might not match exactly

---

### HIGH-002: Create DRY Helper Functions

**File**: `src/spreadsheetData.ts`
**Effort**: 2-3 hours
**Dependencies**: Caching (Sprint 1)

#### Tasks
- [ ] Create `getPrimaryLanguageName()` helper
- [ ] Create `filterLanguagesByPrimary()` helper
- [ ] Refactor all uses of repeated patterns
- [ ] Test each refactored function
- [ ] Deploy

**Risk**: ⚠️ MEDIUM - Refactoring might change behavior

---

### HIGH-005: Add Cleanup Logic

**File**: `src/generateCoMapeoConfig.ts`
**Effort**: 2-3 hours

#### Tasks
- [ ] Add resource tracking (folder IDs)
- [ ] Implement cleanup in catch block
- [ ] Create `cleanupDriveFolder()` helper
- [ ] Test cleanup on various failure points
- [ ] Deploy

**Risk**: ✅ LOW - Only adds cleanup, doesn't change generation

---

### HIGH-009: Externalize API URL

**File**: `src/apiService.ts`
**Effort**: 1 hour
**Dependencies**: HTTPS (Sprint 1)

#### Tasks
- [ ] Move URL to ScriptProperties
- [ ] Add configuration helper
- [ ] Add fallback for development
- [ ] Deploy

**Risk**: ✅ LOW - Simple configuration change

---

## Testing Requirements

- [ ] All regression tests from Sprint 1
- [ ] Test with missing/invalid configurations
- [ ] Test cleanup on API failures
- [ ] Verify no behavior changes from refactoring

---

**See Also**:
- [HIGH Priority Issues](../issues/HIGH.md)
- [Sprint 1](sprint-1-critical.md)
- [Sprint 3](sprint-3-security.md)
