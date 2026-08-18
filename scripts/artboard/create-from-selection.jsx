/**
 * Vector Toolbox - Create Artboards from Selection (选区生成画板)
 * Creates new artboards fitted to current selection with optional margin
 */

#target illustrator

(function () {
    if (!app.documents || app.documents.length === 0) {
        return "⚠ 无打开的文档";
    }

    var doc = app.activeDocument;
    var sel = doc.selection;
    if (!sel || sel.length === 0) {
        return "⚠ 请先选择需要生成画板的对象";
    }

    var MARGIN_PT = 20; // Default margin around bounds

    // Calculate combined bounding box of selection
    var l = Infinity, t = -Infinity, r = -Infinity, b = Infinity;

    for (var i = 0; i < sel.length; i++) {
        var box = sel[i].visibleBounds; // [left, top, right, bottom]
        if (box[0] < l) l = box[0];
        if (box[1] > t) t = box[1];
        if (box[2] > r) r = box[2];
        if (box[3] < b) b = box[3];
    }

    var abRect = [
        l - MARGIN_PT,
        t + MARGIN_PT,
        r + MARGIN_PT,
        b - MARGIN_PT
    ];

    var newAb = doc.artboards.add(abRect);
    newAb.name = "Artboard_" + doc.artboards.length;

    app.redraw();
    return "✓ 已根据选区创建新画板 (包含 " + MARGIN_PT + "pt 边距)";
})();
