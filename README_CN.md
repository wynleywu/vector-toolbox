# Vector Toolbox (矢量工具箱)

> **一个模块化、可扩展、常驻运行的 Adobe Illustrator JSX 脚本工具箱。**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Adobe%20Illustrator-2020--2026%2B-ff7c00.svg)](https://www.adobe.com/products/illustrator.html)
[![Language](https://img.shields.io/badge/Script-ExtendScript%20%2F%20JSX-yellow.svg)](docs/ARCHITECTURE.md)

[English](README.md) | 简体中文

---

## 💡 项目定位

**Vector Toolbox** 是面向 Adobe Illustrator 设计师与开发者的开源常驻脚本工具箱。

传统 JSX 脚本往往存在“找不到脚本、窗口用完即关、代码高度耦合、新增工具繁琐”的问题。Vector Toolbox 采用 **ScriptUI Palette 常驻窗口 + 独立 JSX 脚本 + 配置驱动** 架构：

- **Toolbox 仅作为启动器**：负责集中管理、分类检索、最近使用记录与调度启动；
- **子工具独立维护**：每个工具都是一个标准且可独立运行的 JSX 文件；
- **热重载无需重启**：新增或修改脚本后点击刷新即可即时生效；
- **非阻塞状态提示**：执行反馈与异常捕获统一呈现在底部状态栏，告别弹窗打断。

```text
启动 Vector Toolbox
       ↓
常驻浮动窗口 (ScriptUI Palette)
       ↓
实时搜索 / 分类查找工具
       ↓
点击工具 (Action / Dialog / Palette)
       ↓
调用独立 JSX 脚本并执行
       ↓
反馈状态至底部状态栏
       ↓
Toolbox 继续常驻，即用即走
```

---

## ✨ 核心特性

- 🪟 **常驻浮动面板**：采用 `#targetengine`，在画布操作时不遮挡、不阻塞 Illustrator。
- 🔍 **即时拼音/中英搜索**：支持对工具名称、所属分类、自定义标签关键词进行毫秒级实时过滤。
- 🕒 **最近使用历史**：自动持久化记录用户高频使用的工具，位于面板顶层，支持一键复用。
- 🚀 **一键自动更新 (Auto-Update)**：内置 GitHub 自动更新检测与一键同步引擎，后续版本迭代无缝升级。
- ⚡ **一键跨平台安装**：内置自动化安装脚本（Windows / macOS / In-App JSX），告别手动寻找 Scripts 目录。
- 🧩 **零耦合扩展机制**：新增工具仅需两步（编写独立 JSX + 在配置中注册），主面板零改动。
- 🔄 **实时热刷新 (Live Refresh)**：无需重启 Illustrator，点击底部「↻ 刷新」即可重新加载配置。
- 🛡️ **安全错误边界**：统一拦截运行异常并在状态栏显示友好提示。

---

## 🛠️ 内置工具清单 (6 款核心工具)

下架工具的脚本仍保留在 `scripts/`，需要时在 `config/tools.jsx` 重新注册即可。

| 分类 | 工具名称 | 脚本路径 | 运行模式 | 说明 |
|---|---|---|---|---|
| **标注** | **宽高标注** | `scripts/annotation/dimension.jsx` | `palette` | 支持选中对象/画板的宽、高多向标注，可选 mm/cm/pt/px/in 单位与精度 |
| **标注** | **生成页码** | `scripts/annotation/page-number.jsx` | `dialog` | 预设/自定义格式、字体、四角位置，对话框内可清除页码 |
| **文本** | **转曲并备份** | `scripts/text/outline-and-backup.jsx` | `dialog` | 可选选区或全文转曲，备份到隐藏图层且不重复备份 |
| **参考线** | **栅格参考线** | `scripts/guide/grid-guides.jsx` | `palette` | 按 GuideGuide 方式生成行列栅格、四边、中线，支持画板或选区 |
| **对象** | **统一尺寸** | `scripts/object/normalize-size.jsx` | `dialog` | 按宽度、高度或最大边等比/自由缩放批量统一选区对象尺寸 |
| **导出** | **导出 PDF** | `scripts/export/export-pdf.jsx` | `dialog` | 使用 Illustrator PDF 预设，支持抽样估算大小、多页/拆分及可编辑/转曲版 |

---

## 🚀 快速开始与一键安装

### 推荐方式：一键安装程序 (推荐)

- **Windows 用户**：从 [Releases](https://github.com/wynleywu/vector-toolbox/releases) 下载 `Vector-Toolbox-Setup.exe`，双击并允许管理员权限，无需解压；
- **macOS 用户**：下载并解压 `Vector-Toolbox.zip`，打开终端运行 `bash install-macos.sh`；
- **AI 内部运行**：打开 Illustrator，使用 `Ctrl+F12` / `Cmd+F12` 运行 `Install-VectorToolbox.jsx`。

安装程序会先把完整程序复制到稳定的用户目录，再为已安装的 Illustrator 创建启动代理。安装完成后可以删除下载和解压目录。完全退出并重启 Illustrator，即可在 **文件 (File)** -> **脚本 (Scripts)** -> **Vector-Toolbox** 中启动。

Windows EXE 当前尚未进行代码签名。如果 Microsoft Defender SmartScreen 弹出，请先确认文件来自本仓库的官方 Release，再点击 **更多信息** -> **仍要运行**。

- **Windows 安装目录**：`%APPDATA%\VectorToolbox`
- **macOS 安装目录**：`~/Library/Application Support/VectorToolbox`

### 手动安装方式

如不运行安装器，可通过 **文件 -> 脚本 -> 其他脚本** 直接选择解压目录中的 `Vector-Toolbox.jsx`。这种方式不会创建固定安装目录或菜单入口。启动代理目录为：

- **Windows**: `C:\Program Files\Adobe\Adobe Illustrator <版本号>\Presets\<语言>\<本地化脚本目录>\Vector-Toolbox.jsx`
- **macOS**: `/Applications/Adobe Illustrator <版本号>/Presets.localized/<语言>/Scripts/Vector-Toolbox.jsx`

---

## 📂 项目结构规范

```text
vector-toolbox/
├── Vector-Toolbox.jsx           # 主入口 / ScriptUI 常驻启动器
├── Install-VectorToolbox.jsx    # Illustrator 内置一键安装器
├── install-windows.bat          # Windows 一键自动安装脚本
├── install-macos.sh             # macOS 一键自动安装脚本
├── tools/
│   ├── build-windows-installer.ps1 # 生成 Windows 单文件安装程序
│   ├── build-release.ps1        # 生成 Release 资产与校验文件
│   └── publish-release.ps1      # 校验标签并发布带安装资产的 Release
├── core/                        # 核心通用框架
│   ├── utils.jsx                # ES3 polyfill、单位换算、DOM 助手、JSON 编解码
│   ├── storage.jsx              # 本地用户配置持久化（最近使用、偏好设置）
│   ├── registry.jsx             # 工具注册中心、元数据校验、多维度搜索索引
│   ├── bridge.jsx               # BridgeTalk 消息通信与安全执行封装
│   └── launcher.jsx             # 模式执行引擎 (action, dialog, palette)
├── config/
│   └── tools.jsx                # 工具注册清单配置文件
├── scripts/                     # 独立 JSX 工具实现
│   ├── annotation/              # 标注类工具 (宽高标注, 页码, 清除)
│   ├── color/                   # 色彩类工具 (色卡提取, 同色替换)
│   ├── text/                    # 文本类工具 (转曲备份, 批量替换)
│   ├── guide/                   # 参考线类工具 (栅格参考线)
│   ├── object/                  # 对象操作类工具 (闭合路径, 重命名, 统一尺寸, 清理, 随机)
│   ├── artboard/                # 画板类工具 (重排, 重命名, 选区画板)
│   └── export/                  # 导出类工具 (图层导出, 画板导出, 快速导出PNG)
├── docs/
│   ├── ARCHITECTURE.md          # 详细架构设计文档与设计决策
│   ├── TOOL_DEVELOPMENT_GUIDE.md# 新工具开发指引与规范
│   └── CHANGELOG.md             # 版本迭代记录
├── LICENSE                      # MIT 开源协议
└── README.md                    # 英文说明文档
```

### 发布可安装版本

维护者先更新 `version.json` 与应用版本，再在已验证提交上创建同版本标签。运行 `powershell -File tools/build-release.ps1` 可在 `dist/` 生成 Windows EXE、跨平台 ZIP、版本清单和 SHA-256 校验文件；运行 `powershell -File tools/publish-release.ps1` 会校验工作区、标签和远端标签，并创建包含这些资产的 GitHub Release。

---

## 🧩 如何新增你的自定义工具

1. 在 `scripts/<分类>/` 下新建一个独立 JSX 脚本（如 `scripts/object/my-tool.jsx`）；
2. 在 `config/tools.jsx` 中添加一条注册信息：

```javascript
{
    id: "my-tool",
    name: "我的工具",
    category: "对象",
    script: "scripts/object/my-tool.jsx",
    mode: "action", // "action" (即点即跑) | "dialog" (弹窗设置) | "palette" (常驻面板)
    keywords: ["自定义", "处理", "便捷"],
    description: "执行自定义矢量处理动作"
}
```

3. 在 Vector Toolbox 主面板点击 **↻ 刷新**，新工具立即出现在列表中！

详细开发指引参见 [Tool Development Guide](docs/TOOL_DEVELOPMENT_GUIDE.md)。
详细使用指南与各工具参数详解参见 [Vector Toolbox 完整使用指南](docs/USER_GUIDE_CN.md)。

---

## 📄 开源协议

本项目采用 [MIT License](LICENSE) 开源许可。
