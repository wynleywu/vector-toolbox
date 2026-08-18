/**
 * Vector Toolbox - Batch Export Artboards (批量导出)
 * Exports all artboards to PNG-24, SVG, or PDF
 */

#target illustrator

(function () {
    if (!app.documents || app.documents.length === 0) {
        alert("请先打开一个 Illustrator 文档！");
        return;
    }

    var doc = app.activeDocument;
    var artboards = doc.artboards;
    if (artboards.length === 0) {
        alert("当前文档没有画板！");
        return;
    }

    // --- UI Dialog ---
    var dlg = new Window("dialog", "批量导出画板 - Vector Toolbox");
    dlg.orientation = "column";
    dlg.alignChildren = ["fill", "top"];
    dlg.spacing = 10;
    dlg.margins = 15;

    // Export Format Panel
    var pnlFmt = dlg.add("panel", undefined, "导出格式与质量");
    pnlFmt.orientation = "column";
    pnlFmt.alignChildren = ["fill", "top"];
    pnlFmt.spacing = 6;

    var rowFmt = pnlFmt.add("group");
    rowFmt.add("statictext", undefined, "格式:");
    var ddlFmt = rowFmt.add("dropdownlist", undefined, ["PNG-24 (透明/高清)", "SVG (矢量网格)", "PDF (矢量印刷)"]);
    ddlFmt.selection = 0;

    var rowDpi = pnlFmt.add("group");
    rowDpi.add("statictext", undefined, "分辨率 (仅PNG):");
    var ddlDpi = rowDpi.add("dropdownlist", undefined, ["72 DPI (屏幕)", "150 DPI (中等)", "300 DPI (高清印刷)"]);
    ddlDpi.selection = 2;

    // Folder Selector Panel
    var pnlFolder = dlg.add("panel", undefined, "目标输出文件夹");
    pnlFolder.orientation = "row";
    pnlFolder.spacing = 6;

    var targetFolder = doc.path.exists ? doc.path : Folder.desktop;
    var edtFolder = pnlFolder.add("edittext", undefined, targetFolder.fsName);
    edtFolder.characters = 20;
    var btnBrowse = pnlFolder.add("button", undefined, "浏览...");

    btnBrowse.onClick = function () {
        var sel = Folder.selectDialog("请选择导出文件保存目录", targetFolder);
        if (sel) {
            targetFolder = sel;
            edtFolder.text = sel.fsName;
        }
    };

    // Buttons
    var grpBtns = dlg.add("group");
    grpBtns.alignment = ["fill", "center"];
    var btnOk = grpBtns.add("button", undefined, "开始导出", { name: "ok" });
    var btnCancel = grpBtns.add("button", undefined, "取消", { name: "cancel" });

    if (dlg.show() !== 1) {
        return;
    }

    var destDir = new Folder(edtFolder.text);
    if (!destDir.exists) {
        destDir.create();
    }

    var fmtIdx = ddlFmt.selection.index; // 0: PNG, 1: SVG, 2: PDF
    var dpiVal = fmtIdx === 0 ? [72, 150, 300][ddlDpi.selection.index] : 300;

    var exportedCount = 0;
    var docBaseName = doc.name.replace(/\.[^\.]+$/, "");

    for (var i = 0; i < artboards.length; i++) {
        var ab = artboards[i];
        doc.artboards.setActiveArtboardIndex(i);
        var abName = ab.name || ("Artboard_" + (i + 1));
        var outFileName = docBaseName + "_" + abName;

        if (fmtIdx === 0) {
            // PNG-24
            var pngFile = new File(destDir.fsName + "/" + outFileName + ".png");
            var pngOpts = new ExportOptionsPNG24();
            pngOpts.antiAliasing = true;
            pngOpts.transparency = true;
            pngOpts.artBoardClipping = true;
            pngOpts.horizontalScale = (dpiVal / 72) * 100;
            pngOpts.verticalScale = (dpiVal / 72) * 100;

            doc.exportFile(pngFile, ExportType.PNG24, pngOpts);
            exportedCount++;
        } else if (fmtIdx === 1) {
            // SVG
            var svgFile = new File(destDir.fsName + "/" + outFileName + ".svg");
            var svgOpts = new ExportOptionsSVG();
            svgOpts.embedRasterImages = true;
            svgOpts.fontSubsetting = SVGFontSubsetting.GLYPHSUSED;

            doc.exportFile(svgFile, ExportType.SVG, svgOpts);
            exportedCount++;
        } else if (fmtIdx === 2) {
            // PDF
            var pdfFile = new File(destDir.fsName + "/" + outFileName + ".pdf");
            var pdfOpts = new PDFSaveOptions();
            pdfOpts.artboardRange = "" + (i + 1);

            doc.saveAs(pdfFile, pdfOpts);
            exportedCount++;
        }
    }

    return "✓ 已成功导出 " + exportedCount + " 个画板至 " + destDir.fsName;
})();
