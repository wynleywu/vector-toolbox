/**
 * Vector Toolbox - Batch Text Replace (跨画板文本批量替换)
 * Finds and replaces text across text frames in selection or entire document
 */

#target illustrator

(function () {
    if (!app.documents || app.documents.length === 0) {
        alert("请先打开一个 Illustrator 文档！");
        return;
    }

    var doc = app.activeDocument;
    var targetFrames = [];

    if (doc.selection && doc.selection.length > 0) {
        for (var s = 0; s < doc.selection.length; s++) {
            var item = doc.selection[s];
            if (item.typename === "TextFrame") {
                targetFrames.push(item);
            }
        }
    }

    // If no textframe in selection, target all text frames in document
    if (targetFrames.length === 0) {
        for (var t = 0; t < doc.textFrames.length; t++) {
            targetFrames.push(doc.textFrames[t]);
        }
    }

    if (targetFrames.length === 0) {
        alert("文档中未找到任何文本对象！");
        return;
    }

    // --- UI Dialog ---
    var dlg = new Window("dialog", "批量文本替换 - Vector Toolbox");
    dlg.orientation = "column";
    dlg.alignChildren = ["fill", "top"];
    dlg.spacing = 10;
    dlg.margins = 15;

    var pnlInput = dlg.add("panel", undefined, "查找与替换内容");
    pnlInput.orientation = "column";
    pnlInput.alignChildren = ["fill", "top"];
    pnlInput.spacing = 8;

    var rowFind = pnlInput.add("group");
    rowFind.add("statictext", undefined, "查找文字:");
    var edtFind = rowFind.add("edittext", undefined, "");
    edtFind.characters = 20;

    var rowReplace = pnlInput.add("group");
    rowReplace.add("statictext", undefined, "替换为  :");
    var edtReplace = rowReplace.add("edittext", undefined, "");
    edtReplace.characters = 20;

    var chkMatchCase = dlg.add("checkbox", undefined, "区分大小写 (Match Case)");
    chkMatchCase.value = false;

    var lblScope = dlg.add("statictext", undefined, "处理目标: " + targetFrames.length + " 个文本框");

    var grpBtns = dlg.add("group");
    grpBtns.alignment = ["fill", "center"];
    var btnOk = grpBtns.add("button", undefined, "全部替换", { name: "ok" });
    var btnCancel = grpBtns.add("button", undefined, "取消", { name: "cancel" });

    if (dlg.show() !== 1) {
        return;
    }

    var findStr = edtFind.text;
    var replaceStr = edtReplace.text;

    if (!findStr || findStr.length === 0) {
        alert("请输入要查找的文本！");
        return;
    }

    var matchCase = chkMatchCase.value;
    var count = 0;

    for (var i = 0; i < targetFrames.length; i++) {
        var tf = targetFrames[i];
        var content = tf.contents;
        if (!content) continue;

        if (matchCase) {
            if (content.indexOf(findStr) !== -1) {
                tf.contents = content.split(findStr).join(replaceStr);
                count++;
            }
        } else {
            var lowerContent = content.toLowerCase();
            var lowerFind = findStr.toLowerCase();
            if (lowerContent.indexOf(lowerFind) !== -1) {
                // Case-insensitive replace
                var regex = new RegExp(findStr.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1"), "gi");
                tf.contents = content.replace(regex, replaceStr);
                count++;
            }
        }
    }

    app.redraw();
    return "✓ 替换完成，已更新 " + count + " 个文本对象";
})();
