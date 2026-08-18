/**
 * Vector Toolbox - Arrange Artboards in Grid (排列画板)
 * Rearranges all artboards in a clean grid with configurable columns and spacing
 */

#target illustrator

(function () {
    if (!app.documents || app.documents.length === 0) {
        alert("请先打开一个 Illustrator 文档！");
        return;
    }

    var doc = app.activeDocument;
    var artboards = doc.artboards;
    if (artboards.length <= 1) {
        alert("文档中至少需要 2 个画板进行重排！");
        return;
    }

    var PT_PER_MM = 72 / 25.4;

    // --- UI Dialog ---
    var dlg = new Window("dialog", "排列画板 - Vector Toolbox");
    dlg.orientation = "column";
    dlg.alignChildren = ["fill", "top"];
    dlg.spacing = 10;
    dlg.margins = 15;

    var pnlGrid = dlg.add("panel", undefined, "网格参数");
    pnlGrid.orientation = "column";
    pnlGrid.alignChildren = ["fill", "top"];
    pnlGrid.spacing = 8;

    var rowCols = pnlGrid.add("group");
    rowCols.add("statictext", undefined, "每行列数 (Columns):");
    var edtCols = rowCols.add("edittext", undefined, "4");
    edtCols.characters = 4;

    var rowSpacing = pnlGrid.add("group");
    rowSpacing.add("statictext", undefined, "画板间距 (mm):");
    var edtSpacing = rowSpacing.add("edittext", undefined, "20");
    edtSpacing.characters = 4;

    var chkMoveArt = dlg.add("checkbox", undefined, "同时移动画板上的图元内容");
    chkMoveArt.value = true;

    var grpBtns = dlg.add("group");
    grpBtns.alignment = ["fill", "center"];
    var btnOk = grpBtns.add("button", undefined, "重新排列", { name: "ok" });
    var btnCancel = grpBtns.add("button", undefined, "取消", { name: "cancel" });

    if (dlg.show() !== 1) {
        return;
    }

    var cols = parseInt(edtCols.text, 10) || 4;
    var spacingPt = (parseFloat(edtSpacing.text) || 20) * PT_PER_MM;
    var moveContent = chkMoveArt.value;

    try {
        // Illustrator built-in rearrangeArtboards API
        // Document.rearrangeArtboards(artboardLayout, rowsOrCols, spacing, moveArtwork)
        // Layout: GridByRow = 1, GridByCol = 2, Row = 3, Col = 4
        doc.rearrangeArtboards(DocumentArtboardLayout.GridByRow, cols, spacingPt, moveContent);
        app.redraw();
        return "✓ 已将 " + artboards.length + " 个画板重排为 " + cols + " 列网格";
    } catch (e) {
        alert("排列画板失败: " + e.message);
    }
})();
