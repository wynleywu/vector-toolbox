/**
 * Vector Toolbox - Rename Artboards (画板重命名)
 * Batch renames all artboards with customized naming patterns and incremental counters
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
    var dlg = new Window("dialog", "画板重命名 - Vector Toolbox");
    dlg.orientation = "column";
    dlg.alignChildren = ["fill", "top"];
    dlg.spacing = 10;
    dlg.margins = 15;

    var pnlPattern = dlg.add("panel", undefined, "重命名规则");
    pnlPattern.orientation = "column";
    pnlPattern.alignChildren = ["fill", "top"];
    pnlPattern.spacing = 6;

    var rowBase = pnlPattern.add("group");
    rowBase.add("statictext", undefined, "前缀/基础名:");
    var edtBase = rowBase.add("edittext", undefined, "Artboard");
    edtBase.characters = 15;

    var rowFormat = pnlPattern.add("group");
    rowFormat.add("statictext", undefined, "序号格式:");
    var ddlFormat = rowFormat.add("dropdownlist", undefined, [
        "- 1, 2, 3...",
        "- 01, 02, 03...",
        "- 001, 002, 003...",
        "无序号"
    ]);
    ddlFormat.selection = 1;

    var rowStart = pnlPattern.add("group");
    rowStart.add("statictext", undefined, "起始序号:");
    var edtStart = rowStart.add("edittext", undefined, "1");
    edtStart.characters = 4;

    var grpBtns = dlg.add("group");
    grpBtns.alignment = ["fill", "center"];
    var btnOk = grpBtns.add("button", undefined, "执行重命名", { name: "ok" });
    var btnCancel = grpBtns.add("button", undefined, "取消", { name: "cancel" });

    if (dlg.show() !== 1) {
        return;
    }

    var baseName = edtBase.text;
    var formatIdx = ddlFormat.selection.index;
    var startNum = parseInt(edtStart.text, 10) || 1;

    function getNumberString(idx) {
        var num = startNum + idx;
        var s = "" + num;
        if (formatIdx === 0) return " " + s;
        if (formatIdx === 1) return " " + (s.length < 2 ? "0" + s : s);
        if (formatIdx === 2) {
            while (s.length < 3) s = "0" + s;
            return " " + s;
        }
        return "";
    }

    for (var i = 0; i < artboards.length; i++) {
        var newName = baseName + getNumberString(i);
        artboards[i].name = newName;
    }

    return "✓ 已重命名 " + artboards.length + " 个画板";
})();
