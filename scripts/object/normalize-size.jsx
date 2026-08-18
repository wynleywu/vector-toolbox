/**
 * Vector Toolbox - Normalize Object Sizes (统一尺寸)
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
        alert("请先选择需要统一尺寸的对象！");
        return;
    }

    var PT_PER_MM = 72 / 25.4;
    var PT_PER_INCH = 72;

    function toPoints(val, unit) {
        var num = parseFloat(val) || 0;
        switch (("" + unit).toLowerCase()) {
            case "mm": return num * PT_PER_MM;
            case "cm": return num * PT_PER_MM * 10;
            case "in":
            case "inch": return num * PT_PER_INCH;
            default: return num;
        }
    }

    function fromPoints(points, unit) {
        var num = parseFloat(points) || 0;
        switch (("" + unit).toLowerCase()) {
            case "mm": return num / PT_PER_MM;
            case "cm": return (num / PT_PER_MM) / 10;
            case "in":
            case "inch": return num / PT_PER_INCH;
            default: return num;
        }
    }

    function round2(n) {
        return Math.round(n * 100) / 100;
    }

    var sizes = [];
    var i;
    for (i = 0; i < sel.length; i++) {
        try {
            if (sel[i].width > 0 && sel[i].height > 0) {
                sizes.push({ item: sel[i], w: sel[i].width, h: sel[i].height });
            }
        } catch (e) {}
    }

    if (sizes.length === 0) {
        alert("选区里没有可量尺寸的对象！");
        return;
    }

    var minW = sizes[0].w;
    var maxW = sizes[0].w;
    var minH = sizes[0].h;
    var maxH = sizes[0].h;
    for (i = 1; i < sizes.length; i++) {
        if (sizes[i].w < minW) minW = sizes[i].w;
        if (sizes[i].w > maxW) maxW = sizes[i].w;
        if (sizes[i].h < minH) minH = sizes[i].h;
        if (sizes[i].h > maxH) maxH = sizes[i].h;
    }

    var units = ["mm", "px", "pt", "cm", "inch"];
    var currentUnit = "mm";

    var dlg = new Window("dialog", "统一尺寸 - Vector Toolbox");
    dlg.orientation = "column";
    dlg.alignChildren = ["fill", "top"];
    dlg.spacing = 10;
    dlg.margins = 15;

    var lblSummary = dlg.add("statictext", undefined, "", { multiline: true });
    lblSummary.preferredSize.height = 28;

    function fmt(pt) {
        return round2(fromPoints(pt, currentUnit));
    }

    function updateSummary() {
        lblSummary.text = "已选 " + sizes.length + " 个 · 宽 " +
            fmt(minW) + "–" + fmt(maxW) + " " + currentUnit +
            " · 高 " + fmt(minH) + "–" + fmt(maxH) + " " + currentUnit;
    }

    var pnlMode = dlg.add("panel", undefined, "对齐基准");
    pnlMode.orientation = "column";
    pnlMode.alignChildren = ["left", "top"];
    pnlMode.spacing = 6;
    var rbWidth = pnlMode.add("radiobutton", undefined, "统一宽度");
    var rbHeight = pnlMode.add("radiobutton", undefined, "统一高度");
    var rbFit = pnlMode.add("radiobutton", undefined, "等比适配最长边");
    rbWidth.value = true;

    var pnlSrc = dlg.add("panel", undefined, "目标来源");
    pnlSrc.orientation = "column";
    pnlSrc.alignChildren = ["left", "top"];
    pnlSrc.spacing = 4;
    var rbVal = pnlSrc.add("radiobutton", undefined, "指定数值");
    var rbFirst = pnlSrc.add("radiobutton", undefined, "第一个选中对象");
    var rbMaxW = pnlSrc.add("radiobutton", undefined, "选区最大宽");
    var rbMaxH = pnlSrc.add("radiobutton", undefined, "选区最大高");
    rbVal.value = true;

    var pnlSize = dlg.add("panel", undefined, "目标尺寸与单位");
    pnlSize.orientation = "row";
    pnlSize.spacing = 10;
    pnlSize.add("statictext", undefined, "目标数值:");
    var edtVal = pnlSize.add("edittext", undefined, "" + fmt(sizes[0].w));
    edtVal.characters = 8;
    pnlSize.add("statictext", undefined, "单位:");
    var ddlUnit = pnlSize.add("dropdownlist", undefined, units);
    ddlUnit.selection = 0;

    var chkProportional = dlg.add("checkbox", undefined, "保持宽高比");
    chkProportional.value = true;

    var pnlAnchor = dlg.add("panel", undefined, "对齐点");
    pnlAnchor.orientation = "row";
    var rbCenter = pnlAnchor.add("radiobutton", undefined, "中心");
    var rbTopLeft = pnlAnchor.add("radiobutton", undefined, "左上");
    var rbBottom = pnlAnchor.add("radiobutton", undefined, "底边中点");
    rbCenter.value = true;

    function applySourceToField() {
        if (rbFirst.value) {
            var ref = rbHeight.value ? sizes[0].h : sizes[0].w;
            if (rbFit.value) ref = Math.max(sizes[0].w, sizes[0].h);
            edtVal.text = "" + fmt(ref);
        } else if (rbMaxW.value) {
            edtVal.text = "" + fmt(maxW);
        } else if (rbMaxH.value) {
            edtVal.text = "" + fmt(maxH);
        }
        edtVal.enabled = rbVal.value;
    }

    function syncFitLock() {
        if (rbFit.value) {
            chkProportional.value = true;
            chkProportional.enabled = false;
        } else {
            chkProportional.enabled = true;
        }
        applySourceToField();
    }

    rbWidth.onClick = applySourceToField;
    rbHeight.onClick = applySourceToField;
    rbFit.onClick = syncFitLock;
    rbVal.onClick = applySourceToField;
    rbFirst.onClick = applySourceToField;
    rbMaxW.onClick = applySourceToField;
    rbMaxH.onClick = applySourceToField;

    ddlUnit.onChange = function () {
        var oldUnit = currentUnit;
        var newUnit = ddlUnit.selection ? ddlUnit.selection.text : "mm";
        var pt = toPoints(edtVal.text, oldUnit);
        currentUnit = newUnit;
        edtVal.text = "" + fmt(pt);
        updateSummary();
        applySourceToField();
    };

    updateSummary();

    var grpBtns = dlg.add("group");
    grpBtns.alignment = ["fill", "center"];
    grpBtns.add("button", undefined, "开始调整", { name: "ok" });
    grpBtns.add("button", undefined, "取消", { name: "cancel" });

    if (dlg.show() !== 1) {
        return;
    }

    var unit = ddlUnit.selection ? ddlUnit.selection.text : "mm";
    var targetPt = toPoints(edtVal.text, unit);
    if (rbFirst.value) {
        targetPt = rbHeight.value ? sizes[0].h : sizes[0].w;
        if (rbFit.value) targetPt = Math.max(sizes[0].w, sizes[0].h);
    } else if (rbMaxW.value) {
        targetPt = maxW;
    } else if (rbMaxH.value) {
        targetPt = maxH;
    }

    if (targetPt <= 0) {
        alert("请输入大于 0 的有效尺寸！");
        return;
    }

    var isKeepRatio = rbFit.value ? true : chkProportional.value;
    var anchor = Transformation.CENTER;
    if (rbTopLeft.value) anchor = Transformation.TOPLEFT;
    if (rbBottom.value) anchor = Transformation.BOTTOM;

    var changed = 0;
    var skipped = 0;
    for (i = 0; i < sizes.length; i++) {
        var curW = sizes[i].w;
        var curH = sizes[i].h;
        var scaleX = 100;
        var scaleY = 100;

        if (rbWidth.value) {
            scaleX = (targetPt / curW) * 100;
            scaleY = isKeepRatio ? scaleX : 100;
        } else if (rbHeight.value) {
            scaleY = (targetPt / curH) * 100;
            scaleX = isKeepRatio ? scaleY : 100;
        } else {
            var maxSide = Math.max(curW, curH);
            var scale = (targetPt / maxSide) * 100;
            scaleX = scale;
            scaleY = scale;
        }

        try {
            sizes[i].item.resize(scaleX, scaleY, true, true, true, true, true, anchor);
            changed++;
        } catch (resizeErr) {
            skipped++;
        }
    }

    app.redraw();
    if (changed === 0) {
        return "ℹ 没有对象被调整";
    }
    var skipMsg = skipped > 0 ? "，跳过 " + skipped + " 个" : "";
    return "✓ 已统一 " + changed + " 个对象的尺寸" + skipMsg;
})();
