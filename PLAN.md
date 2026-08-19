Summary: 扩展 PDF 导出的质量选择，并在导出前提供按需、可解释的文件大小估算。质量统一由 Illustrator PDF 预设驱动，估算使用少量代表画板临时导出，不修改原稿。

Context: `scripts/export/export-pdf.jsx` 当前只显示“印刷 / 屏幕”，再通过本地化名称猜测预设。`ExportForScreensPDFOptions.pdfPreset` 会应用质量，但部分画板合并或转曲版走 `PDFSaveOptions`，没有设置 `pDFPreset`，因此现有质量选择在部分路径失效。Illustrator 脚本 API 不提供导出前的 PDF 字节数；大小只能通过真实临时导出估算。项目没有自动化测试框架。

System Impact: `app.PDFPresetsList` 成为质量选项的唯一来源，同一个预设名传入两条导出路径。大小估算是对话框内的临时状态，绑定范围、输出模式、预设和版本勾选；任一输入变化都会使旧结果失效。估算失败不阻止正式导出，临时 PDF 和文档副本必须始终清理。

Approach: 将质量控件改为“PDF 预设”下拉框，显示 Illustrator 当前可用的全部预设，默认优先“高质量打印”。新增“估算大小”按钮，最多均匀抽取首、中、末 3 个已选画板，以当前预设分别测量可编辑版和转曲版，再用样本最小值、最大值推算所选画板的总大小区间。结果明确标注抽样数量和“约”；正式导出后回报实际总大小。转曲估算若文档尚未保存则提示先保存，不为估算静默保存原稿。

Changes:
- `scripts/export/export-pdf.jsx` - 动态读取预设；统一 `ExportForScreensPDFOptions.pdfPreset` 与 `PDFSaveOptions.pDFPreset`；增加估算状态、样本选择、临时导出、区间格式化、失效处理和实际大小回报；调整输出区布局。
- `config/tools.jsx` - 更新“导出 PDF”说明和工具版本，反映预设与大小估算能力。
- `README.md`、`README_CN.md`、`docs/USER_GUIDE_CN.md` - 说明 PDF 预设、抽样估算的含义与限制。
- `docs/CHANGELOG.md` - 在 `Unreleased` 记录质量一致性修复和大小估算功能。

Verification:
- 对脚本执行静态语法检查与 `git diff --check`。
- 在 Illustrator 中确认下拉框与 `app.PDFPresetsList` 一致，预设不可用时有明确错误。
- 分别验证全部 / 当前 / 指定范围、合并 / 拆分、可编辑 / 转曲组合，两条导出路径使用同一预设。
- 用 1、3、76 个画板验证估算区间、选项变化失效、临时目录清理和未保存文档保护。
- 对“最小文件大小 / 高质量打印 / 印刷质量”各导出一组，比较估算与实际总大小，并确认原稿内容、路径和保存状态不被估算改变。
