/**
 * Vector Toolbox - Cleanup Objects (清理对象)
 * Removes hidden objects, isolated points, empty text frames, and unpainted paths
 */

#target illustrator

(function () {
    if (!app.documents || app.documents.length === 0) {
        return "⚠ 无打开的文档";
    }

    var doc = app.activeDocument;
    var cleanedItems = 0;

    // 1. Clean hidden items across doc
    for (var i = doc.pageItems.length - 1; i >= 0; i--) {
        var item = doc.pageItems[i];
        try {
            if (item.hidden) {
                item.remove();
                cleanedItems++;
            }
        } catch (e) {}
    }

    // 2. Clean empty text frames
    for (var t = doc.textFrames.length - 1; t >= 0; t--) {
        var tf = doc.textFrames[t];
        try {
            var raw = ("" + tf.contents).replace(/^\s+|\s+$/g, "");
            if (raw.length === 0) {
                tf.remove();
                cleanedItems++;
            }
        } catch (e) {}
    }

    // 3. Clean unpainted paths & isolated points
    for (var p = doc.pathItems.length - 1; p >= 0; p--) {
        var path = doc.pathItems[p];
        try {
            if (path.guides || path.clipping) continue;

            // Isolated points
            if (path.pathPoints.length <= 1) {
                path.remove();
                cleanedItems++;
                continue;
            }

            // Neither filled nor stroked
            if (!path.filled && !path.stroked) {
                path.remove();
                cleanedItems++;
            }
        } catch (e) {}
    }

    // 4. Clean empty groups
    for (var g = doc.groupItems.length - 1; g >= 0; g--) {
        var grp = doc.groupItems[g];
        try {
            if (grp.pageItems.length === 0) {
                grp.remove();
                cleanedItems++;
            }
        } catch (e) {}
    }

    app.redraw();
    if (cleanedItems > 0) {
        return "✓ 已清理 " + cleanedItems + " 个冗余/隐藏对象";
    } else {
        return "ℹ 文档很干净，未发现冗余对象";
    }
})();
