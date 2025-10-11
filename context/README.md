# Context Documentation

This directory contains **essential reference documentation** that preserves knowledge about system architecture, constraints, and proven optimization patterns.

## Purpose

Context files document:
- 🏗️ **Architecture**: High-level system design and data flow
- 🚫 **Limitations**: What the system cannot do (technical constraints)
- ⚡ **Patterns**: Proven optimization approaches for similar problems
- 🧠 **Gotchas**: Important considerations for future work

**Note**: Implementation details live in code, commits, and JSDoc comments. Context files focus on **why** and **constraints**, not **how**.

---

## Files in This Context

### Architecture & System Design

**[ARCHITECTURE.md](./ARCHITECTURE.md)**
- Complete system architecture and workflow documentation
- Data model and type definitions
- 9-stage pipeline for config generation
- File structure and module organization
- External API dependencies
- **Use when**: Understanding overall system design, onboarding new developers, or planning major features

### Feature Documentation

**[CAT_GEN.md](./CAT_GEN.md)**
- Category generation process documentation
- Stage-by-stage analysis of export pipeline
- Debugging strategies and test functions
- Investigation plans and improvement roadmap
- Performance benchmarks
- **Use when**: Working on export functionality or troubleshooting generation issues

**[IMPORT_CAT.md](./IMPORT_CAT.md)**
- Import category feature documentation
- Reverse engineering process for .comapeocat files
- Icon extraction strategies (TAR and ZIP formats)
- Translation structure handling
- Critical issues and fixes
- End-to-end testing documentation
- **Use when**: Working on import functionality or debugging imports

### File Formats & Data Structures

**[COMAPEOCAT_FORMAT.md](./COMAPEOCAT_FORMAT.md)**
- .comapeocat file format specification
- ZIP archive structure (197 files example)
- Icon variants and naming conventions
- Performance considerations for large icon sets
- Import strategy and extraction process
- **Use when**: Understanding or debugging file format issues

**[spreadsheet-format.md](./spreadsheet-format.md)**
- Spreadsheet data structure rules
- Categories and Details sheet structure
- Field types and validation rules
- Translation sheet format
- Data rules and examples
- **Use when**: Validating spreadsheet data or building features that read/write sheets

### User Documentation

**[USER_GUIDE.md](./USER_GUIDE.md)**
- End-user documentation for the spreadsheet plugin
- Creating new configurations
- Exporting and importing workflows
- Translation management
- Data validation and linting
- Troubleshooting common issues
- Best practices
- **Use when**: Understanding user workflows or writing user-facing features

### Technical Constraints & Patterns

**[PNG_SPRITE_LIMITATIONS.md](./PNG_SPRITE_LIMITATIONS.md)**
- PNG sprite parsing limitations in Google Apps Script
- Why PNG sprites can't be parsed (no image manipulation APIs)
- Supported alternatives (individual PNGs, SVG sprites)
- Workarounds and external API solutions
- Console output examples
- Testing recommendations
- **Use when**: Planning icon features or debugging import issues

**[PERFORMANCE_FIX_SUMMARY.md](./PERFORMANCE_FIX_SUMMARY.md)**
- File indexing optimization pattern
- O(n×m) → O(n+m) algorithmic improvement using Map indexing
- Before/after comparison with 19x performance gain
- Progress logging implementation
- Compatibility with TAR and ZIP archives
- **Use when**: Optimizing file operations or similar search patterns

---

## Root Directory Files

**[README.md](../README.md)**
- Project overview and setup instructions
- clasp CLI commands and workflow

**[CLAUDE.md](../CLAUDE.md)**
- AI assistant development reference
- Quick architecture overview
- Development commands and patterns
- Links to all context documentation

---

## For AI Assistants

**When to reference context files:**

1. **System architecture questions** → Check **ARCHITECTURE.md** first
   - Understand overall data flow and processing stages
   - Learn about module organization and responsibilities
   - Reference external dependencies and APIs

2. **Export/generation work** → Reference **CAT_GEN.md**
   - Understand 9-stage pipeline details
   - Debug generation issues
   - Apply performance optimizations

3. **Import/parsing work** → Reference **IMPORT_CAT.md**
   - Understand reverse engineering process
   - Handle different archive formats (TAR/ZIP)
   - Extract icons and translations properly

4. **File format questions** → Check **COMAPEOCAT_FORMAT.md** or **spreadsheet-format.md**
   - Understand .comapeocat ZIP structure
   - Validate spreadsheet data structure
   - Handle icon variants correctly

5. **Icon-related work** → Check **PNG_SPRITE_LIMITATIONS.md** first
   - Understand what's technically feasible
   - Avoid re-implementing impossible features
   - Use supported alternatives (individual PNGs, SVG sprites)

6. **Performance optimization** → Reference **PERFORMANCE_FIX_SUMMARY.md**
   - Apply proven indexing pattern
   - Avoid N×M complexity anti-patterns
   - Implement progress logging

7. **User-facing features** → Check **USER_GUIDE.md**
   - Understand user workflows
   - Learn expected behavior
   - Match existing patterns

8. **General development** → Check git history and code comments
   - Implementation details are in the code
   - Context files only for architecture, constraints, and patterns

---

**Last Updated**: 2025-10-11
**Cleanup**: Reorganized documentation structure; moved completed work to git history
