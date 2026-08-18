/**
 * Vector Toolbox - Batch Rename Objects (批量重命名)
 * Renames selected objects with prefix, suffix, incremental counter, or find/replace
 */

#target illustrator

(function () {
    if (!app.documents || app.documents.length === 0) {
        alert("请先打开一个 Illustrator 文档！");
        return;
    }

    var doc = app.activeDocument;
    var sel = doc.selection;
    if (!sel || sel.length === 0) {
        alert("请先选择要重命名的对象！");
        return;
    }

    // --- UI Dialog ---
    var dlg = new Window("dialog", "批量重命名 - Vector Toolbox");
    dlg.orientation = "column";
    dlg.alignChildren = ["fill", "top"];
    dlg.spacing = 10;
    dlg.margins = 15;

    // Pattern Panel
    var pnlPattern = dlg.add("panel", undefined, "命名规则");
    pnlPattern.orientation = "column";
    pnlPattern.alignChildren = ["fill", "top"];
    pnlPattern.spacing = 6;

    var rowName = pnlPattern.add("group");
    rowName.add("statictext", undefined, "基础名称:");
    var edtBaseName = rowName.add("edittext", undefined, "Item");
    edtBaseName.characters = 15;

    var rowPreSuf = pnlPattern.add("group");
    rowPreSuf.add("statictext", undefined, "前缀:");
    var edtPrefix = rowPreSuf.add("edittext", undefined, "");
    edtPrefix.characters = 6;
    rowPreSuf.add("statictext", undefined, "后缀:");
    var edtSuffix = rowPreSuf.add("edittext", undefined, "");
    edtSuffix.characters = 6;

    var rowNumbering = pnlPattern.add("group");
    var chkNumbering = rowNumbering.add("checkbox", undefined, "启用数字序号");
    chkNumbering.value = true;
    rowNumbering.add("statictext", undefined, "位数:");
    var ddlDigits = rowNumbering.add("dropdownlist", undefined, ["1, 2, 3...", "01, 02, 03...", "001, 002..."]);
    ddlDigits.selection = 1;
    rowNumbering.add("statictext", undefined, "起始:");
    var edtStart = rowNumbering.add("edittext", undefined, "1");
    edtStart.characters = 4;

    // Find and Replace Panel
    var pnlReplace = dlg.add("panel", undefined, "查找与替换（可选）");
    pnlReplace.orientation = "column";
    pnlReplace.alignChildren = ["fill", "top"];
    pnlReplace.spacing = 6;

    var rowFind = pnlReplace.add("group");
    rowFind.add("statictext", undefined, "查找:");
    var edtFind = rowFind.add("edittext", undefined, "");
    edtFind.characters = 10;
    rowFind.add("statictext", undefined, "替换为:");
    var edtReplace = rowFind.add("edittext", undefined, "");
    edtReplace.characters = 10;

    // Buttons
    var grpBtns = dlg.add("group");
    grpBtns.alignment = ["fill", "center"];
    var btnOk = grpBtns.add("button", undefined, "执行重命名", { name: "ok" });
    var btnCancel = grpBtns.add("button", undefined, "取消", { name: "cancel" });

    if (dlg.show() !== 1) {
        return;
    }

    var baseName = edtBaseName.text;
    var prefix = edtPrefix.text;
    var suffix = edtSuffix.text;
    var useNum = chkNumbering.value;
    var digitMode = ddlDigits.selection.index; // 0: 1, 1: 01, 2: 001
    var startIdx = parseInt(edtStart.text, 10) || 1;
    var findText = edtFind.text;
    var repText = edtReplace.text;

    function formatNumber(num, mode) {
        var s = "" + num;
        if (mode === 1) { // 01
            return s.length < 2 ? "0" + s : s;
        } else if (mode === 2) { // 001
            while (s.length < 3) s = "0" + s;
            return s;
        }
        return s;
    }

    for (var i = 0; i < sel.length; i++) {
        var item = sel[i];
        var finalName = "";

        if (findText.length > 0) {
            // Find and replace mode on existing name
            var oldName = item.name || ("Item_" + (i + 1));
            finalName = oldName.split(findText).join(repText);
        } else {
            // Pattern mode
            var numStr = useNum ? ("_" + formatNumber(startIdx + i, digitMode)) : "";
            finalName = prefix + baseName + numStr + suffix;
        }

        item.name = finalName;
    }

    return "✓ 已重命名 " + sel.length + " 个对象";
})();
