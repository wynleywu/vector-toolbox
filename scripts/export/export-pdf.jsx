/**
 * Vector Toolbox - Export PDF (导出 PDF)
 * Uses Export for Screens for artboard PDFs; merged/outlined variants run on a
 * disk copy of the document so the working document is never converted by saveAs
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

    function pickPreset(screen) {
        var preferred = screen
            ? ["[Smallest File Size]", "[最小文件大小]", "[Illustrator Default]", "[Illustrator 默认]"]
            : ["[High Quality Print]", "[高质量打印]", "[Press Quality]", "[印刷质量]", "[Illustrator Default]"];
        try {
            var list = app.PDFPresetsList;
            var j, i;
            for (j = 0; j < preferred.length; j++) {
                for (i = 0; i < list.length; i++) {
                    if (list[i] === preferred[j]) return list[i];
                }
            }
            if (list && list.length > 0) return list[0];
        } catch (e) {}
        return screen ? "[Smallest File Size]" : "[High Quality Print]";
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

    function exportScreens(workDoc, folder, indices, preset, wholeDocument) {
        var options = new ExportForScreensPDFOptions();
        options.pdfPreset = preset;
        var item = new ExportForScreensItemToExport();
        item.document = wholeDocument ? true : false;
        item.artboards = wholeDocument ? "" : toRangeString(indices);
        workDoc.exportForScreens(folder, ExportForScreensType.SE_PDF, options, item);
    }

    function exportMergedBySaveAs(workDoc, destFile, indices) {
        var opts = new PDFSaveOptions();
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

    var dlg = new Window("dialog", "导出 PDF - Vector Toolbox");
    dlg.orientation = "column";
    dlg.alignChildren = ["fill", "top"];
    dlg.spacing = 10;
    dlg.margins = 15;
    dlg.preferredSize.width = 420;

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
    rowQuality.add("statictext", undefined, "质量:");
    var ddlQuality = rowQuality.add("dropdownlist", undefined, ["印刷", "屏幕"]);
    ddlQuality.selection = 0;

    var chkLive = pnlOut.add("checkbox", undefined, "可编辑版（保持文字可改）");
    chkLive.value = true;
    var chkOutline = pnlOut.add("checkbox", undefined, "转曲版（文字转轮廓，不影响原稿）");
    chkOutline.value = false;

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

    function updatePreview() {
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
        var cloneNeeded = chkOutline.value || (rbMerge.value && currentIndices().length < artboards.length);
        if (cloneNeeded) {
            var unsaved = false;
            try { unsaved = !doc.saved; } catch (savedErr) {}
            text += unsaved
                ? "\n该组合需要文档副本，导出前会先保存当前文档。"
                : "\n该组合会用文档副本导出，原稿不受影响。";
        }
        lblPreview.text = text;
    }

    rbAll.onClick = updatePreview;
    rbActive.onClick = updatePreview;
    rbCustom.onClick = updatePreview;
    rbMerge.onClick = updatePreview;
    rbSplit.onClick = updatePreview;
    chkLive.onClick = updatePreview;
    chkOutline.onClick = updatePreview;
    chkDate.onClick = updatePreview;
    ddlDateFmt.onChange = updatePreview;
    edtName.onChanging = updatePreview;
    edtRange.onChanging = updatePreview;
    updatePreview();

    btnBrowse.onClick = function () {
        var sel = Folder.selectDialog("请选择 PDF 保存目录", new Folder(edtDest.text));
        if (sel) edtDest.text = sel.fsName;
    };

    var grpBtns = dlg.add("group");
    grpBtns.alignment = ["fill", "center"];
    grpBtns.add("button", undefined, "导出 PDF", { name: "ok" });
    grpBtns.add("button", undefined, "取消", { name: "cancel" });

    if (dlg.show() !== 1) {
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
    var screenQuality = ddlQuality.selection && ddlQuality.selection.index === 1;
    var preset = pickPreset(screenQuality);
    var lastError = "";
    var exported = 0;

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
            exportScreens(workDoc, temp, targetIndices, preset, false);
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
                if (moveFile(src, dest)) exported++;
            }
        });
    }

    // Whole-document Export for Screens already yields one multi-page PDF, which
    // avoids needing a clone for the common "all artboards" case.
    function exportMergedWholeDoc(workDoc, nameStem) {
        withTempFolder(function (temp) {
            exportScreens(workDoc, temp, targetIndices, preset, true);
            var pdfs = listPdfs(temp);
            if (pdfs.length === 0) {
                throw new Error("导出屏幕未生成 PDF 文件");
            }
            var dest = new File(destDir.fsName + "/" + nameStem + ".pdf");
            if (moveFile(pdfs[0], dest)) exported++;
        });
    }

    function needsClone(outlined) {
        if (outlined) return true;
        return mergeOne && targetIndices.length < artboards.length;
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
            } else if (clone) {
                var dest = new File(destDir.fsName + "/" + nameStem + ".pdf");
                exportMergedBySaveAs(workDoc, dest, targetIndices);
                exported++;
            } else {
                exportMergedWholeDoc(workDoc, nameStem);
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

    if (exported === 0) {
        var errText = lastError ? ("PDF 失败: " + lastError) : "PDF 导出失败";
        alert(errText, "导出 PDF");
        return errText;
    }
    return dateStr
        ? ("✓ 已导出 " + exported + " 个 PDF（" + dateStr + "）")
        : ("✓ 已导出 " + exported + " 个 PDF");
})();
