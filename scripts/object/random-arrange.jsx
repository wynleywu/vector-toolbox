/**
 * Vector Toolbox - Random Arrange & Scatter (随机排列)
 * Applies random rotation, scaling, and position jitter to selected objects
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
        alert("请先选择需要随机排列的对象！");
        return;
    }

    // --- UI Dialog ---
    var dlg = new Window("dialog", "随机排列 - Vector Toolbox");
    dlg.orientation = "column";
    dlg.alignChildren = ["fill", "top"];
    dlg.spacing = 10;
    dlg.margins = 15;

    // Rotation Panel
    var pnlRot = dlg.add("panel", undefined, "随机旋转");
    pnlRot.orientation = "row";
    pnlRot.spacing = 8;
    var chkRot = pnlRot.add("checkbox", undefined, "启用");
    chkRot.value = true;
    pnlRot.add("statictext", undefined, "角度范围:");
    var edtMinRot = pnlRot.add("edittext", undefined, "-45");
    edtMinRot.characters = 4;
    pnlRot.add("statictext", undefined, "° 至");
    var edtMaxRot = pnlRot.add("edittext", undefined, "45");
    edtMaxRot.characters = 4;
    pnlRot.add("statictext", undefined, "°");

    // Scale Panel
    var pnlScale = dlg.add("panel", undefined, "随机缩放");
    pnlScale.orientation = "row";
    pnlScale.spacing = 8;
    var chkScale = pnlScale.add("checkbox", undefined, "启用");
    chkScale.value = true;
    pnlScale.add("statictext", undefined, "缩放范围:");
    var edtMinScale = pnlScale.add("edittext", undefined, "80");
    edtMinScale.characters = 4;
    pnlScale.add("statictext", undefined, "% 至");
    var edtMaxScale = pnlScale.add("edittext", undefined, "120");
    edtMaxScale.characters = 4;
    pnlScale.add("statictext", undefined, "%");

    // Jitter Panel
    var pnlJitter = dlg.add("panel", undefined, "随机位移抖动 (pt)");
    pnlJitter.orientation = "row";
    pnlJitter.spacing = 8;
    var chkJitter = pnlJitter.add("checkbox", undefined, "启用");
    chkJitter.value = false;
    pnlJitter.add("statictext", undefined, "最大位移 ±");
    var edtJitter = pnlJitter.add("edittext", undefined, "15");
    edtJitter.characters = 4;
    pnlJitter.add("statictext", undefined, "pt");

    // Buttons
    var grpBtns = dlg.add("group");
    grpBtns.alignment = ["fill", "center"];
    var btnOk = grpBtns.add("button", undefined, "应用随机变换", { name: "ok" });
    var btnCancel = grpBtns.add("button", undefined, "取消", { name: "cancel" });

    if (dlg.show() !== 1) {
        return;
    }

    var doRot = chkRot.value;
    var minRot = parseFloat(edtMinRot.text) || 0;
    var maxRot = parseFloat(edtMaxRot.text) || 0;

    var doScale = chkScale.value;
    var minScale = parseFloat(edtMinScale.text) || 100;
    var maxScale = parseFloat(edtMaxScale.text) || 100;

    var doJitter = chkJitter.value;
    var maxJitter = parseFloat(edtJitter.text) || 0;

    function randRange(min, max) {
        return min + Math.random() * (max - min);
    }

    for (var i = 0; i < sel.length; i++) {
        var item = sel[i];

        // 1. Rotation
        if (doRot && minRot !== maxRot) {
            var angle = randRange(minRot, maxRot);
            item.rotate(angle, true, true, true, true, Transformation.CENTER);
        }

        // 2. Scaling
        if (doScale && minScale !== maxScale) {
            var sc = randRange(minScale, maxScale);
            item.resize(sc, sc, true, true, true, true, sc, Transformation.CENTER);
        }

        // 3. Jitter
        if (doJitter && maxJitter > 0) {
            var dx = randRange(-maxJitter, maxJitter);
            var dy = randRange(-maxJitter, maxJitter);
            item.translate(dx, dy);
        }
    }

    app.redraw();
    return "✓ 已对 " + sel.length + " 个对象完成随机变换";
})();
