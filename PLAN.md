Summary: 为 Windows 增加可双击运行的 `Vector-Toolbox-Setup.exe`。安装器静默解压后复用现有 `install-windows.bat`，用户只需确认一次管理员权限。

Context: 当前 Release 只提供 ZIP，用户必须解压并手动运行批处理。IExpress 实际构建连续失败两次，已停止该路径。Windows 11 环境已确认存在 .NET Framework 4.8 C# 编译器，仓库没有 Inno Setup、NSIS 或代码签名工具。现有批处理已负责自提升、复制到 `%APPDATA%\VectorToolbox`、扫描 Illustrator 和写入启动代理。

System Impact: `Vector-Toolbox.zip` 继续作为发布内容的唯一来源；EXE 只是该 ZIP 的自解压启动壳。安装目录、更新地址和 Illustrator 菜单代理逻辑不新增第二份状态。发布生命周期增加 EXE 构建、校验和上传步骤。

Approach: 使用 Windows 自带的 .NET Framework 4.8 C# 编译器生成单文件 WinForms EXE，将 `Vector-Toolbox.zip` 作为程序集资源嵌入。EXE 通过管理员清单请求权限，解压 ZIP 后隐藏调用已有安装器，并显示成功或失败对话框。首版不引入第三方构建依赖，也不包含代码签名；SmartScreen 可能显示“未知发布者”。

Changes:
- `tools/build-windows-installer.ps1` - 生成 C# 启动器与管理员清单，嵌入 ZIP 并编译、校验 `Vector-Toolbox-Setup.exe`。
- `tools/build-release.ps1` - 在 ZIP 成功后构建 EXE，并生成两个资产各自的 SHA-256。
- `tools/publish-release.ps1` - 将 EXE 与校验文件加入 GitHub Release 资产。
- `version.json`、`docs/CHANGELOG.md` - 升级到 `1.2.2` 并记录 Windows 单文件安装器。
- `README.md`、`README_CN.md`、`docs/USER_GUIDE_CN.md` - Windows 首选 EXE，ZIP 保留为跨平台与手动安装备选。

Verification:
- 在 Windows PowerShell 5.1 执行发布构建，检查 EXE、ZIP、版本清单和 SHA-256。
- 检查 EXE 为有效 .NET PE 文件，并从程序集资源回读完整 ZIP 载荷。
- 用临时 Illustrator 目录运行安装链，验证固定安装目录、代理内容、退出码和清理行为。
- 手动双击 EXE，确认只需接受 UAC，重启 Illustrator 后菜单入口可用。
- 执行 `git diff --check` 和发布脚本的空 Release 检查。
