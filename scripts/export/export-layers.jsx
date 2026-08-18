/**
 * Vector Toolbox - Export Layers to Assets (按图层批量导出)
 * Exports top-level layers as separate PNG or SVG asset files
 */

#target illustrator

(function () {
    if (!app.documents || app.documents.length === 0) {
        alert("请先打开一个 Illustrator 文档！");
        return;
    }

    var doc = app.activeDocument;
    var layers = doc.layers;

    if (layers.length === 0) {
        alert("当前文档中没有图层！");
        return;
    }

    // --- UI Dialog ---
    var dlg = new Window("dialog", "按图层批量导出 - Vector Toolbox");
    dlg.orientation = "column";
    dlg.alignChildren = ["fill", "top"];
    dlg.spacing = 10;
    dlg.margins = 15;

    var pnlFormat = dlg.add("panel", undefined, "导出格式与分辨率");
    pnlFormat.orientation = "column";
    pnlFormat.alignChildren = ["fill", "top"];
    pnlFormat.spacing = 8;

    var rowFmt = pnlFormat.add("group");
    rowFmt.add("statictext", undefined, "格式:");
    var rbPng = rowFmt.add("radiobutton", undefined, "PNG-24");
    var rbSvg = rowFmt.add("radiobutton", undefined, "SVG");
    rbPng.value = true;

    var rowDpi = pnlFormat.add("group");
    rowDpi.add("statictext", undefined, "分辨率 (仅PNG):");
    var ddlDpi = rowDpi.add("dropdownlist", undefined, ["72 DPI (Web)", "150 DPI (普通)", "300 DPI (高清)"]);
    ddlDpi.selection = 2; // Default 300 DPI

    var chkVisibleOnly = dlg.add("checkbox", undefined, "仅导出当前可见的图层 (Visible Layers Only)");
    chkVisibleOnly.value = true;

    var grpBtns = dlg.add("group");
    grpBtns.alignment = ["fill", "center"];
    var btnOk = grpBtns.add("button", undefined, "选择输出目录并导出", { name: "ok" });
    var btnCancel = grpBtns.add("button", undefined, "取消", { name: "cancel" });

    if (dlg.show() !== 1) {
        return;
    }

    var destFolder = Folder.selectDialog("请选择图层切图输出目录");
    if (!destFolder) {
        return;
    }

    var isPng = rbPng.value;
    var dpiValues = [72, 150, 300];
    var dpi = dpiValues[ddlDpi.selection ? ddlDpi.selection.index : 2];
    var visibleOnly = chkVisibleOnly.value;

    // Record original layer visibility
    var origVisibility = [];
    for (var l = 0; l < layers.length; l++) {
        origVisibility.push(layers[l].visible);
    }

    var exportedCount = 0;
    var docName = doc.name.replace(/\.[^\.]+$/, "");

    try {
        for (var i = 0; i < layers.length; i++) {
            var layer = layers[i];
            if (visibleOnly && !origVisibility[i]) {
                continue;
            }

            // Hide all other layers, show only this one
            for (var j = 0; j < layers.length; j++) {
                layers[j].visible = (j === i);
            }

            var safeLayerName = layer.name.replace(/[\/\\:*?"<>|]/g, "_");
            var outPath = destFolder.fsName + "/" + docName + "_" + safeLayerName;

            if (isPng) {
                var pngFile = new File(outPath + ".png");
                var pngOpts = new ExportOptionsPNG24();
                pngOpts.antiAliasing = true;
                pngOpts.transparency = true;
                pngOpts.horizontalScale = (dpi / 72) * 100;
                pngOpts.verticalScale = (dpi / 72) * 100;
                doc.exportFile(pngFile, ExportType.PNG24, pngOpts);
                exportedCount++;
            } else {
                var svgFile = new File(outPath + ".svg");
                var svgOpts = new ExportOptionsSVG();
                svgOpts.embedRasterImages = true;
                doc.exportFile(svgFile, ExportType.SVG, svgOpts);
                exportedCount++;
            }
        }
    } finally {
        // Restore original layer visibility
        for (var k = 0; k < layers.length; k++) {
            layers[k].visible = origVisibility[k];
        }
    }

    app.redraw();
    return "✓ 已将 " + exportedCount + " 个图层导出至: " + destFolder.name;
})();
