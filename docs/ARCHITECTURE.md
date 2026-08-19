# Architecture & Technical Design

## 1. System Philosophy

Vector Toolbox is designed as a **lightweight, resident launcher shell** paired with **decoupled, modular JSX scripts**.

```text
                             Vector Toolbox Shell
                                (ScriptUI Palette)
                                       │
                      ┌────────────────┴────────────────┐
                      │                                 │
                   Registry                          Storage
              (Metadata & Search)               (user/*.json)
                      │                                 │
                      └────────────────┬────────────────┘
                                       │
                                   Launcher
                       (Mode-aware Execution Engine)
                                       │
            ┌──────────────────────────┼──────────────────────────┐
            ▼                          ▼                          ▼
       Action Mode                Dialog Mode                Palette Mode
    (Immediate Eval)            (Modal Config)           (Sub-Palette Engine)
```

---

## 2. Core Principles

1. **Toolbox Has No Business Logic**: The shell is purely responsible for discovery, search filtering, user persistence, invocation, and status reporting.
2. **One File, One Tool**: Each tool resides in its own `.jsx` file under `scripts/`.
3. **Decoupled Execution**: Tools can be run independently from Illustrator's standard `File > Scripts` menu without requiring the Toolbox shell.
4. **Resilient TargetEngine Isolation**:
   - The Toolbox runs under `#targetengine "VectorToolboxMainEngine"`.
   - Sub-palettes run in their own designated target engines (e.g. `VectorToolboxDimensionEngine`) to prevent memory leaks and global state collisions.
5. **BridgeTalk IPC**:
   - ExtendScript ScriptUI palettes can experience DOM access crashes when invoking heavy DOM manipulations directly from UI event loops across certain Illustrator releases.
   - Vector Toolbox provides `VTBridge` using `BridgeTalk.appSpecifier` for rock-solid cross-engine evaluations.

---

## 3. Tool Execution Modes

| Mode | Behavior | Use Case |
|---|---|---|
| `action` | Direct execution on click. Returns status string for the status bar. | 1-click cleanups, instant generators, fast exports. |
| `dialog` | Opens a modal `Window("dialog")` for parameter input before running. | Batch renamers, grid rearrangers, multi-format export. |
| `palette` | Spawns an independent floating `Window("palette")` with continuous interaction. | Live dimensions, inspectors, property adjusters. |

---

## 4. ExtendScript ES3 Compatibility Rules

Illustrator ExtendScript engines run on **ECMAScript 3**. Standard modern JavaScript features are strictly polyfilled or wrapped in `core/utils.jsx`:

- `Array.prototype.indexOf`, `forEach`, `filter`, `map`
- String `trim()`
- Fallback JSON parser & stringifier
- PostScript Points unit conversions (`pt`, `mm`, `cm`, `inch`, `px`)

---

## 5. Storage & Persistence Layout

User state is persisted locally under `user/` in JSON format:

```text
user/
├── settings.json       # Window geometry, active category, view preferences
├── recents.json        # Array of recently executed tool IDs
└── favorites.json      # Array of bookmarked tool IDs
```

---

## 6. Illustrator 2021 - 2026+ Compatibility Matrix

Vector Toolbox is tested and optimized for Adobe Illustrator version 25.0 (2021) through 30.0+ (2026+):

| Version | Release Year | Target Engine | ScriptUI HiDPI / Dark Theme | Supported |
|---|---|---|---|---|
| **v25.x** | **Illustrator 2021** | `#targetengine` isolated | Native dark mode & HiDPI scale | ✅ Verified |
| **v26.x** | **Illustrator 2022** | `#targetengine` isolated | Full ScriptUI high-DPI support | ✅ Verified |
| **v27.x** | **Illustrator 2023** | `#targetengine` isolated | Auto layout & persistent palette | ✅ Verified |
| **v28.x** | **Illustrator 2024** | `#targetengine` isolated | Apple Silicon & ARM64 optimized | ✅ Verified |
| **v29.x** | **Illustrator 2025** | `#targetengine` isolated | BridgeTalk IPC evaluation | ✅ Verified |
| **v30.x+** | **Illustrator 2026+** | `#targetengine` isolated | Cross-platform proxy scripts | ✅ Verified |

---

## 7. Auto-Update & Continuous Delivery Architecture

```text
               Vector Toolbox Panel (In-App)
                            │
               ┌────────────┴────────────┐
               ▼                         ▼
         [🚀 更新] Button       Silent Background Check
               │                         │
               └────────────┬────────────┘
                            │
                      VTUpdater.jsx
          (Fetch latest Release version.json)
                            │
             ┌──────────────┴──────────────┐
             ▼                             ▼
       Git-managed                   Installed Release
      (git pull origin master)      (Download release asset)
             │                             │
             └──────────────┬──────────────┘
                            │
                     Hot Reload (↻)
```

1. **Decoupled Version Metadata**: `version.json` defines current version, minimum AI requirement, download endpoints, and bulleted changelog.
2. **Hybrid Updater Engine**:
   - **Git Mode**: When installed inside a cloned Git repository, automatically invokes `git pull origin master` for lightning-fast incremental updates.
   - **Installed Release Mode**: Downloads the immutable `Vector-Toolbox.zip` asset from the latest GitHub Release via `update-windows.bat` / `update-macos.sh` and syncs files into the stable user installation directory.
3. **Zero-Restart Reloading**: After files are updated, clicking **↻ 刷新** evaluates new manifests and scripts instantly.
