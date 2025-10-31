---
owner: Luandro
last-reviewed: 2025-10-31
review-cadence: quarterly
---

# Regression Prevention Strategy

**PRIMARY RULE**: The system currently works fine. **DO NOT BREAK IT.**

---

## Safety-First Approach

### 1. Test BEFORE Changing Production Code

- Create test spreadsheets for all scenarios
- Test with real data from current production usage
- Verify edge cases that are currently working
- Document current behavior as baseline

### 2. Implement with Feature Flags

```typescript
// Example: Gradual caching rollout
const USE_CACHING = PropertiesService.getScriptProperties()
  .getProperty('ENABLE_CACHE') === 'true';

function getAllLanguages(): Record<string, string> {
  if (USE_CACHING) {
    return getAllLanguagesCached(); // New code
  }
  return getAllLanguagesOriginal(); // Keep original working code
}
```

### 3. Maintain Parallel Code Paths

- Keep original working code
- Add new optimized code alongside
- Switch via configuration
- Remove old code only after 100% confidence (1-2 weeks minimum)

### 4. Comprehensive Testing Requirements

**REQUIRED before ANY deployment**:

#### Unit Tests
- [ ] New functions tested in isolation
- [ ] Edge cases covered
- [ ] Error handling verified

#### Integration Tests
- [ ] Modified flows tested end-to-end
- [ ] Cross-module interactions verified
- [ ] External API integrations tested

#### End-to-End Tests
- [ ] Full export flow (scratch → .comapeocat)
- [ ] Full import flow (.comapeocat → spreadsheet)
- [ ] Translation workflows
- [ ] Icon generation
- [ ] All field types and geometries

#### Performance Tests
- [ ] Before/after metrics documented
- [ ] No degradation in critical paths
- [ ] Memory usage acceptable
- [ ] API call count reasonable

#### Edge Case Tests
- [ ] Empty data
- [ ] Large data (100+ categories)
- [ ] Malformed data
- [ ] Network failures
- [ ] API timeouts
- [ ] Drive quota issues

#### Regression Tests
- [ ] All currently working scenarios still work
- [ ] No new bugs introduced
- [ ] User workflows unchanged

### 5. Rollout Phases

**Phase 1: Test Spreadsheet**
- Deploy to dedicated test spreadsheet only
- Full testing by developer
- Duration: 1-2 days

**Phase 2: Beta Testers**
- Deploy to 1-2 trusted users
- Collect feedback
- Monitor for issues
- Duration: 3-5 days

**Phase 3: Monitoring**
- Monitor logs and user reports
- Quick response to issues
- Duration: 1 week

**Phase 4: Gradual Rollout**
- 25% of users → 50% → 100%
- Each stage: 2-3 days
- Roll back if issues detected

**Emergency Rollback Capability**
- Single-command revert ready
- Rollback tested before deployment
- < 5 minutes to execute

---

## Fix-Specific Safety Protocols

### CRITICAL-001: HTTPS API Endpoint ⚠️ HIGH RISK

**Risk**: API endpoint change could break all exports

**Mitigation**:
- Test HTTPS endpoint independently BEFORE changing code
- Keep HTTP as fallback for 1 month (feature flag)
- Add comprehensive error handling
- Test with large files (edge case: timeout differences)
- Monitor error rates closely for first week

**Rollback**: Feature flag to immediately revert to HTTP

---

### CRITICAL-002: Delete Dead Code ✅ LOW RISK

**Risk**: Minimal (code is unused)

**Mitigation**:
- Archive file, don't delete permanently
- Verify zero usage with multiple grep patterns
- Keep in git history for easy restoration
- Double-check no reflection or dynamic loading

**Rollback**: Restore from docs/archived/ in < 1 minute

---

### CRITICAL-003: Caching Layer ⚠️ MEDIUM RISK

**Risk**: Stale data, cache invalidation bugs

**Mitigation**:
- Start with OPTIONAL caching (feature flag)
- Add cache validity indicators (console logs)
- Test cache invalidation thoroughly
- Monitor for stale data issues in production
- Add cache debug mode for troubleshooting

**Test Scenarios**:
- Cache hit/miss logging
- Cache expiration working
- Cache invalidation on data changes
- No stale translations
- No stale language list

**Rollback**: Feature flag disables caching immediately

---

### CRITICAL-004: Infinite Loop ✅ LOW RISK

**Risk**: Minimal (bug fix improves reliability)

**Mitigation**:
- Keep existing behavior for successful cases
- Add logging for retry attempts
- Test with various preset configurations
- Monitor icon generation success rates

**Rollback**: Simple revert, no dependencies

---

### CRITICAL-005: XSS Vulnerabilities ⚠️ MEDIUM RISK

**Risk**: HTML escaping might break existing formatting

**Mitigation**:
- Test all dialogs after changes
- Ensure no double-escaping
- Verify proper rendering of special characters
- Keep user experience identical
- Test with real spreadsheet content

**Test Cases**:
- Normal text (no escaping needed)
- HTML special characters in user input
- Script tags in spreadsheet data
- Malicious language data
- All dialog types (success, error, progress, language selection)

**Rollback**: Revert escaping function, quick fix

---

### CRITICAL-006: Duplicate Code ✅ LOW RISK

**Risk**: Minimal (simple deduplication)

**Mitigation**:
- Verify exact same implementation
- Apps Script global scope works automatically
- Test all import/export functionality
- Quick rollback if issues found

**Rollback**: Add function back, < 5 minutes

---

### HIGH Priority Fixes ⚠️ MEDIUM RISK

**General Mitigation for Refactoring**:
- Create helpers FIRST, test independently
- Refactor ONE function at a time
- Verify behavior identical before/after
- Keep original functions for 1 release
- Side-by-side comparison tests

---

## Testing Checklist

### Regression Test Suite

**REQUIRED before ANY deployment**:

#### Export Flow Tests
- [ ] Create new config from scratch
- [ ] Create config with all field types (text, number, select-one, select-multiple)
- [ ] Create config with multiple languages (5+)
- [ ] Create config with 50+ categories (stress test)
- [ ] Create config with complex field options
- [ ] Create config with all geometry types

#### Import Flow Tests
- [ ] Import existing .comapeocat file
- [ ] Import .mapeosettings file (legacy format)
- [ ] Import with 189 icons (performance test)
- [ ] Import with missing optional data
- [ ] Import with all data types

#### Translation Flow Tests
- [ ] Auto-translate to 5 languages
- [ ] Handle translation failures gracefully
- [ ] Skip translation option works
- [ ] Custom languages preserved

#### Icon Flow Tests
- [ ] Generate icons for 20 categories
- [ ] Handle icon API failures
- [ ] Drive icon references work
- [ ] Cell image icons work

#### Edge Case Tests
- [ ] Empty spreadsheet
- [ ] Missing required sheets
- [ ] Invalid data in cells
- [ ] Network failures during operations
- [ ] Drive quota exceeded
- [ ] API timeout (wait full timeout period)
- [ ] Very long text values
- [ ] Special characters in all fields

#### Performance Tests
- [ ] Large dataset (100+ categories, 50+ fields)
- [ ] Multiple simultaneous users (if applicable)
- [ ] Repeated operations (memory leaks)

---

## Performance Benchmarks

### Measure BEFORE and AFTER Every Change

#### Speed Metrics
- [ ] Time to load language list
- [ ] Time to read spreadsheet data:
  - Small: 10 rows
  - Medium: 50 rows
  - Large: 100 rows
- [ ] Time to generate config:
  - Small: 5 categories
  - Medium: 25 categories
  - Large: 50+ categories
- [ ] Time to import config (same sizes)

#### Resource Metrics
- [ ] Memory usage during operations
- [ ] API call count:
  - GitHub API calls
  - Google Translate API calls
  - External icon API calls
  - Drive API calls

#### Acceptance Criteria
- **No degradation** in any metric
- Or **documented improvement** with justification
- Or **acceptable trade-off** with user benefit

---

## Deployment Checklist

### Before EVERY Deployment

- [ ] **All regression tests pass** (100% required)
- [ ] **Performance benchmarks show improvement OR no degradation**
- [ ] Code review completed by 2+ developers (or thorough self-review)
- [ ] Documentation updated (including rollback steps)
- [ ] Changelog updated with:
  - Changes made
  - Risk assessment
  - Rollback procedure
- [ ] Security scan completed (no new vulnerabilities)
- [ ] **Backup of current working version created**
- [ ] **Rollback plan tested** (can revert in <5 minutes)
- [ ] Monitoring alerts configured for new code paths
- [ ] Feature flags configured (if applicable)
- [ ] Beta testers identified and notified (if applicable)

### During Deployment

- [ ] Deploy during low-usage period (if possible)
- [ ] Monitor logs in real-time
- [ ] Keep rollback command ready
- [ ] Test immediately after deployment

### After Deployment

- [ ] Verify all functionality works in production
- [ ] Monitor for 24-48 hours
- [ ] Check error logs
- [ ] Collect user feedback
- [ ] Document any issues found
- [ ] Update deployment notes

---

## Emergency Rollback Procedure

### If a deployment breaks functionality:

#### 1. Immediate Action (< 5 minutes)

```bash
# Option A: Revert last commit
git revert HEAD
npm run push

# Option B: Restore from backup
clasp push --version <previous_working_version>

# Option C: Toggle feature flag
# In Apps Script Script Properties:
# Set ENABLE_NEW_FEATURE = "false"
```

#### 2. Notify Users (< 15 minutes)

- Add banner to spreadsheet (if possible)
- Email active users about temporary issues
- Provide ETA for fix
- Apologize for inconvenience

#### 3. Root Cause Analysis (1-2 hours)

- Reproduce issue in test environment
- Identify what broke
- Determine scope of impact
- Document findings

#### 4. Fix or Permanent Revert

**If fixable quickly (<1 hour)**:
- Fix in test environment
- Test thoroughly
- Deploy fix
- Monitor closely

**If complex**:
- Full revert to stable version
- Fix in development environment
- Complete full testing cycle
- Re-deploy with extra caution

#### 5. Post-Mortem (within 1 week)

- Document what went wrong
- Identify gaps in testing
- Update testing procedures
- Improve deployment process
- Share learnings with team

---

## Success Criteria

### For Each Fix

- [ ] **Functionality maintained**: All existing features work identically
- [ ] **No new bugs**: Thorough testing found no issues
- [ ] **Performance**: No degradation, or documented improvement
- [ ] **User experience**: Unchanged or improved
- [ ] **Documentation**: Complete and accurate
- [ ] **Rollback ready**: Tested and < 5 minutes to execute

### For Overall Project

- [ ] **6 Critical issues resolved**
- [ ] **All regression tests passing**
- [ ] **Performance improved 30-50%** (from caching)
- [ ] **Security hardened** (HTTPS, XSS fixed, path traversal protected)
- [ ] **Code quality improved** (duplication removed, documentation added)
- [ ] **Zero production incidents** from changes
- [ ] **User satisfaction maintained or improved**

---

## Key Principles

1. **Test First**: Never change production code before testing
2. **Deploy Small**: Small changes easier to test and rollback
3. **Monitor Always**: Watch logs and metrics after every change
4. **Rollback Fast**: < 5 minutes to revert any change
5. **Learn Continuously**: Post-mortems for every incident
6. **Document Everything**: Changes, risks, rollback procedures
7. **User First**: Stability and reliability over new features

---

**Remember**: Working code is more valuable than perfect code. Don't break what works in pursuit of improvements.

---

## Quick Reference

**Pre-Deployment**: [Deployment Checklist](#deployment-checklist)
**Post-Deployment**: Monitor 24-48h, check logs, verify functionality
**Emergency**: [Rollback Procedure](#emergency-rollback-procedure)
**Testing**: [Regression Test Suite](#regression-test-suite)
**Performance**: [Benchmarks](#performance-benchmarks)

---

**See Also**:
- [Critical Issues](issues/critical.md) - Know what you're fixing
- [Implementation Sprints](../implementation/) - Planned approach
- [Progress log](../historical/progress.md) - Full context
