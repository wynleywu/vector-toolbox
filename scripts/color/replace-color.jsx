/**
 * Vector Toolbox - Replace Color (同色查找替换)
 * Finds specific colors and replaces them across the selection or active document
 */

#target illustrator

(function () {
    if (!app.documents || app.documents.length === 0) {
        alert("请先打开一个 Illustrator 文档！");
        return;
    }

    var doc = app.activeDocument;
    var itemsToProcess = doc.selection && doc.selection.length > 0 ? doc.selection : doc.pageItems;

    if (itemsToProcess.length === 0) {
        alert("文档中没有可处理的对象！");
        return;
    }

    // Helper: Hex to RGBColor
    function hexToRgb(hex) {
        hex = hex.replace(/^#/, "");
        if (hex.length === 3) {
            hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
        }
        if (hex.length !== 6) return null;
        var r = parseInt(hex.substring(0, 2), 16);
        var g = parseInt(hex.substring(2, 4), 16);
        var b = parseInt(hex.substring(4, 6), 16);
        var rgb = new RGBColor();
        rgb.red = r;
        rgb.green = g;
        rgb.blue = b;
        return rgb;
    }

    function isColorMatch(c, targetRgb) {
        if (!c || !targetRgb) return false;
        if (c.typename === "RGBColor") {
            return Math.abs(c.red - targetRgb.red) < 2 &&
                   Math.abs(c.green - targetRgb.green) < 2 &&
                   Math.abs(c.blue - targetRgb.blue) < 2;
        }
        return false;
    }

    // --- UI Dialog ---
    var dlg = new Window("dialog", "同色批量替换 - Vector Toolbox");
    dlg.orientation = "column";
    dlg.alignChildren = ["fill", "top"];
    dlg.spacing = 10;
    dlg.margins = 15;

    var pnlColors = dlg.add("panel", undefined, "颜色配置 (HEX 格式，如 #FF0000)");
    pnlColors.orientation = "column";
    pnlColors.alignChildren = ["fill", "top"];
    pnlColors.spacing = 8;

    var rowSource = pnlColors.add("group");
    rowSource.add("statictext", undefined, "原目标颜色 (HEX):");
    var edtSource = rowSource.add("edittext", undefined, "#000000");
    edtSource.characters = 10;

    var rowTarget = pnlColors.add("group");
    rowTarget.add("statictext", undefined, "替换新颜色 (HEX):");
    var edtTarget = rowTarget.add("edittext", undefined, "#FF5500");
    edtTarget.characters = 10;

    var pnlScope = dlg.add("panel", undefined, "替换范围");
    pnlScope.orientation = "column";
    pnlScope.alignChildren = ["fill", "top"];
    pnlScope.spacing = 6;

    var chkFill = pnlScope.add("checkbox", undefined, "替换填充色 (Fill Color)");
    chkFill.value = true;
    var chkStroke = pnlScope.add("checkbox", undefined, "替换描边色 (Stroke Color)");
    chkStroke.value = true;

    var lblScopeInfo = dlg.add("statictext", undefined, doc.selection.length > 0 ? "目标：当前选中对象 (" + doc.selection.length + " 个)" : "目标：当前文档所有图元");

    var grpBtns = dlg.add("group");
    grpBtns.alignment = ["fill", "center"];
    var btnOk = grpBtns.add("button", undefined, "开始替换", { name: "ok" });
    var btnCancel = grpBtns.add("button", undefined, "取消", { name: "cancel" });

    if (dlg.show() !== 1) {
        return;
    }

    var srcRgb = hexToRgb(edtSource.text);
    var dstRgb = hexToRgb(edtTarget.text);

    if (!srcRgb || !dstRgb) {
        alert("请输入有效的 6 位十六进制颜色格式（例如 #1A2B3C）！");
        return;
    }

    var doFill = chkFill.value;
    var doStroke = chkStroke.value;
    var replaceCount = 0;

    function processItem(item) {
        if (item.typename === "GroupItem") {
            for (var g = 0; g < item.pageItems.length; g++) {
                processItem(item.pageItems[g]);
            }
        } else if (item.typename === "PathItem" || item.typename === "CompoundPathItem") {
            var paths = item.typename === "CompoundPathItem" ? item.pathItems : [item];
            for (var p = 0; p < paths.length; p++) {
                var pi = paths[p];
                if (doFill && pi.filled && isColorMatch(pi.fillColor, srcRgb)) {
                    pi.fillColor = dstRgb;
                    replaceCount++;
                }
                if (doStroke && pi.stroked && isColorMatch(pi.strokeColor, srcRgb)) {
                    pi.strokeColor = dstRgb;
                    replaceCount++;
                }
            }
        } else if (item.typename === "TextFrame") {
            if (doFill && item.textRange && item.textRange.characterAttributes) {
                if (isColorMatch(item.textRange.characterAttributes.fillColor, srcRgb)) {
                    item.textRange.characterAttributes.fillColor = dstRgb;
                    replaceCount++;
                }
            }
        }
    }

    for (var i = 0; i < itemsToProcess.length; i++) {
        processItem(itemsToProcess[i]);
    }

    app.redraw();
    return "✓ 颜色替换完成，共修改 " + replaceCount + " 处颜色";
})();
