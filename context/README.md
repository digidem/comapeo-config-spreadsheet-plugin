# Context Documentation

This directory contains **contextual documentation** for understanding completed work and architectural decisions in the CoMapeo Config Spreadsheet Plugin.

## Purpose

These files provide context for:
1. ✅ Completed implementation work and rationale
2. 🔍 Historical decisions and trade-offs
3. 📚 Reference material for related features
4. 🐛 Troubleshooting guides for specific issues

## Why Keep Context Files?

- **AI Assistant Context**: Helps Claude Code understand project history and decisions
- **Implementation Details**: Documents "why" behind architectural choices
- **Problem Solving**: Reference for similar issues in the future
- **Onboarding**: Helps new developers understand project evolution
- **Knowledge Preservation**: Maintains institutional knowledge

## Files in This Context

### Icon Handling Improvements
- **ICON_IMPORT_FIX.md** - TAR extraction enhancement and PNG icon extractor implementation
- **ICON_PARSING_FIX.md** - XML namespace fix and SVG element extraction improvements
- **SVG_PRIORITY_CHANGE.md** - Change to prioritize SVG over PNG in icon extraction

### Performance Optimizations
- **PERFORMANCE_FIX_SUMMARY.md** - File indexing optimization reducing complexity from O(n×m) to O(n+m)

### UX/UI Enhancements
- **PROGRESS_UX_IMPLEMENTATION.md** - Real-time progress bar implementation
- **UX_IMPROVEMENT_PLAN.md** - Original planning document for progress UX

### Analysis & Reviews
- **COMAPEO_CATEGORY_GENERATION_REVIEW.md** - Code review that led to translation processing improvements
- **PNG_SPRITE_LIMITATIONS.md** - Documentation of known PNG sprite parsing limitations in Apps Script

## Active Documentation

For current project status and active work, see:
- [PROGRESS.md](../PROGRESS.md) - Overall project status and documentation index
- [FIX_PROGRESS.md](../FIX_PROGRESS.md) - Active translation processing improvements
- [IMPORT_CAT.md](../IMPORT_CAT.md) - Import feature with testing checklist

## Accessing Context Information

All implementation details from these documents are also available in:
1. **Git commit history** - Commit messages reference these documents
2. **Source code** - Implementation is in the actual code
3. **Code comments** - JSDoc and inline comments explain behavior

To find related commits:
```bash
git log --all --grep="icon\|translation\|import\|performance\|UX"
```

## For AI Assistants

When working on related features, these context files provide:
- **Implementation patterns** used successfully
- **Gotchas and pitfalls** to avoid
- **Performance considerations** for similar operations
- **Integration points** with existing systems

Prefer reading these files when:
- Debugging icon import/export issues
- Optimizing file operations
- Implementing progress indicators
- Reviewing translation processing changes

---

**Created**: 2025-10-11
**Purpose**: Context preservation for AI-assisted development and team knowledge sharing
