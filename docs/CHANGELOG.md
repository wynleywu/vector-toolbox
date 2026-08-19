# Changelog

All notable changes to the **Vector Toolbox** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

---

## [1.3.1] - 2026-08-19

### Fixed
- Load the About dialog and update comparison version from the installed `version.json`.
- Reject release builds that hardcode a semantic version in `VTUpdater.CURRENT_VERSION`.

---

## [1.3.0] - 2026-08-19

### Added
- On-demand PDF size estimates based on up to three representative artboards.
- Actual total PDF size in the export completion status.

### Changed
- Export PDF quality choices now come from the active Illustrator PDF preset list.

### Fixed
- Apply the selected PDF preset consistently to Export for Screens and `PDFSaveOptions` paths.

---

## [1.2.2] - 2026-08-19

### Added
- Single-file `Vector-Toolbox-Setup.exe` installer for Windows releases.
- SHA-256 checksum for the Windows installer executable.

### Changed
- Windows users can install directly from the EXE without extracting the ZIP.
- Release builds and publishing now include both the EXE and cross-platform ZIP.

---

## [1.2.1] - 2026-08-19

### Added
- Deterministic `Vector-Toolbox.zip` Release packaging with a version manifest and SHA-256 checksum.
- Guarded publishing script that requires a clean worktree and matching pushed tag.

### Changed
- All installers copy the application into a stable per-user directory before creating Illustrator launcher proxies.
- Update checks and standalone updates use the latest GitHub Release assets instead of mutable `master` files.

### Fixed
- Release scripts read UTF-8 version metadata correctly in Windows PowerShell 5.1.

---

## [1.2.0] - 2026-08-18

Complete release of the resident 6-tool toolbox.

### Added
- Export PDF dialog: merge or split, print/screen quality, live and outlined variants, optional date/time filename with three formats (`20260818`, `2026-08-18`, `20260818_1430`).
- Page Number: preset/custom formats, font, four-corner placement, and in-dialog clear.
- Grid Guides: GuideGuide-style columns/rows, independent margins, outline, and midlines.
- Dimension: in-panel clear, replace previous marks, color/stroke, and remembered last options.
- Outline & Backup: selection or document scope with a confirm dialog.
- Normalize Size: selection stats, target sources, and anchor points.

### Changed
- Launcher layout: category chips, full-width tool rows, live hint, last-used marker, and window resize. Search box removed from the panel.
- Default panel slimmed to 6 tools. Retired tools remain on disk and can be re-registered.
- Smart Export replaced by the PDF-only dialog. Default output is one multi-page PDF.

### Fixed
- Tool launch no longer uses `$.evalFile`. Scripts are read as UTF-8, `#target` directives are stripped, palettes stay in the resident engine, and dialog/action tools run via BridgeTalk.
- BridgeTalk no longer mangles backslashes in script source (percent-encoded body), so Export PDF and other tools start instead of dying on a syntax error.
- Dimension / Grid Guides palette BridgeTalk bodies are percent-encoded too.
- `#target` stripping no longer re-emits the directive uncommented.
- Export PDF copies the saved file on disk instead of calling non-existent `Document.duplicate()`.
- Root path fallback no longer hardcodes a stale local folder; installer proxies set `VECTOR_TOOLBOX_ROOT`.

---

## [1.1.0] - 2026-08-18

### Changed
- Redesign the launcher layout: category chips, full-width tool rows, live hint, last-used marker, and window resize. Search box removed from the panel.
- Slim the default panel to 6 tools: Dimension, Page Number, Outline & Backup, Grid Guides, Normalize Size, Export PDF. Retired tools remain on disk and can be re-registered.
- Replace Smart Export with a PDF-only dialog; filenames always include today's date.
- Outline & Backup is now a confirm dialog with selection/document scope.
- Normalize Size shows selection stats, target sources, and anchor points.
- Dimension can replace previous marks, pick color/stroke, and remember last options.
- PDF export warns on unsaved documents, offers print/screen quality, and can open the output folder.
- Harden the 8 default tools: four-side dimensioning with artboard fallback, page-number replace/tokens, safer outline/guides/normalize, and smart export without ES3 `indexOf` or leaving the working file as PDF.

### Fixed
- **Tool launch from the resident palette**: stop executing tools with `$.evalFile`. UTF-8 BOM scripts were throwing conversion errors, and leftover `#target` / `#targetengine` directives made dialogs and actions inert inside the persistent engine. The launcher now reads JSX as UTF-8, strips those directives, keeps palettes in the resident engine, and runs dialog/action tools via BridgeTalk.
- **Root path fallback**: remove the stale `D:/vibe coding/vector-toolbox` hardcode. The shell now prefers `$.global.VECTOR_TOOLBOX_ROOT` from the installer proxy, then `$.fileName`, then a folder picker.
- **Installer proxies**: write `VECTOR_TOOLBOX_ROOT` and `#targetengine "VectorToolboxMainEngine"` so menu launch still finds the project after the host `$.fileName` is the proxy file.

### Added (Ecosystem Expansion & One-Click Distribution)

#### New Tool Categories & Scripts
- **Color (色彩)**:
  - `palette-extractor.jsx`: Extract unique fill/stroke colors from selection and generate swatch cards with hex/color value labels on canvas.
  - `replace-color.jsx`: Global search and replace for specific colors across selection or entire document.
- **Typography (文本)**:
  - `outline-and-backup.jsx`: Prepress essential tool that safely backs up original editable text layers to a hidden layer and creates outlines for all visible text.
  - `batch-text-replace.jsx`: Batch search and replace text frame contents across selection or entire document with case sensitivity option.
- **Guides (参考线)**:
  - `grid-guides.jsx`: Multi-column and row layout grid guides generator with custom margins and gutter spacing.
- **Object (对象)**:
  - `close-paths.jsx`: 1-click automatic inspection and closing of all open vector path segments.
- **Export (导出)**:
  - `export-layers.jsx`: Batch export visible top-level layers as independent transparent PNG or SVG assets.

#### One-Click Distribution & Installer Suite
- **In-App JSX Installer**: `Install-VectorToolbox.jsx` for direct in-Illustrator installation.
- **Windows Automated Installer**: `install-windows.bat` for automatic scanning of Illustrator versions and creating script proxies.
- **macOS Automated Installer**: `install-macos.sh` for automatic scanning of `/Applications/Adobe Illustrator *`.

---

## [1.0.0] - 2026-08-18

### Initial Release (MVP & Full Production Base)

#### Core Architecture
- **ScriptUI Floating Palette**: Lightweight, persistent floating launcher shell (`Vector-Toolbox.jsx`).
- **TargetEngine Isolation**: Safe execution under `#targetengine "VectorToolboxMainEngine"`.
- **Dynamic Module Loader**: Decoupled core modules for storage, registry, launcher, bridge, and utils.
- **BridgeTalk Support**: Safe IPC and cross-engine script evaluation (`core/bridge.jsx`).
- **User Storage & Persistence**: Local JSON-based caching for recent tools and user settings (`core/storage.jsx`).
- **Search & Filter Engine**: Real-time multi-keyword search across names, categories, and tags (`core/registry.jsx`).
- **Hot Reloading**: In-app 1-click refresh without needing to restart Adobe Illustrator.

#### Built-in Tools
- **Annotation**:
  - `dimension.jsx`: Width & height dimensioning with multiple unit systems (mm, cm, pt, px, in).
  - `page-number.jsx`: Customizable batch page numbering across all artboards.
  - `clear-annotations.jsx`: 1-click cleanup of annotation and page numbering layers.
- **Object**:
  - `batch-rename.jsx`: Batch rename selected objects with prefixes, suffixes, and counter patterns.
  - `normalize-size.jsx`: Batch unify widths, heights, or bounding boxes.
  - `cleanup-objects.jsx`: 1-click removal of hidden items, empty text frames, and unpainted paths.
  - `random-arrange.jsx`: Scatter tools with random rotation, scaling, and position jitter.
- **Artboard**:
  - `arrange-artboards.jsx`: Grid-based automatic artboard reorganization.
  - `rename-artboards.jsx`: Batch renaming of all artboards in a document.
  - `create-from-selection.jsx`: 1-click artboard generation fitted to selected items.
- **Export**:
  - `batch-export.jsx`: Batch export artboards to PNG-24, SVG, or PDF.
  - `quick-export-png.jsx`: 1-click 300 DPI high-res PNG export of active artboard.

#### Documentation
- English & Chinese READMEs (`README.md`, `README_CN.md`).
- System Architecture Design (`docs/ARCHITECTURE.md`).
- Tool Development Guide (`docs/TOOL_DEVELOPMENT_GUIDE.md`).
- Open Source MIT License (`LICENSE`).
