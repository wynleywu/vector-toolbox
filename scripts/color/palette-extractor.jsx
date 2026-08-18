/**
 * Vector Toolbox - Color Palette Extractor (色板提取与色卡生成)
 * Extracts distinct colors from selection and generates a visual swatch palette
 */

#target illustrator

(function () {
    if (!app.documents || app.documents.length === 0) {
        alert("请先打开一个 Illustrator 文档！");
        return;
    }

    var doc = app.activeDocument;
    var selection = doc.selection;

    if (!selection || selection.length === 0) {
        alert("请先选中需要提取色彩的对象！");
        return;
    }

    var LAYER_NAME = "__色板提取__";
    var COLS = 8;

    function cloneColor(c) {
        if (!c) return null;
        var typeName = c.typename;
        if (typeName === "RGBColor") {
            var rgb = new RGBColor();
            rgb.red = c.red;
            rgb.green = c.green;
            rgb.blue = c.blue;
            return rgb;
        }
        if (typeName === "CMYKColor") {
            var cmyk = new CMYKColor();
            cmyk.cyan = c.cyan;
            cmyk.magenta = c.magenta;
            cmyk.yellow = c.yellow;
            cmyk.black = c.black;
            return cmyk;
        }
        if (typeName === "GrayColor") {
            var gray = new GrayColor();
            gray.gray = c.gray;
            return gray;
        }
        if (typeName === "SpotColor") {
            var spot = new SpotColor();
            spot.spot = c.spot;
            spot.tint = c.tint;
            return spot;
        }
        return null;
    }

    function colorToKey(c) {
        if (!c) return null;
        if (c.typename === "RGBColor") {
            return "RGB(" + Math.round(c.red) + "," + Math.round(c.green) + "," + Math.round(c.blue) + ")";
        }
        if (c.typename === "CMYKColor") {
            return "CMYK(" + Math.round(c.cyan) + "," + Math.round(c.magenta) + "," + Math.round(c.yellow) + "," + Math.round(c.black) + ")";
        }
        if (c.typename === "GrayColor") {
            return "Gray(" + Math.round(c.gray) + ")";
        }
        if (c.typename === "SpotColor") {
            return "Spot(" + (c.spot ? c.spot.name : "Spot") + "," + Math.round(c.tint) + ")";
        }
        return null;
    }

    function colorToHex(c) {
        if (!c || c.typename !== "RGBColor") return "";
        var r = Math.round(c.red).toString(16);
        var g = Math.round(c.green).toString(16);
        var b = Math.round(c.blue).toString(16);
        if (r.length === 1) r = "0" + r;
        if (g.length === 1) g = "0" + g;
        if (b.length === 1) b = "0" + b;
        return "#" + (r + g + b).toUpperCase();
    }

    function labelText(entry) {
        if (entry.hex) return entry.hex;
        return entry.key;
    }

    var colorMap = {};
    var colorList = [];
    var skippedSpecial = 0;

    function addColor(c) {
        var cloned = cloneColor(c);
        if (!cloned) {
            if (c && (c.typename === "GradientColor" || c.typename === "PatternColor")) {
                skippedSpecial++;
            }
            return;
        }
        var key = colorToKey(cloned);
        if (!key || colorMap[key]) return;
        colorMap[key] = true;
        colorList.push({
            color: cloned,
            key: key,
            hex: colorToHex(cloned)
        });
    }

    function collectFromPath(item) {
        try {
            if (item.filled && item.fillColor) addColor(item.fillColor);
            if (item.stroked && item.strokeColor) addColor(item.strokeColor);
        } catch (e) {}
    }

    function collectColors(items) {
        var i;
        for (i = 0; i < items.length; i++) {
            var item = items[i];
            var typeName = item.typename;
            if (typeName === "GroupItem") {
                collectColors(item.pageItems);
            } else if (typeName === "CompoundPathItem") {
                collectColors(item.pathItems);
            } else if (typeName === "PathItem") {
                collectFromPath(item);
            } else if (typeName === "TextFrame") {
                try {
                    if (item.textRange && item.textRange.characterAttributes) {
                        addColor(item.textRange.characterAttributes.fillColor);
                    }
                } catch (tErr) {}
            }
        }
    }

    collectColors(selection);

    if (colorList.length === 0) {
        alert(skippedSpecial > 0
            ? "选区只有渐变或图案，当前版本仅提取纯色填充/描边。"
            : "选中的对象中未检测到有效填充或描边颜色！");
        return;
    }

    var dlg = new Window("dialog", "提取色板与生成色卡 - Vector Toolbox");
    dlg.orientation = "column";
    dlg.alignChildren = ["fill", "top"];
    dlg.spacing = 10;
    dlg.margins = 15;

    var summary = "共提取到 " + colorList.length + " 种纯色";
    if (skippedSpecial > 0) {
        summary += "，另跳过 " + skippedSpecial + " 个渐变/图案";
    }
    dlg.add("statictext", undefined, summary);

    var pnlOptions = dlg.add("panel", undefined, "色卡生成选项");
    pnlOptions.orientation = "column";
    pnlOptions.alignChildren = ["fill", "top"];
    pnlOptions.spacing = 8;

    var rowSize = pnlOptions.add("group");
    rowSize.add("statictext", undefined, "色块大小 (pt):");
    var edtSize = rowSize.add("edittext", undefined, "40");
    edtSize.characters = 5;

    var chkAddText = pnlOptions.add("checkbox", undefined, "附带色彩数值文字标签 (HEX / CMYK)");
    chkAddText.value = true;

    var chkReplace = pnlOptions.add("checkbox", undefined, "覆盖已有色卡图层");
    chkReplace.value = true;

    var grpBtns = dlg.add("group");
    grpBtns.alignment = ["fill", "center"];
    grpBtns.add("button", undefined, "生成色卡", { name: "ok" });
    grpBtns.add("button", undefined, "取消", { name: "cancel" });

    if (dlg.show() !== 1) {
        return;
    }

    var swatchSize = parseFloat(edtSize.text) || 40;
    if (swatchSize <= 0) swatchSize = 40;
    var addLabels = chkAddText.value;
    var replaceOld = chkReplace.value;
    var gap = 12;
    var labelW = addLabels ? 58 : 0;
    var cellW = swatchSize + gap + labelW;
    var cellH = swatchSize + (addLabels ? 22 : gap);

    var selBounds = selection[0].visibleBounds;
    var b;
    for (b = 1; b < selection.length; b++) {
        var sb = selection[b].visibleBounds;
        if (sb[0] < selBounds[0]) selBounds[0] = sb[0];
        if (sb[1] > selBounds[1]) selBounds[1] = sb[1];
        if (sb[2] > selBounds[2]) selBounds[2] = sb[2];
        if (sb[3] < selBounds[3]) selBounds[3] = sb[3];
    }

    var startX = selBounds[0];
    var startY = selBounds[3] - 25;

    var targetLayer = null;
    try {
        targetLayer = doc.layers.getByName(LAYER_NAME);
    } catch (e) {
        targetLayer = doc.layers.add();
        targetLayer.name = LAYER_NAME;
    }
    targetLayer.visible = true;
    targetLayer.locked = false;

    if (replaceOld) {
        for (var r = targetLayer.pageItems.length - 1; r >= 0; r--) {
            try { targetLayer.pageItems[r].remove(); } catch (rmErr) {}
        }
    }

    var cIdx;
    for (cIdx = 0; cIdx < colorList.length; cIdx++) {
        var itemData = colorList[cIdx];
        var col = cIdx % COLS;
        var row = Math.floor(cIdx / COLS);
        var x = startX + col * cellW;
        var y = startY - row * cellH;

        var rect = targetLayer.pathItems.rectangle(y, x, swatchSize, swatchSize);
        rect.fillColor = itemData.color;
        rect.filled = true;
        rect.stroked = true;
        rect.strokeWidth = 0.25;
        var stroke = new RGBColor();
        stroke.red = 180;
        stroke.green = 180;
        stroke.blue = 180;
        rect.strokeColor = stroke;
        rect.name = "Swatch_" + (cIdx + 1);

        if (addLabels) {
            var tf = targetLayer.textFrames.add();
            tf.contents = labelText(itemData);
            tf.left = x;
            tf.top = y - swatchSize - 4;
            tf.textRange.characterAttributes.size = 8;
        }
    }

    app.redraw();
    return "✓ 已提取 " + colorList.length + " 个颜色并生成色卡";
})();
