/**
 * Vector Toolbox - Outline Text with Backup Layer (转曲并备份)
 */

#target illustrator

(function () {
    if (!app.documents || app.documents.length === 0) {
        alert("请先打开一个 Illustrator 文档！");
        return;
    }

    var doc = app.activeDocument;
    var BACKUP_NAME = "__原文字备份__";

    function layerNameOf(item) {
        try {
            return item.layer ? item.layer.name : "";
        } catch (e) {
            return "";
        }
    }

    function isHidden(item) {
        try {
            if (item.hidden) return true;
            if (item.layer && !item.layer.visible) return true;
        } catch (e) {}
        return false;
    }

    function isLocked(item) {
        try {
            if (item.locked) return true;
            if (item.layer && item.layer.locked) return true;
        } catch (e) {}
        return false;
    }

    function collectFromItems(items, into) {
        var i;
        for (i = 0; i < items.length; i++) {
            var item = items[i];
            try {
                if (item.typename === "TextFrame") {
                    into.push(item);
                } else if (item.typename === "GroupItem") {
                    collectFromItems(item.pageItems, into);
                }
            } catch (e) {}
        }
    }

    function eligible(tf, skipHiddenLocked) {
        if (layerNameOf(tf) === BACKUP_NAME) return false;
        if (skipHiddenLocked && isHidden(tf)) return false;
        if (skipHiddenLocked && isLocked(tf)) return false;
        return true;
    }

    var allFrames = [];
    var i;
    for (i = 0; i < doc.textFrames.length; i++) {
        allFrames.push(doc.textFrames[i]);
    }

    var selectedFrames = [];
    if (doc.selection && doc.selection.length > 0) {
        collectFromItems(doc.selection, selectedFrames);
    }

    var dlg = new Window("dialog", "转曲并备份 - Vector Toolbox");
    dlg.orientation = "column";
    dlg.alignChildren = ["fill", "top"];
    dlg.spacing = 10;
    dlg.margins = 15;

    var pnlScope = dlg.add("panel", undefined, "范围");
    pnlScope.orientation = "column";
    pnlScope.alignChildren = ["left", "top"];
    pnlScope.spacing = 6;
    var rbSel = pnlScope.add("radiobutton", undefined, "当前选区（" + selectedFrames.length + " 个文本）");
    var rbAll = pnlScope.add("radiobutton", undefined, "全部可见文本");
    if (selectedFrames.length > 0) {
        rbSel.value = true;
    } else {
        rbSel.enabled = false;
        rbAll.value = true;
    }

    var chkBackup = dlg.add("checkbox", undefined, "备份到隐藏图层「" + BACKUP_NAME + "」");
    chkBackup.value = true;
    var chkSkip = dlg.add("checkbox", undefined, "跳过隐藏 / 锁定对象");
    chkSkip.value = true;

    var lblSummary = dlg.add("statictext", undefined, "", { multiline: true });
    lblSummary.preferredSize.height = 32;

    function countEligible() {
        var list = rbSel.value ? selectedFrames : allFrames;
        var n = 0;
        var k;
        for (k = 0; k < list.length; k++) {
            if (eligible(list[k], chkSkip.value)) n++;
        }
        return n;
    }

    function updateSummary() {
        var n = countEligible();
        if (n === 0) {
            lblSummary.text = "没有可转曲的文本。";
            return;
        }
        var extra = chkBackup.value ? "，并备份到隐藏图层。二次运行不会重复备份已在备份层的文字。" : "，不备份原稿。";
        lblSummary.text = "将转曲 " + n + " 个文本框" + extra;
    }

    rbSel.onClick = updateSummary;
    rbAll.onClick = updateSummary;
    chkBackup.onClick = updateSummary;
    chkSkip.onClick = updateSummary;
    updateSummary();

    var grpBtns = dlg.add("group");
    grpBtns.alignment = ["fill", "center"];
    grpBtns.add("button", undefined, "转曲", { name: "ok" });
    grpBtns.add("button", undefined, "取消", { name: "cancel" });

    if (dlg.show() !== 1) {
        return;
    }

    var useSel = rbSel.value;
    var doBackup = chkBackup.value;
    var skipHiddenLocked = chkSkip.value;
    var list = useSel ? selectedFrames : allFrames;

    var backupLayer = null;
    if (doBackup) {
        try {
            backupLayer = doc.layers.getByName(BACKUP_NAME);
        } catch (e) {
            backupLayer = doc.layers.add();
            backupLayer.name = BACKUP_NAME;
        }
        backupLayer.visible = true;
        backupLayer.locked = false;
    }

    var outlinedCount = 0;
    var skippedHidden = 0;
    var skippedLocked = 0;
    var failed = 0;
    var k;

    for (k = list.length - 1; k >= 0; k--) {
        var tf = list[k];
        if (layerNameOf(tf) === BACKUP_NAME) continue;
        if (skipHiddenLocked && isHidden(tf)) {
            skippedHidden++;
            continue;
        }
        if (skipHiddenLocked && isLocked(tf)) {
            skippedLocked++;
            continue;
        }
        try {
            if (doBackup && backupLayer) {
                tf.duplicate(backupLayer, ElementPlacement.PLACEATBEGINNING);
            }
            tf.createOutline();
            outlinedCount++;
        } catch (e) {
            failed++;
        }
    }

    if (backupLayer) {
        backupLayer.visible = false;
        backupLayer.locked = true;
    }
    app.redraw();

    if (outlinedCount === 0) {
        return "ℹ 没有可转曲的文本";
    }
    var extra = [];
    if (skippedHidden > 0) extra.push("跳过隐藏 " + skippedHidden);
    if (skippedLocked > 0) extra.push("跳过锁定 " + skippedLocked);
    if (failed > 0) extra.push("失败 " + failed);
    var suffix = extra.length > 0 ? "（" + extra.join("，") + "）" : "";
    var backupMsg = doBackup ? "，原稿已备份" : "";
    return "✓ 已将 " + outlinedCount + " 个文本转曲" + backupMsg + suffix;
})();
