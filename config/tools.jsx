/**
 * Vector Toolbox - Tools Manifest Configuration
 * Define all tools, modes, categories, and scripts here
 */

var TOOLBOX_CONFIG = $.global.TOOLBOX_CONFIG = [
    {
        id: "dimension",
        name: "宽高标注",
        category: "标注",
        script: "scripts/annotation/dimension.jsx",
        mode: "palette",
        keywords: ["尺寸", "宽度", "高度", "标注", "dimension", "size", "width", "height"],
        description: "四向宽高标注，可覆盖旧标注、选颜色线宽，并记住上次参数",
        author: "Vector Toolbox Team",
        version: "1.2.0"
    },
    {
        id: "page-number",
        name: "生成页码",
        category: "标注",
        script: "scripts/annotation/page-number.jsx",
        mode: "dialog",
        keywords: ["页码", "画板", "编号", "生成", "page", "number", "pagination"],
        description: "按预设或自定义格式为全部画板生成页码，支持字体、四角位置与清除",
        author: "Vector Toolbox Team",
        version: "1.2.0"
    },
    {
        id: "outline-and-backup",
        name: "转曲并备份",
        category: "文本",
        script: "scripts/text/outline-and-backup.jsx",
        mode: "dialog",
        keywords: ["转曲", "轮廓化", "备份", "发印", "outline", "createoutline", "text", "font"],
        description: "可选选区或全文转曲，备份到隐藏图层且不重复备份",
        author: "Vector Toolbox Team",
        version: "1.2.0"
    },
    {
        id: "grid-guides",
        name: "栅格参考线",
        category: "参考线",
        script: "scripts/guide/grid-guides.jsx",
        mode: "palette",
        keywords: ["参考线", "栅格", "分栏", "网格", "版式", "边距", "中线", "guideguide", "grid", "guide", "column", "gutter"],
        description: "按 GuideGuide 方式生成行列栅格、四边、中线，支持画板或选区",
        author: "Vector Toolbox Team",
        version: "1.2.0"
    },
    {
        id: "normalize-size",
        name: "统一尺寸",
        category: "对象",
        script: "scripts/object/normalize-size.jsx",
        mode: "dialog",
        keywords: ["统一", "尺寸", "宽高", "等比", "normalize", "size", "fit"],
        description: "按指定值、首个对象或选区最大边统一尺寸，可选对齐点",
        author: "Vector Toolbox Team",
        version: "1.2.0"
    },
    {
        id: "export-pdf",
        name: "导出 PDF",
        category: "导出",
        script: "scripts/export/export-pdf.jsx",
        mode: "dialog",
        keywords: ["导出", "PDF", "发印", "画板", "pdf", "export", "print"],
        description: "按 Illustrator PDF 预设导出，支持抽样估算大小、多页合并与转曲版",
        author: "Vector Toolbox Team",
        version: "1.5.0"
    }
];
