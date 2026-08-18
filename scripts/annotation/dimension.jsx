/**
 * Vector Toolbox - Dimension Annotation Tool (宽高标注)
 * Standalone executable or invoked via Vector Toolbox
 */

#target illustrator
#targetengine "VectorToolboxDimensionEngine"

(function () {
    if ($.global.vtDimensionWindow) {
        try {
            if ($.global.vtDimensionWindow.visible) {
                $.global.vtDimensionWindow.active = true;
                return;
            }
        } catch (e) {
            $.global.vtDimensionWindow = null;
        }
    }

    function runDimension(opts) {
        var layerName = "__标注__";
        var ptPerMm = 72 / 25.4;
        var ptPerInch = 72;

        function toPt(val, unit) {
            var num = parseFloat(val) || 0;
            switch (("" + unit).toLowerCase()) {
                case "mm": return num * ptPerMm;
                case "cm": return num * ptPerMm * 10;
                case "in":
                case "inch": return num * ptPerInch;
                default: return num;
            }
        }

        function fromPt(points, unit, decimals) {
            var num = parseFloat(points) || 0;
            var res = num;
            switch (("" + unit).toLowerCase()) {
                case "mm": res = num / ptPerMm; break;
                case "cm": res = (num / ptPerMm) / 10; break;
                case "in":
                case "inch": res = num / ptPerInch; break;
            }
            var places = parseInt(decimals, 10);
            if (isNaN(places) || places < 0) places = 1;
            var factor = Math.pow(10, places);
            return Math.round(res * factor) / factor;
        }

        function rgb(r, g, b) {
            var c = new RGBColor();
            c.red = r;
            c.green = g;
            c.blue = b;
            return c;
        }

        function strokeLine(group, path, color, strokeWidth) {
            var line = group.pathItems.add();
            line.setEntirePath(path);
            line.filled = false;
            line.stroked = true;
            line.strokeWidth = strokeWidth;
            line.strokeColor = color;
        }

        function label(group, contents, size, color) {
            var tf = group.textFrames.add();
            tf.contents = contents;
            tf.textRange.characterAttributes.size = size;
            tf.textRange.characterAttributes.fillColor = color;
            return tf;
        }

        function draw(layer, bounds, name) {
            var left = bounds[0];
            var top = bounds[1];
            var right = bounds[2];
            var bottom = bounds[3];
            var widthVal = fromPt(Math.abs(right - left), opts.unit, opts.decimals) + opts.unit;
            var heightVal = fromPt(Math.abs(top - bottom), opts.unit, opts.decimals) + opts.unit;
            var offset = toPt(opts.offset, opts.unit);
            var tickLen = 6;
            var color = rgb(230, 40, 40);
            if (opts.color === "black") color = rgb(0, 0, 0);
            else if (opts.color === "gray") color = rgb(128, 128, 128);
            var sw = opts.strokeWidth || 0.5;
            var group = layer.groupItems.add();
            group.name = "Dim_" + (name || "Item");

            if (opts.doTop) {
                var yTop = top + offset;
                strokeLine(group, [[left, yTop], [right, yTop]], color, sw);
                strokeLine(group, [[left, yTop - tickLen / 2], [left, yTop + tickLen / 2]], color, sw);
                strokeLine(group, [[right, yTop - tickLen / 2], [right, yTop + tickLen / 2]], color, sw);
                var txtTop = label(group, widthVal, opts.fontSize, color);
                txtTop.position = [(left + right) / 2 - (txtTop.width / 2), yTop + txtTop.height + 2];
            }
            if (opts.doBottom) {
                var yBot = bottom - offset;
                strokeLine(group, [[left, yBot], [right, yBot]], color, sw);
                strokeLine(group, [[left, yBot - tickLen / 2], [left, yBot + tickLen / 2]], color, sw);
                strokeLine(group, [[right, yBot - tickLen / 2], [right, yBot + tickLen / 2]], color, sw);
                var txtBot = label(group, widthVal, opts.fontSize, color);
                txtBot.position = [(left + right) / 2 - (txtBot.width / 2), yBot - 2];
            }
            if (opts.doLeft) {
                var xLeft = left - offset;
                strokeLine(group, [[xLeft, top], [xLeft, bottom]], color, sw);
                strokeLine(group, [[xLeft - tickLen / 2, top], [xLeft + tickLen / 2, top]], color, sw);
                strokeLine(group, [[xLeft - tickLen / 2, bottom], [xLeft + tickLen / 2, bottom]], color, sw);
                var txtLeft = label(group, heightVal, opts.fontSize, color);
                txtLeft.rotate(90);
                txtLeft.position = [xLeft - txtLeft.width - 4, (top + bottom) / 2 + (txtLeft.height / 2)];
            }
            if (opts.doRight) {
                var xRight = right + offset;
                strokeLine(group, [[xRight, top], [xRight, bottom]], color, sw);
                strokeLine(group, [[xRight - tickLen / 2, top], [xRight + tickLen / 2, top]], color, sw);
                strokeLine(group, [[xRight - tickLen / 2, bottom], [xRight + tickLen / 2, bottom]], color, sw);
                var txtRight = label(group, heightVal, opts.fontSize, color);
                txtRight.rotate(90);
                txtRight.position = [xRight + 4, (top + bottom) / 2 + (txtRight.height / 2)];
            }
        }

        if (!app.documents || app.documents.length === 0) {
            return "请先打开一个 Illustrator 文档";
        }
        if (!opts.doTop && !opts.doBottom && !opts.doLeft && !opts.doRight) {
            return "请至少勾选一个标注方向";
        }

        var doc = app.activeDocument;
        var layer = null;
        try {
            layer = doc.layers.getByName(layerName);
        } catch (e) {
            layer = doc.layers.add();
            layer.name = layerName;
        }
        layer.visible = true;
        layer.locked = false;
        try { layer.zOrder(ZOrderMethod.BRINGTOFRONT); } catch (zErr) {}

        if (opts.replaceFirst) {
            var pi;
            for (pi = layer.pageItems.length - 1; pi >= 0; pi--) {
                try {
                    layer.pageItems[pi].locked = false;
                    layer.pageItems[pi].remove();
                } catch (clrErr) {}
            }
        }

        var sel = doc.selection;
        var targets = [];
        var i;
        if (sel && sel.length > 0) {
            for (i = 0; i < sel.length; i++) {
                try {
                    var item = sel[i];
                    if (item.layer && item.layer.name === layerName) continue;
                    if (!item.geometricBounds) continue;
                    targets.push({
                        bounds: item.geometricBounds,
                        name: item.name || ("Item_" + (i + 1))
                    });
                } catch (skipErr) {}
            }
        } else {
            var ab = doc.artboards[doc.artboards.getActiveArtboardIndex()];
            targets.push({ bounds: ab.artboardRect, name: ab.name || "Artboard" });
        }

        if (targets.length === 0) {
            return "没有可标注的对象";
        }

        var count = 0;
        var failed = 0;
        for (i = 0; i < targets.length; i++) {
            try {
                draw(layer, targets[i].bounds, targets[i].name);
                count++;
            } catch (annErr) {
                failed++;
            }
        }
        app.redraw();
        if (failed > 0) return "已标注 " + count + " 项，跳过 " + failed + " 项";
        return "已标注 " + count + " 项";
    }

    function clearDimensions() {
        if (!app.documents || app.documents.length === 0) {
            return "请先打开一个 Illustrator 文档";
        }

        var names = ["__标注__", "__Annotations__", "__Dimensions__"];
        var doc = app.activeDocument;
        var removed = 0;
        var failed = 0;
        var i;

        function isTarget(name) {
            var n;
            for (n = 0; n < names.length; n++) {
                if (name === names[n]) return true;
            }
            return false;
        }

        for (i = doc.layers.length - 1; i >= 0; i--) {
            var layer = doc.layers[i];
            if (!isTarget(layer.name)) continue;
            try {
                layer.locked = false;
                layer.visible = true;
                layer.remove();
                removed++;
            } catch (e) {
                failed++;
            }
        }

        app.redraw();
        if (removed === 0) return "没有可清除的标注";
        if (failed > 0) return "已清除 " + removed + " 层，失败 " + failed + " 层";
        return "已清除标注";
    }

    function serializeOpts(opts) {
        return "{" +
            "doTop:" + (opts.doTop ? "true" : "false") + "," +
            "doBottom:" + (opts.doBottom ? "true" : "false") + "," +
            "doLeft:" + (opts.doLeft ? "true" : "false") + "," +
            "doRight:" + (opts.doRight ? "true" : "false") + "," +
            "unit:\"" + String(opts.unit).replace(/"/g, "") + "\"," +
            "decimals:" + (parseInt(opts.decimals, 10) || 0) + "," +
            "offset:" + (parseFloat(opts.offset) || 0) + "," +
            "fontSize:" + (parseFloat(opts.fontSize) || 9) + "," +
            "strokeWidth:" + (parseFloat(opts.strokeWidth) || 0.5) + "," +
            "color:\"" + String(opts.color || "red").replace(/"/g, "") + "\"," +
            "replaceFirst:" + (opts.replaceFirst ? "true" : "false") +
            "}";
    }

    // BridgeTalk doubles backslashes in the message body, which breaks regex
    // literals whose escapes stop matching. Percent-encoding keeps the source
    // intact (same reason as core/bridge.jsx).
    function encodeBody(src) {
        return 'eval(decodeURIComponent("' + encodeURIComponent(src) + '"))';
    }

    function dispatchRun(opts, onDone) {
        var body = runDimension.toString() +
            "\nrunDimension(" + serializeOpts(opts) + ");";

        if (typeof BridgeTalk === "undefined") {
            onDone(runDimension(opts));
            return;
        }

        var bt = new BridgeTalk();
        bt.target = BridgeTalk.appSpecifier || "illustrator";
        bt.body = encodeBody(body);
        bt.onResult = function (resObj) {
            onDone(resObj.body);
        };
        bt.onError = function (errObj) {
            onDone("标注失败: " + errObj.body);
        };
        bt.send();
    }

    function dispatchClear(onDone) {
        var body = clearDimensions.toString() + "\nclearDimensions();";

        if (typeof BridgeTalk === "undefined") {
            onDone(clearDimensions());
            return;
        }

        var bt = new BridgeTalk();
        bt.target = BridgeTalk.appSpecifier || "illustrator";
        bt.body = encodeBody(body);
        bt.onResult = function (resObj) {
            onDone(resObj.body);
        };
        bt.onError = function (errObj) {
            onDone("清除失败: " + errObj.body);
        };
        bt.send();
    }

    var win = new Window("palette", "宽高标注 - Vector Toolbox", undefined, { resizeable: true });
    $.global.vtDimensionWindow = win;
    win.onClose = function () {
        $.global.vtDimensionWindow = null;
    };

    win.orientation = "column";
    win.alignChildren = ["fill", "top"];
    win.spacing = 8;
    win.margins = 12;

    var pnlDir = win.add("panel", undefined, "标注方向");
    pnlDir.orientation = "column";
    pnlDir.alignChildren = ["left", "top"];
    pnlDir.spacing = 4;

    var rowWH = pnlDir.add("group");
    var chkTop = rowWH.add("checkbox", undefined, "上 (宽)");
    chkTop.value = true;
    var chkBottom = rowWH.add("checkbox", undefined, "下 (宽)");
    var chkLeft = rowWH.add("checkbox", undefined, "左 (高)");
    chkLeft.value = true;
    var chkRight = rowWH.add("checkbox", undefined, "右 (高)");

    var pnlOpts = win.add("panel", undefined, "参数设置");
    pnlOpts.orientation = "column";
    pnlOpts.alignChildren = ["fill", "top"];
    pnlOpts.spacing = 6;

    var row1 = pnlOpts.add("group");
    row1.add("statictext", undefined, "单位:");
    var ddlUnit = row1.add("dropdownlist", undefined, ["mm", "cm", "px", "pt", "inch"]);
    ddlUnit.selection = 0;
    row1.add("statictext", undefined, "精度:");
    var ddlDec = row1.add("dropdownlist", undefined, ["0", "1", "2", "3"]);
    ddlDec.selection = 1;

    var row2 = pnlOpts.add("group");
    row2.add("statictext", undefined, "偏移:");
    var edtOffset = row2.add("edittext", undefined, "5");
    edtOffset.characters = 4;
    row2.add("statictext", undefined, "字号:");
    var edtFontSize = row2.add("edittext", undefined, "9");
    edtFontSize.characters = 4;

    var row3 = pnlOpts.add("group");
    row3.add("statictext", undefined, "颜色:");
    var ddlColor = row3.add("dropdownlist", undefined, ["红", "黑", "灰"]);
    ddlColor.selection = 0;
    row3.add("statictext", undefined, "线宽:");
    var ddlStroke = row3.add("dropdownlist", undefined, ["细", "中"]);
    ddlStroke.selection = 0;

    var chkReplace = win.add("checkbox", undefined, "生成前覆盖已有标注");
    chkReplace.value = true;

    var lblHint = win.add("statictext", undefined, "未选对象时标注当前画板", { multiline: true });
    lblHint.preferredSize.width = 220;

    var grpBtns = win.add("group");
    grpBtns.orientation = "row";
    grpBtns.alignment = ["fill", "center"];
    var btnRun = grpBtns.add("button", undefined, "开始标注");
    var btnClear = grpBtns.add("button", undefined, "清除标注");
    var btnClose = grpBtns.add("button", undefined, "关闭");

    var lblStatus = win.add("statictext", undefined, "就绪");
    lblStatus.alignment = ["fill", "center"];

    function colorKey() {
        var idx = ddlColor.selection ? ddlColor.selection.index : 0;
        if (idx === 1) return "black";
        if (idx === 2) return "gray";
        return "red";
    }

    function strokeValue() {
        return (ddlStroke.selection && ddlStroke.selection.index === 1) ? 0.75 : 0.3;
    }

    function loadPrefs() {
        var p = null;
        try {
            if (typeof VTStorage !== "undefined") {
                var s = VTStorage.getSettings();
                if (s && s.dimension) p = s.dimension;
            }
        } catch (e) {}
        if (!p && $.global.vtDimensionPrefs) p = $.global.vtDimensionPrefs;
        if (!p) return;
        try {
            if (typeof p.doTop === "boolean") chkTop.value = p.doTop;
            if (typeof p.doBottom === "boolean") chkBottom.value = p.doBottom;
            if (typeof p.doLeft === "boolean") chkLeft.value = p.doLeft;
            if (typeof p.doRight === "boolean") chkRight.value = p.doRight;
            if (p.unit) {
                var ui;
                for (ui = 0; ui < ddlUnit.items.length; ui++) {
                    if (ddlUnit.items[ui].text === p.unit) {
                        ddlUnit.selection = ui;
                        break;
                    }
                }
            }
            if (typeof p.decimals !== "undefined") {
                var decStr = "" + p.decimals;
                var di;
                for (di = 0; di < ddlDec.items.length; di++) {
                    if (ddlDec.items[di].text === decStr) {
                        ddlDec.selection = di;
                        break;
                    }
                }
            }
            if (p.offset) edtOffset.text = "" + p.offset;
            if (p.fontSize) edtFontSize.text = "" + p.fontSize;
            if (p.color === "black") ddlColor.selection = 1;
            else if (p.color === "gray") ddlColor.selection = 2;
            if (p.strokeWidth && p.strokeWidth >= 0.5) ddlStroke.selection = 1;
            if (typeof p.replaceFirst === "boolean") chkReplace.value = p.replaceFirst;
        } catch (prefErr) {}
    }

    function savePrefs(opts) {
        $.global.vtDimensionPrefs = opts;
        try {
            if (typeof VTStorage !== "undefined") {
                var s = VTStorage.getSettings();
                s.dimension = opts;
                VTStorage.saveSettings(s);
            }
        } catch (e) {}
    }

    loadPrefs();

    btnRun.onClick = function () {
        var opts = {
            doTop: chkTop.value,
            doBottom: chkBottom.value,
            doLeft: chkLeft.value,
            doRight: chkRight.value,
            unit: ddlUnit.selection ? ddlUnit.selection.text : "mm",
            decimals: ddlDec.selection ? ddlDec.selection.text : "1",
            offset: parseFloat(edtOffset.text) || 5,
            fontSize: parseFloat(edtFontSize.text) || 9,
            strokeWidth: strokeValue(),
            color: colorKey(),
            replaceFirst: chkReplace.value
        };
        savePrefs(opts);
        lblStatus.text = "正在标注...";
        dispatchRun(opts, function (msg) {
            lblStatus.text = msg || "完成";
        });
    };

    btnClear.onClick = function () {
        lblStatus.text = "正在清除...";
        dispatchClear(function (msg) {
            lblStatus.text = msg || "完成";
        });
    };

    btnClose.onClick = function () {
        win.close();
    };

    win.show();
})();
