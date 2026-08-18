/**
 * Vector Toolbox - Close Open Paths (闭合开放路径)
 * Scans selected objects and connects/closes all open vector path segments
 */

#target illustrator

(function () {
    if (!app.documents || app.documents.length === 0) {
        return "⚠ 无打开的文档";
    }

    var doc = app.activeDocument;
    var targets = doc.selection && doc.selection.length > 0 ? doc.selection : doc.pathItems;

    if (targets.length === 0) {
        return "ℹ 当前选区或文档中没有找到路径对象";
    }

    var closedCount = 0;

    function processItem(item) {
        if (item.typename === "PathItem") {
            if (!item.closed && item.pathPoints && item.pathPoints.length > 1) {
                item.closed = true;
                closedCount++;
            }
        } else if (item.typename === "CompoundPathItem") {
            for (var c = 0; c < item.pathItems.length; c++) {
                processItem(item.pathItems[c]);
            }
        } else if (item.typename === "GroupItem") {
            for (var g = 0; g < item.pageItems.length; g++) {
                processItem(item.pageItems[g]);
            }
        }
    }

    for (var i = 0; i < targets.length; i++) {
        processItem(targets[i]);
    }

    app.redraw();
    if (closedCount > 0) {
        return "✓ 成功闭合 " + closedCount + " 条开放路径";
    } else {
        return "ℹ 选区内所有路径均已处于闭合状态";
    }
})();
