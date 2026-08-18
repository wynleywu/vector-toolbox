/**
 * Vector Toolbox - Auto Page Number Tool (生成页码)
 * Based on AI_Auto_Page_Number_2024_UI_v2
 */

#target illustrator

(function () {
    if (!app.documents || app.documents.length === 0) {
        alert("请先打开一个 Illustrator 文档。");
        return;
    }

    var doc = app.activeDocument;
    if (!doc.artboards || doc.artboards.length === 0) {
        alert("当前文档没有画板。");
        return;
    }

    var LAYER_NAME = "__页码__";
    var LEGACY_LAYER_NAMES = ["__PAGE_NUMBERS__"];

    function trimString(s) {
        return String(s).replace(/^\s+|\s+$/g, "");
    }

    function padNumber(num, digits) {
        var s = String(num);
        while (s.length < digits) {
            s = "0" + s;
        }
        return s;
    }

    function getDigits(n) {
        return String(Math.abs(n)).length;
    }

    function makePageText(format, current, total, padDigits) {
        return String(format)
            .replace(/\{current\}/g, padNumber(current, padDigits))
            .replace(/\{total\}/g, padNumber(total, padDigits));
    }

    function parsePositiveNumber(value, fallback) {
        var n = parseFloat(value);
        if (isNaN(n) || n <= 0) return fallback;
        return n;
    }

    function parseNonNegativeNumber(value, fallback) {
        var n = parseFloat(value);
        if (isNaN(n) || n < 0) return fallback;
        return n;
    }

    function parseInteger(value, fallback) {
        var n = parseInt(value, 10);
        if (isNaN(n)) return fallback;
        return n;
    }

    function isPageLayerName(name) {
        if (name === LAYER_NAME) return true;
        var i;
        for (i = 0; i < LEGACY_LAYER_NAMES.length; i++) {
            if (name === LEGACY_LAYER_NAMES[i]) return true;
        }
        return false;
    }

    function clearPageItems(layer) {
        var i;
        for (i = layer.pageItems.length - 1; i >= 0; i--) {
            try {
                layer.pageItems[i].locked = false;
                layer.pageItems[i].hidden = false;
                layer.pageItems[i].remove();
            } catch (e) {}
        }
    }

    function getOrCreateLayer(name) {
        var i;
        var layer = null;
        for (i = 0; i < doc.layers.length; i++) {
            if (doc.layers[i].name === name) {
                layer = doc.layers[i];
                break;
            }
        }
        if (!layer) {
            layer = doc.layers.add();
            layer.name = name;
        }
        layer.locked = false;
        layer.visible = true;
        try {
            layer.zOrder(ZOrderMethod.BRINGTOFRONT);
        } catch (zErr) {}
        clearPageItems(layer);
        return layer;
    }

    function clearPageNumbers() {
        var removed = 0;
        var failed = 0;
        var i;
        for (i = doc.layers.length - 1; i >= 0; i--) {
            if (!isPageLayerName(doc.layers[i].name)) continue;
            try {
                doc.layers[i].locked = false;
                doc.layers[i].visible = true;
                doc.layers[i].remove();
                removed++;
            } catch (e) {
                failed++;
            }
        }
        app.redraw();
        if (removed === 0 && failed === 0) return null;
        if (failed > 0 && removed === 0) return false;
        return true;
    }

    function applyFont(textFrame, fontName, fontSize) {
        var attrs = textFrame.textRange.characterAttributes;
        attrs.size = fontSize;
        if (fontName !== "") {
            try {
                attrs.textFont = app.textFonts.getByName(fontName);
            } catch (e) {}
        }
    }

    function placeText(textFrame, artboardRect, position, marginX, marginY) {
        var left = artboardRect[0];
        var top = artboardRect[1];
        var right = artboardRect[2];
        var bottom = artboardRect[3];

        textFrame.position = [left + marginX, top - marginY];
        app.redraw();

        var b = textFrame.visibleBounds;
        var dx = 0;
        var dy = 0;

        switch (position) {
            case "BOTTOM_LEFT":
                dx = (left + marginX) - b[0];
                dy = (bottom + marginY) - b[3];
                break;
            case "TOP_RIGHT":
                dx = (right - marginX) - b[2];
                dy = (top - marginY) - b[1];
                break;
            case "TOP_LEFT":
                dx = (left + marginX) - b[0];
                dy = (top - marginY) - b[1];
                break;
            case "BOTTOM_RIGHT":
            default:
                dx = (right - marginX) - b[2];
                dy = (bottom + marginY) - b[3];
                break;
        }

        textFrame.translate(dx, dy);
    }

    var fontDisplayNames = [];
    var fontPostScriptNames = [];
    var fi;
    try {
        for (fi = 0; fi < app.textFonts.length; fi++) {
            var f = app.textFonts[fi];
            var displayName = f.family;
            if (f.style && f.style !== "") {
                displayName += " - " + f.style;
            }
            fontDisplayNames.push(displayName);
            fontPostScriptNames.push(f.name);
        }
    } catch (fontErr) {}

    if (fontDisplayNames.length === 0) {
        fontDisplayNames.push("Illustrator 默认字体");
        fontPostScriptNames.push("");
    }

    var win = new Window("dialog", "生成页码 - Vector Toolbox");
    win.orientation = "column";
    win.alignChildren = ["fill", "top"];
    win.spacing = 12;
    win.margins = 16;

    var formatPanel = win.add("panel", undefined, "页码格式");
    formatPanel.orientation = "column";
    formatPanel.alignChildren = ["fill", "top"];
    formatPanel.margins = 12;

    var formatRow = formatPanel.add("group");
    formatRow.add("statictext", undefined, "格式:");
    var formatDropdown = formatRow.add("dropdownlist", undefined, [
        "01 / 24",
        "01",
        "P.01",
        "01 of 24",
        "自定义"
    ]);
    formatDropdown.selection = 0;
    formatDropdown.preferredSize.width = 170;

    var customRow = formatPanel.add("group");
    customRow.add("statictext", undefined, "自定义:");
    var customFormatInput = customRow.add("edittext", undefined, "{current} / {total}");
    customFormatInput.preferredSize.width = 230;
    customFormatInput.enabled = false;

    formatPanel.add("statictext", undefined, "变量: {current} 当前页    {total} 总页数");

    var fontPanel = win.add("panel", undefined, "字体");
    fontPanel.orientation = "column";
    fontPanel.alignChildren = ["fill", "top"];
    fontPanel.margins = 12;

    var fontRow = fontPanel.add("group");
    fontRow.add("statictext", undefined, "字体:");
    var fontDropdown = fontRow.add("dropdownlist", undefined, fontDisplayNames);
    fontDropdown.selection = 0;
    fontDropdown.preferredSize.width = 280;

    var sizeRow = fontPanel.add("group");
    sizeRow.add("statictext", undefined, "字号:");
    var fontSizeInput = sizeRow.add("edittext", undefined, "10");
    fontSizeInput.characters = 8;
    sizeRow.add("statictext", undefined, "pt");

    var posPanel = win.add("panel", undefined, "位置");
    posPanel.orientation = "column";
    posPanel.alignChildren = ["fill", "top"];
    posPanel.margins = 12;

    var posRow = posPanel.add("group");
    posRow.add("statictext", undefined, "位置:");
    var posDropdown = posRow.add("dropdownlist", undefined, [
        "右下角",
        "左下角",
        "右上角",
        "左上角"
    ]);
    posDropdown.selection = 0;
    posDropdown.preferredSize.width = 120;

    var marginRow = posPanel.add("group");
    marginRow.add("statictext", undefined, "横向边距:");
    var marginXInput = marginRow.add("edittext", undefined, "24");
    marginXInput.characters = 6;
    marginRow.add("statictext", undefined, "pt");
    marginRow.add("statictext", undefined, "  纵向边距:");
    var marginYInput = marginRow.add("edittext", undefined, "24");
    marginYInput.characters = 6;
    marginRow.add("statictext", undefined, "pt");

    var numberPanel = win.add("panel", undefined, "编号");
    numberPanel.orientation = "column";
    numberPanel.alignChildren = ["fill", "top"];
    numberPanel.margins = 12;

    var numberRow = numberPanel.add("group");
    numberRow.add("statictext", undefined, "起始页码:");
    var startInput = numberRow.add("edittext", undefined, "1");
    startInput.characters = 6;
    numberRow.add("statictext", undefined, "  最少位数:");
    var padInput = numberRow.add("edittext", undefined, "2");
    padInput.characters = 6;

    var previewPanel = win.add("panel", undefined, "预览");
    previewPanel.orientation = "column";
    previewPanel.alignChildren = ["fill", "center"];
    previewPanel.margins = 12;
    var previewText = previewPanel.add("statictext", undefined, "01 / 24");
    previewText.alignment = ["center", "center"];

    var buttonRow = win.add("group");
    buttonRow.alignment = "right";
    var clearBtn = buttonRow.add("button", undefined, "清除页码");
    buttonRow.add("button", undefined, "取消", { name: "cancel" });
    buttonRow.add("button", undefined, "生成页码", { name: "ok" });

    function getFormat() {
        var idx = formatDropdown.selection ? formatDropdown.selection.index : 0;
        switch (idx) {
            case 1: return "{current}";
            case 2: return "P.{current}";
            case 3: return "{current} of {total}";
            case 4: return customFormatInput.text;
            case 0:
            default: return "{current} / {total}";
        }
    }

    function getPositionCode() {
        var idx = posDropdown.selection ? posDropdown.selection.index : 0;
        switch (idx) {
            case 1: return "BOTTOM_LEFT";
            case 2: return "TOP_RIGHT";
            case 3: return "TOP_LEFT";
            case 0:
            default: return "BOTTOM_RIGHT";
        }
    }

    function updatePreview() {
        var start = parseInteger(startInput.text, 1);
        var count = doc.artboards.length;
        var total = start + count - 1;
        var padDigits = parseInteger(padInput.text, 2);
        if (padDigits < 1) padDigits = 1;
        if (getDigits(total) > padDigits) padDigits = getDigits(total);
        previewText.text = makePageText(getFormat(), start, total, padDigits);
    }

    formatDropdown.onChange = function () {
        var isCustom = formatDropdown.selection && formatDropdown.selection.index === 4;
        customFormatInput.enabled = isCustom;
        updatePreview();
    };

    customFormatInput.onChanging = updatePreview;
    startInput.onChanging = updatePreview;
    padInput.onChanging = updatePreview;

    clearBtn.onClick = function () {
        var result = clearPageNumbers();
        if (result === true) {
            alert("页码已清除。");
        } else if (result === null) {
            alert("当前文档没有脚本生成的页码。");
        } else {
            alert("清除失败，请检查页码图层是否可编辑。");
        }
    };

    updatePreview();

    if (win.show() !== 1) {
        return;
    }

    var format = trimString(getFormat());
    if (format === "") {
        alert("页码格式不能为空。");
        return;
    }
    if (format.indexOf("{current}") === -1) {
        alert("页码格式必须包含 {current}。");
        return;
    }

    var fontSize = parsePositiveNumber(fontSizeInput.text, 10);
    var marginX = parseNonNegativeNumber(marginXInput.text, 24);
    var marginY = parseNonNegativeNumber(marginYInput.text, 24);
    var startNumber = parseInteger(startInput.text, 1);
    var padDigits = parseInteger(padInput.text, 2);
    if (padDigits < 1) padDigits = 1;

    var artboardCount = doc.artboards.length;
    var totalPageNumber = startNumber + artboardCount - 1;
    if (getDigits(totalPageNumber) > padDigits) {
        padDigits = getDigits(totalPageNumber);
    }

    var selectedFontName = "";
    if (fontDropdown.selection) {
        selectedFontName = fontPostScriptNames[fontDropdown.selection.index];
    }

    var position = getPositionCode();
    var pageLayer = getOrCreateLayer(LAYER_NAME);
    var i;

    for (i = 0; i < artboardCount; i++) {
        var artboard = doc.artboards[i];
        var currentPageNumber = startNumber + i;
        var pageText = makePageText(format, currentPageNumber, totalPageNumber, padDigits);
        var tf = pageLayer.textFrames.add();
        tf.contents = pageText;
        tf.name = "Page_" + currentPageNumber;
        applyFont(tf, selectedFontName, fontSize);
        placeText(tf, artboard.artboardRect, position, marginX, marginY);
    }

    try {
        doc.selection = null;
    } catch (selErr) {}
    app.redraw();
    return "✓ 已为 " + artboardCount + " 个画板生成页码";
})();
