# Performance Comparison Guide

**Created**: 2025-11-04
**Purpose**: Guide for comparing performance metrics to baseline
**Task**: Task 6 - Performance comparison framework
**Status**: Complete

---

## Overview

This guide explains how to use the performance comparison framework to monitor and detect performance regressions in the CoMapeo Category Set Spreadsheet Plugin. The framework enables developers to:

- Compare current performance to baseline metrics
- Detect performance regressions automatically
- Track performance trends over time
- Make informed decisions about optimizations

---

## Quick Start

### Running a Performance Comparison

1. **Via Menu**
   - Open `CoMapeo Tools` → `Test Runner` (run tests first)
   - Check console logs for performance data
   - Compare to baseline using `Generate Performance Report`

2. **Via Script**
   ```javascript
   // In Apps Script editor
   compareToBaseline();
   ```

3. **Full Comparison**
   ```javascript
   // Run all tests and generate comparison report
   captureAndDocumentBaselineMetrics();
   generatePerformanceReport();
   ```

---

## Understanding Performance Metrics

### Key Metrics

#### 1. Test Suite Duration
Time taken to execute individual test suites:
- **Language Recognition**: ~200-300ms
- **Language Recognition Integration**: ~300-500ms
- **Utils Slugify**: ~100-200ms
- **Format Detection**: ~200-400ms
- **Field Extraction**: ~300-600ms
- **Extract and Validate**: ~400-800ms
- **Details and Icons**: ~500-1000ms
- **Translation Extraction**: ~400-700ms
- **Import Category**: ~1000-2000ms
- **Zip to API**: ~2000-5000ms
- **End-to-End**: ~3000-8000ms
- **Skip Translation**: ~500-1000ms
- **Debug Logger**: ~100-200ms

#### 2. Total Duration
Sum of all test suite durations plus overhead:
- **Target**: < 20 seconds
- **Warning**: > 25 seconds
- **Critical**: > 30 seconds

#### 3. Dataset Benchmarks
Performance with different data sizes:

**Small Dataset (5-10 categories)**
- Export: < 3 seconds
- Import: < 5 seconds

**Medium Dataset (25-30 categories)**
- Export: < 10 seconds
- Import: < 15 seconds

**Large Dataset (50+ categories)**
- Export: < 30 seconds
- Import: < 45 seconds

---

## Performance Thresholds

### Performance Change Classification

#### ✅ Acceptable (No Action Required)
- **Change**: ±10% from baseline
- **Color**: Green
- **Action**: None
- **Monitoring**: Periodic checks

#### ⚠️ Warning (Monitor Closely)
- **Change**: 10-25% increase from baseline
- **Color**: Yellow
- **Action**:
  - Run tests 2-3 more times to confirm
  - Check recent code changes
  - Investigate potential causes
  - Document observations

#### 🚨 Critical (Investigate Immediately)
- **Change**: >25% increase from baseline
- **Color**: Red
- **Action**:
  - Stop deployment
  - Identify the cause immediately
  - Review recent commits
  - Consider rollback
  - Fix issue before proceeding

#### 🚀 Excellent (Optimization Success)
- **Change**: >10% improvement from baseline
- **Color**: Green (with note)
- **Action**:
  - Document the improvement
  - Update baseline metrics
  - Share optimization techniques
  - Update performance targets

---

## Workflow Integration

### Before Making Code Changes

1. **Capture Current Baseline**
   ```javascript
   // Run this before making changes
   generatePerformanceReport();
   ```

2. **Document Current Performance**
   - Note key metrics in your PR description
   - Include baseline data for comparison
   - Set performance expectations

### During Development

1. **Regular Testing**
   ```javascript
   // Test frequently during development
   runAllTestsQuick(); // Fast feedback

   // Run full suite periodically
   runAllTests();
   ```

2. **Monitor for Regressions**
   - Check console logs for performance data
   - Compare individual test suite durations
   - Note any significant changes

### Before Submitting PR

1. **Final Performance Check**
   ```javascript
   // Run comprehensive comparison
   captureAndDocumentBaselineMetrics();
   generatePerformanceReport();

   // Review performance in logs
   // Check for any degradation >10%
   ```

2. **Performance Documentation**
   Include in PR description:
   ```
   ## Performance Impact
   - Baseline Duration: X ms
   - Current Duration: Y ms
   - Change: Z% (increase/decrease)
   - Status: [✅ Pass/⚠️ Warning/🚨 Critical]
   ```

3. **Performance Review**
   - PR reviewer should check performance data
   - Validate that regressions are justified
   - Ensure optimizations are documented

### After Deployment

1. **Monitor Production Performance**
   ```javascript
   // In production environment
   compareToBaseline();
   ```

2. **Check for Regressions**
   - Monitor logs for performance issues
   - Check user feedback for slow operations
   - Compare production vs. test environment

3. **Update Baseline if Needed**
   ```javascript
   // If performance improved and is stable
   captureAndDocumentBaselineMetrics();
   ```

---

## Automated Performance Alerts

### Script Properties Check

Performance metrics are stored in script properties:

```javascript
// Check current baseline
const props = PropertiesService.getScriptProperties();
const baselineKey = props.getProperty('CURRENT_BASELINE_KEY');
const baseline = JSON.parse(props.getProperty(baselineKey));

console.log('Baseline metrics:', baseline);
```

### Performance Alert Triggers

The system automatically alerts when:

1. **Test Suite Duration > 1000ms**
   - Individual test suite taking too long
   - Indicates potential performance issue

2. **Total Duration > 25 seconds**
   - Overall performance degraded
   - May exceed user patience threshold

3. **Dataset Benchmark > Target**
   - User-facing operations too slow
   - May impact user experience

### Custom Alert Checks

Create custom performance checks:

```javascript
function checkPerformanceAlerts() {
  const metrics = captureBaselineMetrics();

  // Check total duration
  if (metrics.totalDuration > 25000) {
    console.error('CRITICAL: Total duration exceeded threshold');
    return false;
  }

  // Check individual test suites
  metrics.testSuites.forEach(suite => {
    if (suite.duration > 1000) {
      console.warn(`WARNING: ${suite.name} took ${suite.duration}ms`);
    }
  });

  return true;
}
```

---

## Performance Trend Tracking

### Historical Data Storage

Performance metrics are stored with date-based keys:

```javascript
// Get all baseline metrics
const props = PropertiesService.getScriptProperties();
const keys = props.getKeys();

const baselines = keys
  .filter(key => key.startsWith('BASELINE_METRICS_'))
  .map(key => ({
    date: key.split('_')[2],
    data: JSON.parse(props.getProperty(key))
  }));

console.log('Performance history:', baselines);
```

### Trend Analysis

Analyze performance trends over time:

```javascript
function analyzePerformanceTrends() {
  const baselines = getAllBaselineMetrics();

  if (baselines.length < 2) {
    console.log('Need at least 2 baselines for trend analysis');
    return;
  }

  baselines.forEach((baseline, index) => {
    if (index === 0) return; // Skip first baseline (no comparison)

    const previous = baselines[index - 1];
    const change = ((baseline.data.totalDuration - previous.data.totalDuration) / previous.data.totalDuration) * 100;

    console.log(`${baseline.date}: ${change > 0 ? '+' : ''}${change.toFixed(2)}% vs previous`);
  });
}
```

---

## Common Performance Issues

### 1. Slow Spreadsheet Operations

**Symptoms**:
- Field Extraction test suite duration > 1000ms
- Spreadsheet reading operations taking long

**Causes**:
- Large dataset being processed
- Inefficient sheet reading patterns
- Missing caching

**Solutions**:
- Use batch operations where possible
- Implement caching for repeated reads
- Optimize data structures
- Consider reducing data size

### 2. API Call Performance

**Symptoms**:
- Translation Extraction test suite duration > 1000ms
- Zip to API test suite timing out or taking > 5000ms

**Causes**:
- Rate limiting
- Network latency
- Large payload sizes
- Unnecessary API calls

**Solutions**:
- Check API quotas
- Implement exponential backoff
- Batch API requests
- Cache API responses
- Optimize payload sizes

### 3. Memory Usage Issues

**Symptoms**:
- Tests failing with memory errors
- Performance degrading over time

**Causes**:
- Memory leaks in data structures
- Large objects not being garbage collected
- Inefficient algorithms

**Solutions**:
- Clear large objects after use
- Use more efficient data structures
- Profile memory usage
- Implement pagination for large datasets

---

## Optimization Guidelines

### When to Optimize

**Do optimize when**:
- Performance degradation >10% confirmed
- User-facing operations exceed targets
- Memory usage is excessive
- API call patterns are inefficient

**Don't optimize when**:
- Performance is within thresholds
- Impact is minimal (<5% change)
- Optimization adds complexity without benefit
- Premature optimization without measurement

### Optimization Priorities

1. **User-Facing Operations** (High Priority)
   - Export/import workflows
   - Translation operations
   - Icon generation

2. **Background Operations** (Medium Priority)
   - Data validation
   - Cache updates
   - Cleanup operations

3. **Developer Tools** (Low Priority)
   - Test suite execution
   - Debug logging
   - Development utilities

### Performance Optimization Checklist

Before optimizing, verify:
- [ ] Baseline metrics are current
- [ ] Performance issue is reproducible
- [ ] Root cause is identified
- [ ] Optimization won't introduce bugs
- [ ] Improvement is significant (>10%)
- [ ] Code complexity increase is justified
- [ ] Tests will catch regressions
- [ ] Documentation is updated

---

## Best Practices

### Performance Testing

1. **Test in Consistent Environment**
   - Same spreadsheet size
   - Same network conditions
   - Similar time of day
   - Consistent Apps Script environment

2. **Run Multiple Tests**
   - Performance varies between runs
   - Calculate averages for accurate metrics
   - Focus on trends, not single runs

3. **Monitor Over Time**
   - Performance can drift gradually
   - Regular baseline captures catch issues early
   - Historical data helps identify patterns

### Performance Reporting

1. **Include Context**
   - Baseline metrics
   - Current metrics
   - Percentage change
   - Environment details

2. **Be Honest About Regressions**
   - Don't ignore performance issues
   - Document known regressions
   - Plan fixes in future work
   - Don't merge without review

3. **Celebrate Improvements**
   - Share optimization techniques
   - Update baseline metrics
   - Document lessons learned
   - Set new performance targets

---

## Troubleshooting

### Performance Comparison Fails

**Problem**: `compareToBaseline()` throws error

**Solutions**:
1. Run `captureAndDocumentBaselineMetrics()` first
2. Check script properties for baseline data
3. Verify baseline key is set correctly
4. Check logs for specific error messages

### Metrics Don't Make Sense

**Problem**: Performance metrics seem wrong or inconsistent

**Solutions**:
1. Verify test environment is clean
2. Check for other processes running
3. Run tests multiple times
4. Verify spreadsheet size and complexity
5. Check network conditions

### Performance Always Worse

**Problem**: Performance consistently degraded from baseline

**Solutions**:
1. Check if baseline is outdated
2. Verify test conditions are same
3. Review recent code changes
4. Investigate potential regressions
5. Update baseline if conditions changed

### Can't Detect Regressions

**Problem**: Want to catch performance issues but missing them

**Solutions**:
1. Run tests more frequently
2. Lower alert thresholds
3. Add more granular metrics
4. Implement automated checks
5. Set up performance monitoring

---

## Success Criteria

### Framework Completeness

- [x] Baseline metrics capture functional
- [x] Performance comparison working
- [x] Alert thresholds configured
- [x] Trend tracking implemented
- [x] Documentation complete
- [x] Menu integration present
- [x] Script properties storage
- [x] Console logging detailed
- [x] Workflow integration guide
- [x] Troubleshooting documented

### Operational Readiness

- [ ] Developers know how to run comparisons
- [ ] Performance data is included in PRs
- [ ] Performance regressions are caught
- [ ] Baseline is updated when appropriate
- [ ] Performance trends are monitored
- [ ] Optimization work is guided by metrics

---

## Next Steps

1. **Training**
   - Share this guide with development team
   - Demonstrate performance comparison workflow
   - Practice using the framework

2. **Integration**
   - Add performance checks to CI/CD
   - Set up automated performance monitoring
   - Create performance dashboards

3. **Continuous Improvement**
   - Review performance metrics regularly
   - Identify optimization opportunities
   - Update thresholds as needed
   - Refine the framework

---

## References

- **Baseline Metrics**: `context/process/baseline-performance-metrics.md`
- **Regression Strategy**: `context/process/regression-strategy.md`
- **Testing Guide**: `context/process/regression-testing-guide.md`
- **Next Steps**: `context/process/next-steps.md`

---

**Status**: Complete
**Owner**: Development Team
**Reviewer**: Lead Developer

---

**Created**: 2025-11-04
**Last Updated**: 2025-11-04
