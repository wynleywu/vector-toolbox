# Vector Toolbox

> **A modular, extensible, and resident JSX script toolbox for Adobe Illustrator.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Adobe%20Illustrator-2020--2026%2B-ff7c00.svg)](https://www.adobe.com/products/illustrator.html)
[![Language](https://img.shields.io/badge/Script-ExtendScript%20%2F%20JSX-yellow.svg)](docs/ARCHITECTURE.md)

English | [简体中文](README_CN.md)

---

## 💡 Overview

**Vector Toolbox** is an open-source productivity toolbox designed for Adobe Illustrator designers and developers.

Unlike traditional monolithic scripts, Vector Toolbox acts as a **resident floating launcher shell (ScriptUI Palette)** that decouples the main management UI from individual sub-tools. Every tool is maintained as an independent, testable JSX script that can either be run directly or invoked through the unified toolbox interface.

```text
┌──────────────────────────────────────────────┐
│  Vector Toolbox                              │
├──────────────────────────────────────────────┤
│  [ 宽高标注 ]                                │
│  [ 生成页码 ]                                │
│  [ 转曲并备份 ]                              │
│  [ 栅格参考线 ]                              │
│  [ 统一尺寸 ]                                │
│  [ 导出 PDF ]                                │
├──────────────────────────────────────────────┤
│  就绪                                        │
│  [ 刷新 ]        [ 更新 ]        [ 关于 ]    │
└──────────────────────────────────────────────┘
```

---

## ✨ Features

- 🪟 **Persistent Floating Palette**: Stays open while you work on your canvas without blocking Illustrator.
- ⚡ **Instant Search & Category Filtering**: Search across tool names, categories, and custom keywords in real time.
- 🕒 **Recent Tools & Fast Launch**: Automatically remembers your recently used tools for single-click repeat actions.
- 🚀 **1-Click Auto-Updates**: In-app GitHub update checker and 1-click sync engine for effortless future version iterations.
- ⚡ **One-Click Cross-Platform Installers**: Automated batch/shell and in-app JSX installers for instant setup.
- 🧩 **Zero-Coupling Architecture**: Every tool is an independent `.jsx` file. Adding a new tool requires no changes to the core UI logic.
- 🔄 **Live Hot-Reloading**: Edit any script or add new tools to `config/tools.jsx`, then click **Refresh** (↻) to load changes immediately without restarting Illustrator.
- 🛡️ **Non-Blocking Status Bar**: Live feedback and error trapping displayed in the status bar instead of disruptive `alert()` modal loops.

---

## 🛠️ Built-in Tools Matrix (6 Core Tools)

Scripts for retired tools stay under `scripts/` and can be re-registered in `config/tools.jsx`.

| Category | Tool | Script Path | Mode | Description |
|---|---|---|---|---|
| **Annotation** | **Dimension** | `scripts/annotation/dimension.jsx` | `palette` | Annotate width & height on objects/artboards with mm, cm, pt, px, in units |
| **Annotation** | **Page Number** | `scripts/annotation/page-number.jsx` | `dialog` | Preset/custom formats, font, four-corner placement, and in-dialog clear |
| **Typography** | **Outline & Backup** | `scripts/text/outline-and-backup.jsx` | `dialog` | Outline selected or all visible text, with a hidden backup layer |
| **Guides** | **Grid Guides** | `scripts/guide/grid-guides.jsx` | `palette` | GuideGuide-style columns/rows, independent margins, outline, midlines, and clear |
| **Object** | **Normalize Size** | `scripts/object/normalize-size.jsx` | `dialog` | Resize selected objects to uniform width, height, or bounding box |
| **Export** | **Export PDF** | `scripts/export/export-pdf.jsx` | `dialog` | Defaults to one multi-page PDF; optional date/time suffix with several formats |

---

## 🚀 Quick Start & Installation

### Option 1: Automated One-Click Installers (Recommended)

- **Windows**: Download `Vector-Toolbox-Setup.exe` from [Releases](https://github.com/wynleywu/vector-toolbox/releases), double-click it, and approve the administrator prompt. No extraction is required.
- **macOS**: Download `Vector-Toolbox.zip`, extract it, and run `bash install-macos.sh` in Terminal.
- **In-App JSX**: In Adobe Illustrator, press `Ctrl+F12` / `Cmd+F12` and run `Install-VectorToolbox.jsx`.

The installer copies the complete application into a stable per-user directory before creating launcher proxies for detected Illustrator installations. You may delete the downloaded and extracted files after installation. Restart Illustrator, then launch **File** > **Scripts** > **Vector-Toolbox**.

The Windows EXE is currently unsigned. If Microsoft Defender SmartScreen appears, verify that the file came from this repository's official Release, then choose **More info** > **Run anyway**.

- **Windows install directory**: `%APPDATA%\VectorToolbox`
- **macOS install directory**: `~/Library/Application Support/VectorToolbox`

### Option 2: Run Directly

1. In Adobe Illustrator, go to **File** > **Scripts** > **Other Script...** (`Ctrl + F12` on Windows, `Cmd + F12` on macOS).
2. Select `Vector-Toolbox.jsx`.

---

## 📂 Project Structure

```text
vector-toolbox/
├── Vector-Toolbox.jsx           # Main ScriptUI Shell & resident launcher
├── Install-VectorToolbox.jsx    # In-App one-click installer
├── install-windows.bat          # Windows one-click automated installer
├── install-macos.sh             # macOS one-click automated installer
├── tools/
│   ├── build-windows-installer.ps1 # Build the Windows self-extracting EXE
│   ├── build-release.ps1        # Build the Release assets and checksums
│   └── publish-release.ps1      # Verify the tag and publish a Release with assets
├── core/
│   ├── utils.jsx                # Units conversion, DOM helpers, JSON serializer
│   ├── storage.jsx              # Local user persistence (recents, favorites, config)
│   ├── registry.jsx             # Tool registry, metadata validation, search indexing
│   ├── bridge.jsx               # BridgeTalk wrapper and IPC evaluation
│   └── launcher.jsx             # Mode-aware runner (action, dialog, palette)
├── config/
│   └── tools.jsx                # Tool manifest & configuration
├── scripts/                     # Standalone JSX tool implementations
│   ├── annotation/              # Dimension, page numbering, cleaners
│   ├── color/                   # Palette extraction, color replacer
│   ├── text/                    # Outline & backup, batch text replacer
│   ├── guide/                   # Layout grid guides
│   ├── object/                  # Close paths, batch rename, normalize, cleanup, scatter
│   ├── artboard/                # Grid rearrangement, artboard renaming
│   └── export/                  # Layer export, artboard export, quick PNG
├── docs/
│   ├── ARCHITECTURE.md          # In-depth architectural documentation
│   ├── TOOL_DEVELOPMENT_GUIDE.md# Guide for contributing new JSX tools
│   └── CHANGELOG.md             # Release history
├── LICENSE                      # MIT License
└── README.md                    # Project documentation
```

### Publishing an installable release

Update `version.json` and the application version, then create and push a matching tag on the verified commit. Run `powershell -File tools/build-release.ps1` to generate the Windows EXE, cross-platform ZIP, version manifest, and SHA-256 checksums in `dist/`. Run `powershell -File tools/publish-release.ps1` to validate the clean worktree and tag, then create a GitHub Release containing all assets.

---

## 🧩 Adding Your Own Tools

Adding a new tool takes just two simple steps:

1. **Create your JSX script** in `scripts/<category>/your-tool.jsx`.
2. **Register it in `config/tools.jsx`**:

```javascript
{
    id: "my-custom-tool",
    name: "My Custom Tool",
    category: "Object",
    script: "scripts/object/my-custom-tool.jsx",
    mode: "action", // "action" | "dialog" | "palette"
    keywords: ["custom", "helper", "quick"],
    description: "Performs custom vector operations in 1-click."
}
```

3. Click **↻ Refresh** in Vector Toolbox. Your new tool appears immediately!

For step-by-step tool documentation and tutorials, see [Detailed User Guide (中文详细使用指南)](docs/USER_GUIDE_CN.md).
See [Tool Development Guide](docs/TOOL_DEVELOPMENT_GUIDE.md) for contributing new tools.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
