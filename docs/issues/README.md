# Issues Directory

This directory contains known issues, bugs, and improvement opportunities for the CoMapeo Category Set Spreadsheet Plugin project.

## Issue Priority Levels

Issues are organized by priority to help you focus on the most critical problems first:

### 🔴 [Critical Issues](./critical.md)
**Requires immediate action** - Critical security, reliability, or performance issues that pose significant risks.

- **6 critical issues** identified
- **Total estimated effort**: 10-14 hours
- **Focus areas**: Security vulnerabilities, performance bottlenecks, infinite loops, dead code

### 🟠 [High Priority Issues](./high.md)
**Should be addressed soon** - Important issues that significantly impact usability or maintainability.

- Performance improvements
- Code quality issues
- User experience enhancements

### 🟡 [Medium Priority Issues](./medium.md)
**Nice to have** - Issues that would improve quality or maintainability but are not urgent.

- Code refactoring opportunities
- Documentation improvements
- Minor usability enhancements

### 🟢 [Low Priority Issues](./low.md)
**Future considerations** - Minor issues that can be addressed when convenient.

- Nice-to-have features
- Minor optimizations
- Cosmetic improvements

## How to Use This Directory

### For Developers
1. **Start with Critical Issues** - Address security and reliability problems first
2. **Use the Implementation Priority** - Each critical issue includes a suggested implementation schedule
3. **Check Regression Safety** - Review risk assessment before making changes
4. **Follow Testing Requirements** - All issues include testing requirements to prevent regressions

### For Project Managers
- **Sprint Planning** - Use the effort estimates to plan sprints
- **Risk Assessment** - Review risk levels before prioritizing work
- **Progress Tracking** - Check off issues as they're completed

### For Code Reviewers
- **Review Impact** - Each issue documents the expected impact
- **Verify Fixes** - Ensure fixes meet the requirements specified
- **Check Testing** - Verify testing requirements are met

## Adding New Issues

When adding new issues:

1. **Choose appropriate priority level** based on impact:
   - **Critical**: Security, reliability, performance issues
   - **High**: Usability, maintainability, significant bugs
   - **Medium**: Code quality, minor improvements
   - **Low**: Nice-to-have, cosmetic

2. **Include required sections**:
   - File location
   - Priority level
   - Estimated effort
   - Impact description
   - Implementation steps
   - Testing requirements
   - Regression safety assessment
   - Status tracking

3. **Use descriptive titles** with emoji for visual clarity

## Issue Template

```markdown
## 🔴 Issue Title

**File**: `path/to/file.ts:line`
**Priority**: CRITICAL|HIGH|MEDIUM|LOW - Category
**Effort**: X-Y hours
**Dependencies**: None or list dependencies

### Issue
Clear description of the problem.

### Impact
What happens if this isn't fixed?

### Solution
How to fix this issue.

### Implementation Steps
1. Step one
2. Step two
3. Step three

### Testing Requirements
- [ ] Test requirement one
- [ ] Test requirement two

### Regression Safety
Risk assessment and mitigation strategies.

**Status**: ⬜ Not Started | 🟡 In Progress | ✅ Completed
```

## See Also

- **[Architecture Documentation](../reference/architecture.md)** - System design and data flow
- **[Implementation Guides](../implementation/)** - Sprint plans and technical details
- **[Process Documentation](../process/)** - Development workflows and standards
- **[Regression Prevention Strategy](../process/regression-strategy.md)** - How to prevent issues from recurring
