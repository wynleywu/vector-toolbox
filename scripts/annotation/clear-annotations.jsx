/**
 * Vector Toolbox - Clear Annotations Tool (清除标注)
 * Removes annotation layers and page number layers in one click
 */

#target illustrator

(function () {
    if (!app.documents || app.documents.length === 0) {
        return "⚠ 无打开的文档";
    }

    var doc = app.activeDocument;
    var targetLayers = ["__标注__", "__Annotations__", "__页码__", "__Dimensions__"];
    var removedCount = 0;
    var failedCount = 0;

    function isTarget(name) {
        var i;
        for (i = 0; i < targetLayers.length; i++) {
            if (name === targetLayers[i]) return true;
        }
        return false;
    }

    for (var i = doc.layers.length - 1; i >= 0; i--) {
        var layer = doc.layers[i];
        if (!isTarget(layer.name)) continue;
        try {
            layer.locked = false;
            layer.visible = true;
            layer.remove();
            removedCount++;
        } catch (e) {
            failedCount++;
        }
    }

    app.redraw();
    if (removedCount > 0 && failedCount > 0) {
        return "✓ 已清除 " + removedCount + " 个标注/页码图层，" + failedCount + " 个未能删除";
    }
    if (removedCount > 0) {
        return "✓ 已清除 " + removedCount + " 个标注/页码图层";
    }
    return "ℹ 未发现标注图层";
})();
