# Context Documentation

This directory contains **essential reference documentation** that preserves knowledge about system constraints and proven optimization patterns.

## Purpose

Context files document:
- 🚫 **Limitations**: What the system cannot do (architectural constraints)
- ⚡ **Patterns**: Proven optimization approaches for similar problems
- 🧠 **Gotchas**: Important considerations for future work

**Note**: Implementation details live in code, commits, and JSDoc comments. Context files focus on **why** and **constraints**, not **how**.

---

## Files in This Context

### System Limitations
**[PNG_SPRITE_LIMITATIONS.md](./PNG_SPRITE_LIMITATIONS.md)**
- Documents PNG sprite parsing limitations in Google Apps Script
- Explains why PNG sprites can't be parsed (no image manipulation APIs)
- Describes supported alternatives (individual PNG files, SVG sprites)
- **Use when**: Planning icon handling features or debugging import issues

### Optimization Patterns
**[PERFORMANCE_FIX_SUMMARY.md](./PERFORMANCE_FIX_SUMMARY.md)**
- Documents file indexing optimization: O(n×m) → O(n+m)
- Explains batching pattern for file operations
- Shows problem-solving approach with before/after comparison
- **Use when**: Optimizing file operations or similar search patterns

---

## Active Documentation

For current work and active features:
- **[PROGRESS.md](../PROGRESS.md)** - Overall project status and index
- **[FIX_PROGRESS.md](../FIX_PROGRESS.md)** - Translation processing improvements
- **[IMPORT_CAT.md](../IMPORT_CAT.md)** - Import feature testing
- **[CAT_GEN.md](../CAT_GEN.md)** - Category generation process
- **[COMAPEOCAT_FORMAT.md](../COMAPEOCAT_FORMAT.md)** - File format specification

---

## For AI Assistants

**When to reference context files:**

1. **Icon-related work** → Check PNG_SPRITE_LIMITATIONS.md first
   - Understand what's technically feasible
   - Avoid re-implementing impossible features

2. **File operation optimization** → Reference PERFORMANCE_FIX_SUMMARY.md
   - Apply proven indexing pattern
   - Avoid N×M complexity anti-patterns

3. **General development** → Check git history and code comments
   - Implementation details are in the code
   - Context files only for constraints and patterns

---

**Last Updated**: 2025-10-11
**Cleanup**: Removed 6 redundant implementation summaries; kept only essential references
