Summary: 修复 Windows 与 Illustrator 内置安装器的目标目录判定，再让工具配置在持久 ExtendScript 引擎中成为明确的全局状态，最后分别验证 Illustrator 2024 和 2026。

Context: 当前 Windows 安装器把 AppData 写入视为成功，内置安装器从 `Folder.appPackage` 的内部目录开始扫描；两者都可能避开 Illustrator 实际读取的 `Presets/<locale>/<localized scripts>`。配置文件通过嵌套 `eval` 声明局部变量，调用返回后注册表得到 0 个工具。

System Impact: Illustrator 安装包内现有的本地化脚本目录成为安装目标的唯一来源；`$.global.TOOLBOX_CONFIG` 成为工具清单的单一来源。安装仍只创建一个指向仓库主入口的代理，不复制或迁移项目。

Approach: Windows 批处理只扫描已存在的本地化脚本目录并在需要时自提升；内置安装器向上查找真正的安装根目录并优先当前语言；配置显式写入 `$.global`，主入口显式读取同一全局对象。

Changes:
- `install-windows.bat` - 删除无效 AppData/内部 Scripts 回退，扫描已存在的本地化目录，校验写入结果与退出码。
- `Install-VectorToolbox.jsx` - 从 `Folder.appPackage` 向上解析安装根，优先当前语言，检查 `open/write/close` 结果。
- `config/tools.jsx`、`Vector-Toolbox.jsx` - 统一通过 `$.global.TOOLBOX_CONFIG` 注册和刷新。
- `README.md`、`README_CN.md` - 校正代理安装、管理员权限和本地化脚本目录说明。

Verification:
- 静态检查批处理分支、代理路径和 Git diff。
- 用 Illustrator ExtendScript 引擎验证安装根、语言、配置数量和注册数量。
- 将代理安装到 Illustrator 2024/2026 的实际菜单目录，重启后检查菜单与 20 个工具面板。
