/**
 * Vector Toolbox - Export PDF (导出 PDF)
 * Uses Export for Screens for split artboard PDFs. Merged/outlined variants use
 * PDFSaveOptions on a disk copy so the selected PDF preset is applied consistently
 * without converting the working document. Custom export opens Illustrator's
 * native Save Adobe PDF dialog on a throwaway copy.
 */

#target illustrator

(function () {
    if (!app.documents || app.documents.length === 0) {
        alert("请先打开一个 Illustrator 文档！", "导出 PDF");
        return;
    }

    var doc = app.activeDocument;
    var artboards = doc.artboards;
    if (!artboards || artboards.length === 0) {
        alert("当前文档没有画板！", "导出 PDF");
        return;
    }

    if (typeof ExportForScreensType === "undefined" || typeof ExportForScreensPDFOptions === "undefined") {
        alert("当前 Illustrator 不支持「导出屏幕」PDF。请使用 2021 或更高版本。", "导出 PDF");
        return;
    }

    var docBaseName = doc.name.replace(/\.[^\.]+$/, "");
    var BACKUP_NAME = "__原文字备份__";
    var ESTIMATE_SAMPLE_LIMIT = 3;

    function pad2(n) {
        return n < 10 ? ("0" + n) : ("" + n);
    }

    function formatStamp(style, d) {
        d = d || new Date();
        var y = "" + d.getFullYear();
        var m = pad2(d.getMonth() + 1);
        var day = pad2(d.getDate());
        var hh = pad2(d.getHours());
        var mm = pad2(d.getMinutes());
        if (style === 1) return y + "-" + m + "-" + day;
        if (style === 2) return y + m + day + "_" + hh + mm;
        return y + m + day;
    }

    function dateFormatLabel(style, d) {
        var sample = formatStamp(style, d);
        if (style === 1) return "年-月-日 (" + sample + ")";
        if (style === 2) return "年月日_时分 (" + sample + ")";
        return "年月日 (" + sample + ")";
    }

    function sanitizeName(name) {
        return ("" + name).replace(/[\/\\:*?"<>|]/g, "_");
    }

    function contains(arr, val) {
        var i;
        for (i = 0; i < arr.length; i++) {
            if (arr[i] === val) return true;
        }
        return false;
    }

    function parseRange(rangeStr, total) {
        if (!rangeStr || rangeStr.replace(/\s+/g, "") === "") {
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

    function withStamp(stem, stamp) {
        var clean = sanitizeName(stem || "export");
        if (!stamp) return clean;
        if (clean.indexOf(stamp) !== -1) return clean;
        return clean + "_" + stamp;
    }

    function toRangeString(indices) {
        if (!indices || indices.length === 0) return "all";
        var parts = [];
        var i;
        for (i = 0; i < indices.length; i++) {
            parts.push("" + (indices[i] + 1));
        }
        return parts.join(",");
    }

    function listPdfPresets() {
        var result = [];
        try {
            var list = app.PDFPresetsList;
            var i;
            for (i = 0; i < list.length; i++) {
                var name = "" + list[i];
                if (name && !contains(result, name)) result.push(name);
            }
        } catch (e) {}
        return result;
    }

    function preferredPresetIndex(presets) {
        var preferred = [
            "[High Quality Print]", "[高质量打印]",
            "[Press Quality]", "[印刷质量]",
            "[Illustrator Default]", "[Illustrator 默认]"
        ];
        var p, i;
        for (p = 0; p < preferred.length; p++) {
            for (i = 0; i < presets.length; i++) {
                if (presets[i] === preferred[p]) return i;
            }
        }
        return 0;
    }

    function sampleIndices(indices, limit) {
        var result = [];
        if (!indices || indices.length === 0 || limit <= 0) return result;
        if (indices.length <= limit) return indices.slice(0);
        if (limit === 1) return [indices[0]];
        var i;
        for (i = 0; i < limit; i++) {
            var position = Math.round(i * (indices.length - 1) / (limit - 1));
            var value = indices[position];
            if (!contains(result, value)) result.push(value);
        }
        return result;
    }

    function formatBytes(bytes) {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
        if (bytes < 1024 * 1024 * 1024) {
            return (bytes / (1024 * 1024)).toFixed(1) + " MB";
        }
        return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB";
    }

    function estimateRange(files, totalCount) {
        if (!files || files.length === 0) {
            throw new Error("抽样导出未生成 PDF 文件");
        }
        var min = null;
        var max = 0;
        var sum = 0;
        var i;
        for (i = 0; i < files.length; i++) {
            var size = files[i].length || 0;
            if (min === null || size < min) min = size;
            if (size > max) max = size;
            sum += size;
        }
        if (totalCount <= files.length) {
            return { low: sum, high: sum, sampled: files.length };
        }
        return {
            low: min * totalCount,
            high: max * totalCount,
            sampled: files.length
        };
    }

    function formatEstimateRange(range) {
        if (range.low === range.high) return "约 " + formatBytes(range.low);
        return "约 " + formatBytes(range.low) + " - " + formatBytes(range.high);
    }

    function listPdfs(folder) {
        var result = [];
        if (!folder || !folder.exists) return result;
        var files = folder.getFiles();
        var i;
        for (i = 0; i < files.length; i++) {
            if (files[i] instanceof Folder) {
                var nested = listPdfs(files[i]);
                var n;
                for (n = 0; n < nested.length; n++) result.push(nested[n]);
            } else if (files[i] instanceof File) {
                var lower = files[i].name.toLowerCase();
                if (lower.length >= 4 && lower.substring(lower.length - 4) === ".pdf") {
                    result.push(files[i]);
                }
            }
        }
        return result;
    }

    function clearFolder(folder) {
        if (!folder || !folder.exists) return;
        var files = folder.getFiles();
        var i;
        for (i = 0; i < files.length; i++) {
            try {
                if (files[i] instanceof Folder) {
                    clearFolder(files[i]);
                    files[i].remove();
                } else {
                    files[i].remove();
                }
            } catch (e) {}
        }
    }

    function moveFile(src, dest) {
        if (dest.exists) {
            try { dest.remove(); } catch (e) {}
        }
        var copied = src.copy(dest.fsName);
        if (copied) {
            try { src.remove(); } catch (rmErr) {}
            return true;
        }
        return src.rename(dest.name);
    }

    // The clone is a throwaway copy, so unlocking is safe and keeps locked text
    // from staying live in the outlined PDF.
    function outlineVisibleText(workDoc) {
        var layers = workDoc.layers;
        var l;
        for (l = 0; l < layers.length; l++) {
            try {
                if (layers[l].locked) layers[l].locked = false;
            } catch (e) {}
        }
        var frames = workDoc.textFrames;
        var i;
        for (i = frames.length - 1; i >= 0; i--) {
            var tf = frames[i];
            try {
                if (tf.layer && tf.layer.name === BACKUP_NAME) continue;
                if (tf.hidden) continue;
                if (tf.layer && !tf.layer.visible) continue;
                if (tf.locked) tf.locked = false;
                tf.createOutline();
            } catch (e) {}
        }
    }

    // Illustrator's Document has no duplicate(); copy the saved file on disk and
    // open the copy instead.
    function makeClone() {
        var hasFile = false;
        try {
            hasFile = !!(doc.path && doc.path.exists && doc.fullName && doc.fullName.exists);
        } catch (pathErr) {}
        if (!hasFile) {
            throw new Error("转曲版 / 合并导出需要文档副本，请先保存文档后重试。");
        }
        if (!doc.saved) {
            doc.save();
        }
        var ext = "ai";
        var extMatch = /\.([^\.]+)$/.exec(doc.name);
        if (extMatch) ext = extMatch[1];
        var cloneFile = new File(Folder.temp.fsName + "/__vt_clone_" + (new Date()).getTime() + "." + ext);
        if (cloneFile.exists) {
            try { cloneFile.remove(); } catch (rmErr) {}
        }
        if (!doc.fullName.copy(cloneFile.fsName)) {
            throw new Error("无法创建文档副本: " + cloneFile.fsName);
        }
        var cloneDoc = app.open(cloneFile);
        return { doc: cloneDoc, file: cloneFile };
    }

    function closeClone(clone) {
        if (!clone) return;
        try {
            clone.doc.close(SaveOptions.DONOTSAVECHANGES);
        } catch (e) {}
        try {
            clone.file.remove();
        } catch (e) {}
        try {
            app.activeDocument = doc;
        } catch (e) {}
    }

    function exportScreens(workDoc, folder, indices, preset) {
        var options = new ExportForScreensPDFOptions();
        options.pdfPreset = preset;
        var item = new ExportForScreensItemToExport();
        item.document = false;
        item.artboards = toRangeString(indices);
        workDoc.exportForScreens(folder, ExportForScreensType.SE_PDF, options, item);
    }

    function exportMergedBySaveAs(workDoc, destFile, indices, preset) {
        var opts = new PDFSaveOptions();
        opts.pDFPreset = preset;
        opts.viewAfterSaving = false;
        opts.saveMultipleArtboards = true;
        if (indices && indices.length > 0 && indices.length < workDoc.artboards.length) {
            opts.artboardRange = toRangeString(indices);
        }
        if (destFile.exists) {
            try { destFile.remove(); } catch (e) {}
        }
        workDoc.saveAs(destFile, opts);
    }

    var defaultFolder = Folder.desktop;
    try {
        if (doc.path && doc.path.exists) defaultFolder = doc.path;
    } catch (pathErr) {}

    var pdfPresets = listPdfPresets();
    if (pdfPresets.length === 0) {
        alert("未读取到 Illustrator PDF 预设，无法导出。", "导出 PDF");
        return;
    }

    var dlg = new Window("dialog", "导出 PDF - Vector Toolbox");
    dlg.orientation = "column";
    dlg.alignChildren = ["fill", "top"];
    dlg.spacing = 10;
    dlg.margins = 15;
    dlg.preferredSize.width = 460;

    var pnlScope = dlg.add("panel", undefined, "范围");
    pnlScope.orientation = "column";
    pnlScope.alignChildren = ["fill", "top"];
    pnlScope.spacing = 6;

    var rowScope = pnlScope.add("group");
    var rbAll = rowScope.add("radiobutton", undefined, "全部画板 (" + artboards.length + ")");
    var rbActive = rowScope.add("radiobutton", undefined, "当前画板");
    rbAll.value = true;

    var rowCustom = pnlScope.add("group");
    var rbCustom = rowCustom.add("radiobutton", undefined, "指定范围:");
    var edtRange = rowCustom.add("edittext", undefined, "1-" + artboards.length);
    edtRange.characters = 10;
    edtRange.helpTip = "例如: 1, 3, 5-8";

    var pnlOut = dlg.add("panel", undefined, "输出");
    pnlOut.orientation = "column";
    pnlOut.alignChildren = ["fill", "top"];
    pnlOut.spacing = 6;

    var rowMode = pnlOut.add("group");
    var rbMerge = rowMode.add("radiobutton", undefined, "合并为一个多页 PDF");
    var rbSplit = rowMode.add("radiobutton", undefined, "每个画板单独一个 PDF");
    rbMerge.value = true;

    var rowQuality = pnlOut.add("group");
    rowQuality.alignment = ["fill", "center"];
    rowQuality.add("statictext", undefined, "PDF 预设:");
    var ddlQuality = rowQuality.add("dropdownlist", undefined, pdfPresets);
    ddlQuality.selection = preferredPresetIndex(pdfPresets);
    ddlQuality.alignment = ["fill", "center"];
    ddlQuality.helpTip = "来自 Illustrator 的 PDF 预设，所有导出路径使用同一预设";
    var btnCustomExport = rowQuality.add("button", undefined, "自定义导出 PDF...");
    btnCustomExport.helpTip = "打开 Illustrator 原生的存储 Adobe PDF 参数页，可设置全部 PDF 参数";
    btnCustomExport.preferredSize.width = 130;
    var nativeExportRequested = false;

    var chkLive = pnlOut.add("checkbox", undefined, "可编辑版（保持文字可改）");
    chkLive.value = true;
    var chkOutline = pnlOut.add("checkbox", undefined, "转曲版（文字转轮廓，不影响原稿）");
    chkOutline.value = false;

    var rowEstimate = pnlOut.add("group");
    rowEstimate.alignment = ["fill", "top"];
    var btnEstimate = rowEstimate.add("button", undefined, "估算大小");
    var lblEstimate = rowEstimate.add("statictext", undefined, "尚未估算", { multiline: true });
    lblEstimate.alignment = ["fill", "top"];
    lblEstimate.preferredSize.height = 64;
    lblEstimate.helpTip = "最多抽样 3 个画板，结果为近似区间";

    var pnlSave = dlg.add("panel", undefined, "保存");
    pnlSave.orientation = "column";
    pnlSave.alignChildren = ["fill", "top"];
    pnlSave.spacing = 6;

    var rowDir = pnlSave.add("group");
    rowDir.alignment = ["fill", "center"];
    var edtDest = rowDir.add("edittext", undefined, defaultFolder.fsName);
    edtDest.alignment = ["fill", "center"];
    var btnBrowse = rowDir.add("button", undefined, "浏览...");

    var rowName = pnlSave.add("group");
    rowName.alignment = ["fill", "center"];
    rowName.add("statictext", undefined, "文件名:");
    var edtName = rowName.add("edittext", undefined, sanitizeName(docBaseName));
    edtName.alignment = ["fill", "center"];

    var rowDate = pnlSave.add("group");
    rowDate.alignment = ["fill", "center"];
    var chkDate = rowDate.add("checkbox", undefined, "包含日期时间");
    chkDate.value = true;
    chkDate.helpTip = "勾选后在文件名后附加日期或时间";
    var stampNow = new Date();
    var ddlDateFmt = rowDate.add("dropdownlist", undefined, [
        dateFormatLabel(0, stampNow),
        dateFormatLabel(1, stampNow),
        dateFormatLabel(2, stampNow)
    ]);
    ddlDateFmt.selection = 0;
    ddlDateFmt.alignment = ["fill", "center"];
    ddlDateFmt.helpTip = "文件名中的日期时间格式";

    var lblPreview = pnlSave.add("statictext", undefined, "", { multiline: true });
    lblPreview.alignment = ["fill", "top"];
    lblPreview.preferredSize.height = 48;

    var chkOpenFolder = dlg.add("checkbox", undefined, "导出后打开所在文件夹");
    chkOpenFolder.value = false;

    function currentIndices() {
        if (rbActive.value) {
            return [doc.artboards.getActiveArtboardIndex()];
        }
        if (rbCustom.value) {
            return parseRange(edtRange.text, artboards.length);
        }
        var all = [];
        var i;
        for (i = 0; i < artboards.length; i++) all.push(i);
        return all;
    }

    function selectedStamp() {
        if (!chkDate.value) return "";
        var idx = ddlDateFmt.selection ? ddlDateFmt.selection.index : 0;
        return formatStamp(idx);
    }

    function currentStem() {
        return withStamp(edtName.text, selectedStamp());
    }

    function selectedPresetName() {
        return ddlQuality.selection ? ddlQuality.selection.text : "";
    }

    function estimateFingerprint() {
        return [
            currentIndices().join(","),
            rbMerge.value ? "merge" : "split",
            selectedPresetName(),
            chkLive.value ? "live" : "",
            chkOutline.value ? "outline" : ""
        ].join("|");
    }

    function withEstimateFolder(callback) {
        var suffix = (new Date()).getTime() + "_" + Math.floor(Math.random() * 1000000);
        var temp = new Folder(Folder.temp.fsName + "/__vt_pdf_estimate_" + suffix);
        if (!temp.create()) {
            throw new Error("无法创建估算临时目录: " + temp.fsName);
        }
        try {
            return callback(temp);
        } finally {
            clearFolder(temp);
            try { temp.remove(); } catch (e) {}
        }
    }

    function estimateVariant(outlined, indices, totalCount, preset) {
        var clone = null;
        try {
            var workDoc = doc;
            if (outlined) {
                clone = makeClone();
                workDoc = clone.doc;
                outlineVisibleText(workDoc);
            }
            return withEstimateFolder(function (temp) {
                exportScreens(workDoc, temp, indices, preset);
                return estimateRange(listPdfs(temp), totalCount);
            });
        } finally {
            closeClone(clone);
        }
    }

    var lastEstimateFingerprint = "";

    function invalidateEstimate() {
        lastEstimateFingerprint = "";
        lblEstimate.text = "尚未估算";
    }

    function estimateResultText(liveRange, outlineRange, totalCount, sampleCount) {
        var lines = [];
        var totalLow = 0;
        var totalHigh = 0;
        if (liveRange) {
            lines.push("可编辑版: " + formatEstimateRange(liveRange));
            totalLow += liveRange.low;
            totalHigh += liveRange.high;
        }
        if (outlineRange) {
            lines.push("转曲版: " + formatEstimateRange(outlineRange));
            totalLow += outlineRange.low;
            totalHigh += outlineRange.high;
        }
        if (liveRange && outlineRange) {
            lines.push("合计: " + formatEstimateRange({ low: totalLow, high: totalHigh }));
        }
        lines.push("抽样 " + sampleCount + "/" + totalCount + " 个画板，实际大小可能有偏差");
        return lines.join("\n");
    }

    function updatePreview() {
        if (
            lastEstimateFingerprint &&
            lastEstimateFingerprint !== estimateFingerprint()
        ) {
            invalidateEstimate();
        }
        ddlDateFmt.enabled = chkDate.value;
        var stem = currentStem();
        var names = [];
        if (chkLive.value) names.push(stem + (rbSplit.value ? "_01_画板.pdf" : ".pdf"));
        if (chkOutline.value) names.push(stem + "_转曲" + (rbSplit.value ? "_01_画板.pdf" : ".pdf"));
        if (names.length === 0) {
            lblPreview.text = "请至少勾选「可编辑版」或「转曲版」";
            return;
        }
        var text = "预览: " + names.join("  和  ");
        var cloneNeeded = chkOutline.value || rbMerge.value;
        if (cloneNeeded) {
            var unsaved = false;
            try { unsaved = !doc.saved; } catch (savedErr) {}
            text += unsaved
                ? "\n该组合需要文档副本，导出前会先保存当前文档。"
                : "\n该组合会用文档副本导出，原稿不受影响。";
        }
        lblPreview.text = text;
    }

    function onExportOptionChange() {
        updatePreview();
    }

    rbAll.onClick = onExportOptionChange;
    rbActive.onClick = onExportOptionChange;
    rbCustom.onClick = onExportOptionChange;
    rbMerge.onClick = onExportOptionChange;
    rbSplit.onClick = onExportOptionChange;
    chkLive.onClick = onExportOptionChange;
    chkOutline.onClick = onExportOptionChange;
    ddlQuality.onChange = onExportOptionChange;
    chkDate.onClick = updatePreview;
    ddlDateFmt.onChange = updatePreview;
    edtName.onChanging = updatePreview;
    edtRange.onChanging = onExportOptionChange;
    updatePreview();

    var NATIVE_PDF_ACTION_SET = "VT PDF Dialog";
    var NATIVE_PDF_ACTION_NAME = "Custom PDF Export";

    function actionHexByte(value) {
        var hex = value.toString(16);
        return hex.length < 2 ? "0" + hex : hex;
    }

    function actionUnicodeHex(value) {
        var text = "" + value;
        var hex = "";
        var i;
        var code;
        for (i = 0; i < text.length; i++) {
            code = text.charCodeAt(i);
            if (code < 0x80) {
                hex += actionHexByte(code);
            } else if (code < 0x800) {
                hex += actionHexByte(0xC0 | (code >> 6));
                hex += actionHexByte(0x80 | (code & 0x3F));
            } else {
                hex += actionHexByte(0xE0 | (code >> 12));
                hex += actionHexByte(0x80 | ((code >> 6) & 0x3F));
                hex += actionHexByte(0x80 | (code & 0x3F));
            }
        }
        return hex;
    }

    function actionParameter(number, key, type, value) {
        var text =
            "/parameter-" + number + " {\r\n" +
            "/key " + key + "\r\n" +
            "/showInPalette 4294967295\r\n" +
            "/type (" + type + ")\r\n";
        if (type === "ustring") {
            var hex = actionUnicodeHex(value);
            text += "/value [ " + (hex.length / 2) + "\r\n" + hex + "\r\n]\r\n";
        } else {
            text += "/value " + value + "\r\n";
        }
        return text + "}\r\n\r\n";
    }

    function buildNativePdfAction(pdfFile) {
        var setHex = actionUnicodeHex(NATIVE_PDF_ACTION_SET);
        var actionHex = actionUnicodeHex(NATIVE_PDF_ACTION_NAME);
        var action =
            "/version 3\r\n\r\n" +
            "/name [ " + (setHex.length / 2) + "\r\n" + setHex + "\r\n]\r\n\r\n" +
            "/isOpen 1\r\n\r\n" +
            "/actionCount 1\r\n\r\n" +
            "/action-1 {\r\n\r\n" +
            "/name [ " + (actionHex.length / 2) + "\r\n" + actionHex + "\r\n]\r\n\r\n" +
            "/keyIndex 0\r\n\r\n" +
            "/colorIndex 0\r\n\r\n" +
            "/isOpen 1\r\n\r\n" +
            "/eventCount 1\r\n\r\n" +
            "/event-1 {\r\n\r\n" +
            "/useRulersIn1stQuadrant 0\r\n\r\n" +
            "/internalName (adobe_saveDocumentAs)\r\n\r\n" +
            "/localizedName [ " + (actionHex.length / 2) + "\r\n" + actionHex + "\r\n]\r\n\r\n" +
            "/isOpen 1\r\n\r\n" +
            "/isOn 1\r\n\r\n" +
            "/hasDialog 1\r\n\r\n" +
            "/showDialog 1\r\n\r\n" +
            "/parameterCount 18\r\n\r\n" +
            actionParameter(1, 2003201396, "integer", 5) +
            actionParameter(2, 1668445298, "integer", 17) +
            actionParameter(3, 1702392878, "integer", 1) +
            actionParameter(4, 1768975459, "boolean", 0) +
            actionParameter(5, 1769236589, "boolean", 1) +
            actionParameter(6, 1667723380, "boolean", 0) +
            actionParameter(7, 1768320372, "integer", 0) +
            actionParameter(8, 1768122987, "boolean", 1) +
            actionParameter(9, 1886612598, "integer", 2) +
            actionParameter(10, 1668118891, "boolean", 1) +
            actionParameter(11, 1684435811, "boolean", 1) +
            actionParameter(12, 1701802100, "integer", 1) +
            actionParameter(13, 1851878757, "ustring", pdfFile.fsName.replace(/\\/g, "/")) +
            actionParameter(14, 1718775156, "ustring", "Adobe PDF") +
            actionParameter(15, 1702392942, "ustring", "pdf") +
            actionParameter(16, 1936548194, "boolean", 0) +
            actionParameter(17, 1935764588, "boolean", 1) +
            actionParameter(18, 1936875886, "ustring", "") +
            "}\r\n\r\n" +
            "}\r\n";
        return action;
    }

    function writeNativePdfAction(actionFile, pdfFile) {
        actionFile.encoding = "BINARY";
        if (!actionFile.open("w")) {
            throw new Error("无法创建临时 PDF 参数动作");
        }
        try {
            actionFile.write(buildNativePdfAction(pdfFile));
        } finally {
            actionFile.close();
        }
    }

    function openNativePdfExport() {
        var clone = null;
        var actionFile = null;
        var tempPdf = null;
        var destination = null;
        var saved = false;
        try {
            if (!chkLive.value && !chkOutline.value) {
                alert("请至少勾选「可编辑版」或「转曲版」。", "自定义导出 PDF");
                return;
            }
            if (!doc.saved) {
                alert("自定义导出需要先保存当前 Illustrator 文档。", "自定义导出 PDF");
                return;
            }

            var destinationFolder = new Folder(edtDest.text);
            if (!destinationFolder.exists && !destinationFolder.create()) {
                throw new Error("无法创建保存目录: " + destinationFolder.fsName);
            }
            destination = new File(destinationFolder.fsName + "/" + currentStem() + ".pdf");
            var suffix = (new Date()).getTime() + "_" + Math.floor(Math.random() * 1000000);
            tempPdf = new File(Folder.temp.fsName + "/__vt_custom_pdf_" + suffix + ".pdf");
            actionFile = new File(Folder.temp.fsName + "/__vt_custom_pdf_" + suffix + ".aia");
            clone = makeClone();
            if (chkOutline.value) outlineVisibleText(clone.doc);
            writeNativePdfAction(actionFile, tempPdf);
            try { app.unloadAction(NATIVE_PDF_ACTION_NAME, NATIVE_PDF_ACTION_SET); } catch (unloadErr) {}
            app.loadAction(actionFile);
            app.doScript(NATIVE_PDF_ACTION_NAME, NATIVE_PDF_ACTION_SET);
            saved = tempPdf.exists;
        } catch (exportErr) {
            alert(
                "无法打开 Illustrator 的存储 Adobe PDF 参数页:\n" +
                (exportErr.message || exportErr.toString()),
                "自定义导出 PDF"
            );
        } finally {
            try { app.unloadAction(NATIVE_PDF_ACTION_NAME, NATIVE_PDF_ACTION_SET); } catch (unloadErr2) {}
            closeClone(clone);
            if (actionFile && actionFile.exists) {
                try { actionFile.remove(); } catch (actionRemoveErr) {}
            }
        }

        if (!saved || !tempPdf || !tempPdf.exists) return;
        if (moveFile(tempPdf, destination)) {
            if (chkOpenFolder.value) {
                try { destination.parent.execute(); } catch (openErr) {}
            }
            alert("✓ 已使用自定义 PDF 参数导出:\n" + destination.fsName, "自定义导出 PDF");
        } else {
            alert("PDF 参数已保存，但无法移动到目标目录:\n" + destination.fsName, "自定义导出 PDF");
        }
    }

    btnCustomExport.onClick = function () {
        nativeExportRequested = true;
        dlg.close(2);
    };

    btnEstimate.onClick = function () {
        if (!chkLive.value && !chkOutline.value) {
            alert("请至少勾选「可编辑版」或「转曲版」。", "估算 PDF 大小");
            return;
        }
        var indices = currentIndices();
        if (indices.length === 0) {
            alert("未选择任何有效的画板！", "估算 PDF 大小");
            return;
        }
        var preset = selectedPresetName();
        if (!preset) {
            alert("请选择有效的 PDF 预设。", "估算 PDF 大小");
            return;
        }
        if (chkOutline.value) {
            var saved = false;
            try { saved = !!doc.saved; } catch (savedErr) {}
            if (!saved) {
                alert("转曲版估算需要文档已保存且没有未保存改动。请先保存后重试。", "估算 PDF 大小");
                return;
            }
        }

        var samples = sampleIndices(indices, ESTIMATE_SAMPLE_LIMIT);
        btnEstimate.enabled = false;
        lblEstimate.text = "估算中，请稍候...";
        try { dlg.update(); } catch (updateErr) {}
        try {
            var liveRange = chkLive.value
                ? estimateVariant(false, samples, indices.length, preset)
                : null;
            var outlineRange = chkOutline.value
                ? estimateVariant(true, samples, indices.length, preset)
                : null;
            lastEstimateFingerprint = estimateFingerprint();
            lblEstimate.text = estimateResultText(
                liveRange,
                outlineRange,
                indices.length,
                samples.length
            );
        } catch (estimateErr) {
            lastEstimateFingerprint = "";
            lblEstimate.text = "估算失败: " + (estimateErr.message || estimateErr.toString());
        } finally {
            btnEstimate.enabled = true;
            try { dlg.update(); } catch (finalUpdateErr) {}
        }
    };

    btnBrowse.onClick = function () {
        var sel = Folder.selectDialog("请选择 PDF 保存目录", new Folder(edtDest.text));
        if (sel) edtDest.text = sel.fsName;
    };

    var grpBtns = dlg.add("group");
    grpBtns.alignment = ["fill", "center"];
    grpBtns.add("button", undefined, "导出 PDF", { name: "ok" });
    grpBtns.add("button", undefined, "取消", { name: "cancel" });

    if (dlg.show() !== 1) {
        if (nativeExportRequested) openNativePdfExport();
        return;
    }

    if (!chkLive.value && !chkOutline.value) {
        alert("请至少勾选「可编辑版」或「转曲版」。", "导出 PDF");
        return;
    }

    var destDir = new Folder(edtDest.text);
    if (!destDir.exists) {
        if (!destDir.create()) {
            alert("无法创建保存目录:\n" + destDir.fsName, "导出 PDF");
            return;
        }
    }

    var targetIndices = currentIndices();
    if (targetIndices.length === 0) {
        alert("未选择任何有效的画板！", "导出 PDF");
        return;
    }

    var dateStr = selectedStamp();
    var stem = withStamp(edtName.text, dateStr);
    var mergeOne = rbMerge.value;
    var preset = selectedPresetName();
    if (!preset) {
        alert("请选择有效的 PDF 预设。", "导出 PDF");
        return;
    }
    var lastError = "";
    var exportedFiles = [];

    function withTempFolder(callback) {
        var temp = new Folder(destDir.fsName + "/__vt_pdf_tmp");
        if (!temp.exists) temp.create();
        clearFolder(temp);
        try {
            callback(temp);
        } finally {
            clearFolder(temp);
            try { temp.remove(); } catch (e) {}
        }
    }

    // Export for Screens names each file after its artboard, so match by name and
    // only fall back to output order when a name cannot be resolved.
    function takePdfForArtboard(pdfs, used, abName) {
        var wanted = sanitizeName(abName).toLowerCase();
        var i;
        for (i = 0; i < pdfs.length; i++) {
            if (used[i]) continue;
            var base = pdfs[i].name.replace(/\.[^\.]+$/, "");
            if (decodeURI(base).toLowerCase() === wanted) {
                used[i] = true;
                return pdfs[i];
            }
        }
        for (i = 0; i < pdfs.length; i++) {
            if (!used[i]) {
                used[i] = true;
                return pdfs[i];
            }
        }
        return null;
    }

    function exportSplit(workDoc, nameStem) {
        withTempFolder(function (temp) {
            exportScreens(workDoc, temp, targetIndices, preset);
            var pdfs = listPdfs(temp);
            var used = [];
            var i;
            for (i = 0; i < targetIndices.length; i++) {
                var idx = targetIndices[i];
                var abName = "Artboard_" + (idx + 1);
                try {
                    abName = workDoc.artboards[idx].name || abName;
                } catch (e) {}
                var src = takePdfForArtboard(pdfs, used, abName);
                if (!src) continue;
                var dest = new File(destDir.fsName + "/" + nameStem + "_" + pad2(idx + 1) + "_" + sanitizeName(abName) + ".pdf");
                if (moveFile(src, dest)) exportedFiles.push(dest);
            }
        });
    }

    function needsClone(outlined) {
        return outlined || mergeOne;
    }

    function exportOneSet(outlined, nameStem) {
        var clone = null;
        try {
            var workDoc = doc;
            if (needsClone(outlined)) {
                clone = makeClone();
                workDoc = clone.doc;
            }
            if (outlined) {
                outlineVisibleText(workDoc);
            }
            if (!mergeOne) {
                exportSplit(workDoc, nameStem);
            } else {
                if (!clone) {
                    throw new Error("合并导出未创建文档副本");
                }
                var dest = new File(destDir.fsName + "/" + nameStem + ".pdf");
                exportMergedBySaveAs(workDoc, dest, targetIndices, preset);
                if (dest.exists) exportedFiles.push(dest);
            }
        } finally {
            closeClone(clone);
        }
    }

    try {
        if (chkLive.value) {
            exportOneSet(false, stem);
        }
        if (chkOutline.value) {
            exportOneSet(true, stem + "_转曲");
        }
    } catch (exErr) {
        lastError = exErr.message || exErr.toString();
    }

    if (chkOpenFolder.value) {
        try { destDir.execute(); } catch (openErr) {}
    }

    if (exportedFiles.length === 0) {
        var errText = lastError ? ("PDF 失败: " + lastError) : "PDF 导出失败";
        alert(errText, "导出 PDF");
        return errText;
    }
    var totalBytes = 0;
    var exportedIndex;
    for (exportedIndex = 0; exportedIndex < exportedFiles.length; exportedIndex++) {
        totalBytes += exportedFiles[exportedIndex].length || 0;
    }
    var resultText = "✓ 已导出 " + exportedFiles.length + " 个 PDF，共 " + formatBytes(totalBytes);
    return dateStr ? (resultText + "（" + dateStr + "）") : resultText;
})();
