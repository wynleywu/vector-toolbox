/**
 * Vector Toolbox - Smart Export Pro (智能导出)
 * Advanced multi-format, multi-scale asset exporter with custom naming templates & tokens
 */

#target illustrator

(function () {
    if (!app.documents || app.documents.length === 0) {
        alert("请先打开一个 Illustrator 文档！", "智能导出");
        return;
    }

    var doc = app.activeDocument;
    var artboards = doc.artboards;
    var docBaseName = doc.name.replace(/\.[^\.]+$/, "");

    function contains(arr, val) {
        var i;
        for (i = 0; i < arr.length; i++) {
            if (arr[i] === val) return true;
        }
        return false;
    }

    function getDateStr() {
        var d = new Date();
        var y = d.getFullYear();
        var m = (d.getMonth() + 1 < 10 ? "0" : "") + (d.getMonth() + 1);
        var day = (d.getDate() < 10 ? "0" : "") + d.getDate();
        return "" + y + m + day;
    }

    function parseRange(rangeStr, total) {
        if (!rangeStr || rangeStr.toLowerCase() === "all" || rangeStr.replace(/\s+/g, "") === "") {
            var all = [];
            var i;
            for (i = 0; i < total; i++) all.push(i);
            return all;
        }
        var indices = [];
        var parts = rangeStr.split(",");
        var p;
        for (p = 0; p < parts.length; p++) {
            var part = parts[p].replace(/\s+/g, "");
            if (part.indexOf("-") !== -1) {
                var range = part.split("-");
                var start = parseInt(range[0], 10) - 1;
                var end = parseInt(range[1], 10) - 1;
                if (isNaN(start) || isNaN(end)) continue;
                if (start > end) {
                    var tmp = start;
                    start = end;
                    end = tmp;
                }
                var r;
                for (r = start; r <= end; r++) {
                    if (r >= 0 && r < total && !contains(indices, r)) {
                        indices.push(r);
                    }
                }
            } else {
                var single = parseInt(part, 10) - 1;
                if (!isNaN(single) && single >= 0 && single < total && !contains(indices, single)) {
                    indices.push(single);
                }
            }
        }
        return indices;
    }

    function resolveFileName(template, vars) {
        var res = template;
        res = res.replace(/\{doc\}/gi, vars.doc || "");
        res = res.replace(/\{name\}/gi, vars.name || "");
        res = res.replace(/\{index2\}/gi, vars.index2 || "");
        res = res.replace(/\{index\}/gi, vars.index || "");
        res = res.replace(/\{scale\}/gi, vars.scale || "");
        res = res.replace(/\{format\}/gi, vars.format || "");
        res = res.replace(/\{date\}/gi, vars.date || "");
        res = res.replace(/\{w\}/gi, vars.w || "");
        res = res.replace(/\{h\}/gi, vars.h || "");
        res = res.replace(/[\/\\:*?"<>|]/g, "_");
        return res;
    }

    var SCALE_PRESETS = [
        { id: "1x", label: "1x / 72 DPI", scale: 100, suffix: "@1x" },
        { id: "2x", label: "2x / 144 DPI", scale: 200, suffix: "@2x" },
        { id: "3x", label: "3x / 216 DPI", scale: 300, suffix: "@3x" },
        { id: "300", label: "300 DPI", scale: (300 / 72) * 100, suffix: "_300dpi" }
    ];

    var dlg = new Window("dialog", "智能导出 - Vector Toolbox");
    dlg.orientation = "column";
    dlg.alignChildren = ["fill", "top"];
    dlg.spacing = 10;
    dlg.margins = 15;
    dlg.preferredSize.width = 480;

    var pnlScope = dlg.add("panel", undefined, "1. 导出范围");
    pnlScope.orientation = "column";
    pnlScope.alignChildren = ["fill", "top"];
    pnlScope.spacing = 6;

    var rowScopeRb = pnlScope.add("group");
    var rbAll = rowScopeRb.add("radiobutton", undefined, "全部画板 (" + artboards.length + ")");
    var rbActive = rowScopeRb.add("radiobutton", undefined, "当前画板");
    var rbCustom = rowScopeRb.add("radiobutton", undefined, "指定范围:");
    rbAll.value = true;

    var edtRange = rowScopeRb.add("edittext", undefined, "1-" + Math.min(artboards.length, 5));
    edtRange.characters = 8;
    edtRange.helpTip = "例如: 1, 3, 5-8";

    var pnlFmt = dlg.add("panel", undefined, "2. 格式与倍率");
    pnlFmt.orientation = "column";
    pnlFmt.alignChildren = ["fill", "top"];
    pnlFmt.spacing = 8;

    var rowFormats = pnlFmt.add("group");
    rowFormats.add("statictext", undefined, "格式:");
    var chkPng = rowFormats.add("checkbox", undefined, "PNG");
    var chkJpg = rowFormats.add("checkbox", undefined, "JPG");
    var chkSvg = rowFormats.add("checkbox", undefined, "SVG");
    var chkPdf = rowFormats.add("checkbox", undefined, "PDF");
    chkPng.value = true;

    var rowScale = pnlFmt.add("group");
    rowScale.add("statictext", undefined, "倍率:");
    var chkScales = [];
    var s;
    for (s = 0; s < SCALE_PRESETS.length; s++) {
        var box = rowScale.add("checkbox", undefined, SCALE_PRESETS[s].label);
        box.value = SCALE_PRESETS[s].id === "300";
        chkScales.push(box);
    }

    var pnlName = dlg.add("panel", undefined, "3. 命名模版");
    pnlName.orientation = "column";
    pnlName.alignChildren = ["fill", "top"];
    pnlName.spacing = 6;

    var rowTpl = pnlName.add("group");
    rowTpl.add("statictext", undefined, "命名规则:");
    var edtTpl = rowTpl.add("edittext", undefined, "{doc}_{index2}_{name}{scale}");
    edtTpl.alignment = ["fill", "center"];

    pnlName.add("statictext", undefined, "{doc} {name} {index} {index2} {scale} {format} {date} {w} {h}");

    var rowPreview = pnlName.add("group");
    rowPreview.add("statictext", undefined, "预览:");
    var lblPreview = rowPreview.add("statictext", undefined, "...");
    lblPreview.alignment = ["fill", "center"];

    function firstScaleSuffix() {
        var i;
        for (i = 0; i < chkScales.length; i++) {
            if (chkScales[i].value) return SCALE_PRESETS[i].suffix;
        }
        return SCALE_PRESETS[3].suffix;
    }

    function updatePreview() {
        var sampleAb = artboards[0];
        var previewStr = resolveFileName(edtTpl.text, {
            doc: docBaseName,
            name: sampleAb ? sampleAb.name : "Artboard",
            index: "1",
            index2: "01",
            scale: firstScaleSuffix(),
            format: "PNG",
            date: getDateStr(),
            w: sampleAb ? Math.round(sampleAb.artboardRect[2] - sampleAb.artboardRect[0]) : "1920",
            h: sampleAb ? Math.round(sampleAb.artboardRect[1] - sampleAb.artboardRect[3]) : "1080"
        });
        lblPreview.text = previewStr + ".png";
    }

    edtTpl.onChanging = updatePreview;
    for (s = 0; s < chkScales.length; s++) {
        chkScales[s].onClick = updatePreview;
    }
    updatePreview();

    var pnlDest = dlg.add("panel", undefined, "4. 保存位置");
    pnlDest.orientation = "column";
    pnlDest.alignChildren = ["fill", "top"];
    pnlDest.spacing = 6;

    var rowDir = pnlDest.add("group");
    rowDir.alignment = ["fill", "center"];
    var defaultFolder = (doc.path && doc.path.exists) ? doc.path : Folder.desktop;
    var edtDest = rowDir.add("edittext", undefined, defaultFolder.fsName);
    edtDest.alignment = ["fill", "center"];
    var btnBrowse = rowDir.add("button", undefined, "选择目录...");

    var chkSubDir = pnlDest.add("checkbox", undefined, "按格式创建子文件夹");
    chkSubDir.value = false;

    btnBrowse.onClick = function () {
        var sel = Folder.selectDialog("请选择导出文件夹", new Folder(edtDest.text));
        if (sel) edtDest.text = sel.fsName;
    };

    var grpActions = dlg.add("group");
    grpActions.alignment = ["fill", "center"];
    grpActions.add("button", undefined, "开始导出", { name: "ok" });
    grpActions.add("button", undefined, "取消", { name: "cancel" });

    if (dlg.show() !== 1) {
        return;
    }

    var destDir = new Folder(edtDest.text);
    if (!destDir.exists) {
        if (!destDir.create()) {
            alert("无法创建导出目录:\n" + destDir.fsName, "智能导出");
            return;
        }
    }

    var targetIndices = [];
    if (rbAll.value) {
        var a;
        for (a = 0; a < artboards.length; a++) targetIndices.push(a);
    } else if (rbActive.value) {
        targetIndices.push(doc.artboards.getActiveArtboardIndex());
    } else {
        targetIndices = parseRange(edtRange.text, artboards.length);
    }

    if (targetIndices.length === 0) {
        alert("未选择任何有效的画板！", "智能导出");
        return;
    }

    var formats = [];
    if (chkPng.value) formats.push("PNG");
    if (chkJpg.value) formats.push("JPG");
    if (chkSvg.value) formats.push("SVG");
    if (chkPdf.value) formats.push("PDF");
    if (formats.length === 0) {
        alert("请至少勾选一种导出格式！", "智能导出");
        return;
    }

    var scales = [];
    for (s = 0; s < chkScales.length; s++) {
        if (chkScales[s].value) scales.push(SCALE_PRESETS[s]);
    }
    if (scales.length === 0) {
        scales.push(SCALE_PRESETS[3]);
    }

    var template = edtTpl.text;
    var autoSubDir = chkSubDir.value;
    var totalExported = 0;
    var failed = 0;
    var sourceAi = null;

    try {
        if (doc.saved && doc.fullName && /\.ai$/i.test(doc.name)) {
            sourceAi = new File(doc.fullName);
        }
    } catch (srcErr) {}

    function exportOne(fmt, scaleInfo, idx) {
        var ab = artboards[idx];
        doc.artboards.setActiveArtboardIndex(idx);

        var idx1 = (idx + 1).toString();
        var idx2 = (idx + 1 < 10 ? "0" : "") + (idx + 1);
        var abW = Math.round(ab.artboardRect[2] - ab.artboardRect[0]);
        var abH = Math.round(ab.artboardRect[1] - ab.artboardRect[3]);
        var scaleSuffix = (fmt === "SVG" || fmt === "PDF") ? "" : scaleInfo.suffix;

        var fileNameBase = resolveFileName(template, {
            doc: docBaseName,
            name: ab.name || ("Artboard_" + idx1),
            index: idx1,
            index2: idx2,
            scale: scaleSuffix,
            format: fmt,
            date: getDateStr(),
            w: "" + abW,
            h: "" + abH
        });

        var formatDir = destDir;
        if (autoSubDir) {
            formatDir = new Folder(destDir.fsName + "/" + fmt);
            if (!formatDir.exists) formatDir.create();
        }

        var ext = fmt.toLowerCase();
        var targetFile = new File(formatDir.fsName + "/" + fileNameBase + "." + ext);

        if (fmt === "PNG") {
            var pngOpts = new ExportOptionsPNG24();
            pngOpts.antiAliasing = true;
            pngOpts.transparency = true;
            pngOpts.artBoardClipping = true;
            pngOpts.horizontalScale = scaleInfo.scale;
            pngOpts.verticalScale = scaleInfo.scale;
            doc.exportFile(targetFile, ExportType.PNG24, pngOpts);
            return;
        }
        if (fmt === "JPG") {
            var jpgOpts = new ExportOptionsJPEG();
            jpgOpts.antiAliasing = true;
            jpgOpts.qualitySetting = 100;
            jpgOpts.artBoardClipping = true;
            jpgOpts.horizontalScale = scaleInfo.scale;
            jpgOpts.verticalScale = scaleInfo.scale;
            doc.exportFile(targetFile, ExportType.JPEG, jpgOpts);
            return;
        }
        if (fmt === "SVG") {
            var svgOpts = new ExportOptionsSVG();
            svgOpts.embedRasterImages = true;
            svgOpts.fontSubsetting = SVGFontSubsetting.GLYPHSUSED;
            try {
                svgOpts.saveMultipleArtboards = true;
                svgOpts.artboardRange = "" + (idx + 1);
            } catch (svgErr) {}
            doc.exportFile(targetFile, ExportType.SVG, svgOpts);
            return;
        }
        if (fmt === "PDF") {
            var pdfOpts = new PDFSaveOptions();
            pdfOpts.preserveEditability = false;
            pdfOpts.artboardRange = "" + (idx + 1);
            doc.saveAs(targetFile, pdfOpts);
        }
    }

    var rasterFormats = [];
    var vectorFormats = [];
    var f;
    for (f = 0; f < formats.length; f++) {
        if (formats[f] === "PDF" || formats[f] === "SVG") {
            vectorFormats.push(formats[f]);
        } else {
            rasterFormats.push(formats[f]);
        }
    }

    function runBatch(fmtList, useScales) {
        var fi, ti, si;
        for (fi = 0; fi < fmtList.length; fi++) {
            var fmt = fmtList[fi];
            var scaleList = useScales ? scales : [SCALE_PRESETS[0]];
            for (si = 0; si < scaleList.length; si++) {
                for (ti = 0; ti < targetIndices.length; ti++) {
                    try {
                        exportOne(fmt, scaleList[si], targetIndices[ti]);
                        totalExported++;
                    } catch (exErr) {
                        failed++;
                    }
                }
            }
        }
    }

    runBatch(rasterFormats, true);
    runBatch(vectorFormats, false);

    if (sourceAi && sourceAi.exists) {
        try {
            if (!app.activeDocument.fullName || app.activeDocument.fullName.fsName !== sourceAi.fsName) {
                app.open(sourceAi);
            }
        } catch (reopenErr) {}
    }

    if (totalExported === 0) {
        return "× 导出失败，未生成文件";
    }
    var failMsg = failed > 0 ? "，失败 " + failed + " 个" : "";
    return "✓ 智能导出完成，共生成 " + totalExported + " 个文件" + failMsg;
})();
