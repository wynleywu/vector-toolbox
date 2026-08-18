/**
 * Vector Toolbox - Grid Guides (栅格参考线)
 * GuideGuide-style columns, rows, margins, midpoints, and quick guides
 */

#target illustrator
#targetengine "VectorToolboxGuideEngine"

(function () {
    if ($.global.vtGuideWindow) {
        try {
            if ($.global.vtGuideWindow.visible) {
                $.global.vtGuideWindow.active = true;
                return;
            }
        } catch (e) {
            $.global.vtGuideWindow = null;
        }
    }

    function runGuides(opts) {
        var layerName = "__参考线__";
        var ptPerMm = 72 / 25.4;

        function toPt(val, unit) {
            var num = parseFloat(val);
            if (isNaN(num)) num = 0;
            if (unit === "mm") return num * ptPerMm;
            if (unit === "cm") return num * ptPerMm * 10;
            return num;
        }

        if (!app.documents || app.documents.length === 0) {
            return "请先打开一个 Illustrator 文档";
        }

        var doc = app.activeDocument;
        var action = opts.action || "grid";
        var unit = opts.unit || "mm";

        function getLayer(createIfMissing) {
            var layer = null;
            try {
                layer = doc.layers.getByName(layerName);
            } catch (e) {
                layer = null;
            }
            if (!layer) {
                if (!createIfMissing) return null;
                layer = doc.layers.add();
                layer.name = layerName;
            }
            layer.visible = true;
            layer.locked = false;
            try {
                layer.zOrder(ZOrderMethod.BRINGTOFRONT);
            } catch (zErr) {}
            return layer;
        }

        if (action === "clear") {
            var existing = getLayer(false);
            if (!existing) return "没有可清除的参考线";
            try {
                existing.remove();
                app.redraw();
                return "已清除参考线";
            } catch (rmErr) {
                return "清除失败";
            }
        }

        var layer = getLayer(true);
        var created = 0;
        var skipped = 0;

        function addV(x, topY, bottomY) {
            var line = layer.pathItems.add();
            line.setEntirePath([[x, topY], [x, bottomY]]);
            line.guides = true;
            created++;
        }

        function addH(y, leftX, rightX) {
            var line = layer.pathItems.add();
            line.setEntirePath([[leftX, y], [rightX, y]]);
            line.guides = true;
            created++;
        }

        function selectionRect() {
            var sel = doc.selection;
            if (!sel || sel.length === 0) return null;
            var box = null;
            var i;
            for (i = 0; i < sel.length; i++) {
                try {
                    var b = sel[i].geometricBounds;
                    if (!b) continue;
                    if (!box) {
                        box = [b[0], b[1], b[2], b[3]];
                    } else {
                        if (b[0] < box[0]) box[0] = b[0];
                        if (b[1] > box[1]) box[1] = b[1];
                        if (b[2] > box[2]) box[2] = b[2];
                        if (b[3] < box[3]) box[3] = b[3];
                    }
                } catch (e) {}
            }
            return box;
        }

        function collectTargets() {
            var list = [];
            if (opts.scope === "selection") {
                var selBox = selectionRect();
                if (!selBox) return list;
                var ab = doc.artboards[doc.artboards.getActiveArtboardIndex()];
                list.push({ ref: selBox, span: ab.artboardRect });
                return list;
            }
            if (opts.scope === "all") {
                var a;
                for (a = 0; a < doc.artboards.length; a++) {
                    var rectAll = doc.artboards[a].artboardRect;
                    list.push({ ref: rectAll, span: rectAll });
                }
                return list;
            }
            var rectOne = doc.artboards[doc.artboards.getActiveArtboardIndex()].artboardRect;
            list.push({ ref: rectOne, span: rectOne });
            return list;
        }

        var targets = collectTargets();
        if (targets.length === 0) {
            return opts.scope === "selection" ? "请先选择对象" : "没有可处理的画板";
        }

        var marginT = toPt(opts.sameMargin ? opts.margin : opts.top, unit);
        var marginR = toPt(opts.sameMargin ? opts.margin : opts.right, unit);
        var marginB = toPt(opts.sameMargin ? opts.margin : opts.bottom, unit);
        var marginL = toPt(opts.sameMargin ? opts.margin : opts.left, unit);
        var cols = parseInt(opts.cols, 10);
        var rows = parseInt(opts.rows, 10);
        if (isNaN(cols) || cols < 0) cols = 0;
        if (isNaN(rows) || rows < 0) rows = 0;
        var colGutter = toPt(opts.colGutter, unit);
        var rowGutter = toPt(opts.rowGutter, unit);
        if (colGutter < 0) colGutter = 0;
        if (rowGutter < 0) rowGutter = 0;

        function drawOutline(target) {
            var r = target.ref;
            addV(r[0], target.span[1], target.span[3]);
            addV(r[2], target.span[1], target.span[3]);
            addH(r[1], target.span[0], target.span[2]);
            addH(r[3], target.span[0], target.span[2]);
        }

        function drawMid(target) {
            var r = target.ref;
            addV((r[0] + r[2]) / 2, target.span[1], target.span[3]);
            addH((r[1] + r[3]) / 2, target.span[0], target.span[2]);
        }

        function drawGrid(target) {
            var r = target.ref;
            var innerL = r[0] + marginL;
            var innerR = r[2] - marginR;
            var innerT = r[1] - marginT;
            var innerB = r[3] + marginB;
            var usableW = innerR - innerL;
            var usableH = innerT - innerB;
            var ok = false;

            if (cols >= 1 && usableW > 0) {
                var totalGutterW = (cols - 1) * colGutter;
                var colW = (usableW - totalGutterW) / cols;
                if (colW > 0) {
                    ok = true;
                    var x = innerL;
                    var c;
                    addV(x, target.span[1], target.span[3]);
                    for (c = 0; c < cols; c++) {
                        x += colW;
                        addV(x, target.span[1], target.span[3]);
                        if (c < cols - 1 && colGutter > 0) {
                            if (opts.midGutter) {
                                addV(x + colGutter / 2, target.span[1], target.span[3]);
                            }
                            x += colGutter;
                            addV(x, target.span[1], target.span[3]);
                        }
                    }
                }
            }

            if (rows >= 1 && usableH > 0) {
                var totalGutterH = (rows - 1) * rowGutter;
                var rowH = (usableH - totalGutterH) / rows;
                if (rowH > 0) {
                    ok = true;
                    var y = innerT;
                    var rr;
                    addH(y, target.span[0], target.span[2]);
                    for (rr = 0; rr < rows; rr++) {
                        y -= rowH;
                        addH(y, target.span[0], target.span[2]);
                        if (rr < rows - 1 && rowGutter > 0) {
                            if (opts.midGutter) {
                                addH(y - rowGutter / 2, target.span[0], target.span[2]);
                            }
                            y -= rowGutter;
                            addH(y, target.span[0], target.span[2]);
                        }
                    }
                }
            }

            if (!ok) skipped++;
        }

        var t;
        for (t = 0; t < targets.length; t++) {
            if (action === "outline") drawOutline(targets[t]);
            else if (action === "mid") drawMid(targets[t]);
            else drawGrid(targets[t]);
        }

        app.redraw();
        if (created === 0) {
            return skipped > 0 ? "边距或间距过大，无法生成" : "没有生成参考线";
        }
        if (action === "outline") return "已添加四边参考线（" + created + " 条）";
        if (action === "mid") return "已添加中线（" + created + " 条）";
        var skipMsg = skipped > 0 ? "，跳过 " + skipped + " 个" : "";
        return "已生成栅格（" + created + " 条）" + skipMsg;
    }

    function serializeOpts(opts) {
        return "{" +
            "action:\"" + opts.action + "\"," +
            "scope:\"" + opts.scope + "\"," +
            "unit:\"" + opts.unit + "\"," +
            "sameMargin:" + (opts.sameMargin ? "true" : "false") + "," +
            "margin:" + (parseFloat(opts.margin) || 0) + "," +
            "top:" + (parseFloat(opts.top) || 0) + "," +
            "right:" + (parseFloat(opts.right) || 0) + "," +
            "bottom:" + (parseFloat(opts.bottom) || 0) + "," +
            "left:" + (parseFloat(opts.left) || 0) + "," +
            "cols:" + (parseInt(opts.cols, 10) || 0) + "," +
            "colGutter:" + (parseFloat(opts.colGutter) || 0) + "," +
            "rows:" + (parseInt(opts.rows, 10) || 0) + "," +
            "rowGutter:" + (parseFloat(opts.rowGutter) || 0) + "," +
            "midGutter:" + (opts.midGutter ? "true" : "false") +
            "}";
    }

    // BridgeTalk doubles backslashes in the message body, which breaks regex
    // literals whose escapes stop matching. Percent-encoding keeps the source
    // intact (same reason as core/bridge.jsx).
    function encodeBody(src) {
        return 'eval(decodeURIComponent("' + encodeURIComponent(src) + '"))';
    }

    function dispatch(opts, onDone) {
        var body = runGuides.toString() + "\nrunGuides(" + serializeOpts(opts) + ");";
        if (typeof BridgeTalk === "undefined") {
            onDone(runGuides(opts));
            return;
        }
        var bt = new BridgeTalk();
        bt.target = BridgeTalk.appSpecifier || "illustrator";
        bt.body = encodeBody(body);
        bt.onResult = function (resObj) {
            onDone(resObj.body);
        };
        bt.onError = function (errObj) {
            onDone("失败: " + errObj.body);
        };
        bt.send();
    }

    var win = new Window("palette", "栅格参考线 - Vector Toolbox", undefined, { resizeable: true });
    $.global.vtGuideWindow = win;
    win.onClose = function () {
        $.global.vtGuideWindow = null;
    };
    win.orientation = "column";
    win.alignChildren = ["fill", "top"];
    win.spacing = 8;
    win.margins = 12;

    var pnlScope = win.add("panel", undefined, "范围");
    pnlScope.orientation = "row";
    var rbActive = pnlScope.add("radiobutton", undefined, "当前画板");
    var rbAll = pnlScope.add("radiobutton", undefined, "全部画板");
    var rbSel = pnlScope.add("radiobutton", undefined, "选区");
    rbActive.value = true;

    var pnlUnit = win.add("group");
    pnlUnit.add("statictext", undefined, "单位:");
    var ddlUnit = pnlUnit.add("dropdownlist", undefined, ["mm", "px", "pt"]);
    ddlUnit.selection = 0;

    var pnlMargin = win.add("panel", undefined, "边距");
    pnlMargin.orientation = "column";
    pnlMargin.alignChildren = ["fill", "top"];
    pnlMargin.spacing = 4;

    var rowSame = pnlMargin.add("group");
    var chkSame = rowSame.add("checkbox", undefined, "四边相同");
    chkSame.value = true;
    var edtMargin = rowSame.add("edittext", undefined, "0");
    edtMargin.characters = 6;

    var rowTR = pnlMargin.add("group");
    rowTR.add("statictext", undefined, "上");
    var edtTop = rowTR.add("edittext", undefined, "0");
    edtTop.characters = 5;
    rowTR.add("statictext", undefined, "右");
    var edtRight = rowTR.add("edittext", undefined, "0");
    edtRight.characters = 5;

    var rowBL = pnlMargin.add("group");
    rowBL.add("statictext", undefined, "下");
    var edtBottom = rowBL.add("edittext", undefined, "0");
    edtBottom.characters = 5;
    rowBL.add("statictext", undefined, "左");
    var edtLeft = rowBL.add("edittext", undefined, "0");
    edtLeft.characters = 5;

    function syncMarginFields() {
        var locked = chkSame.value;
        edtMargin.enabled = locked;
        edtTop.enabled = !locked;
        edtRight.enabled = !locked;
        edtBottom.enabled = !locked;
        edtLeft.enabled = !locked;
    }
    chkSame.onClick = syncMarginFields;
    syncMarginFields();

    var pnlGrid = win.add("panel", undefined, "栅格");
    pnlGrid.orientation = "column";
    pnlGrid.alignChildren = ["fill", "top"];
    pnlGrid.spacing = 4;

    var rowCol = pnlGrid.add("group");
    rowCol.add("statictext", undefined, "列");
    var edtCols = rowCol.add("edittext", undefined, "12");
    edtCols.characters = 4;
    rowCol.add("statictext", undefined, "列间距");
    var edtColGutter = rowCol.add("edittext", undefined, "5");
    edtColGutter.characters = 5;

    var rowRow = pnlGrid.add("group");
    rowRow.add("statictext", undefined, "行");
    var edtRows = rowRow.add("edittext", undefined, "0");
    edtRows.characters = 4;
    rowRow.add("statictext", undefined, "行间距");
    var edtRowGutter = rowRow.add("edittext", undefined, "5");
    edtRowGutter.characters = 5;

    var chkMid = pnlGrid.add("checkbox", undefined, "在间距中加中线");
    chkMid.value = false;

    var lblHint = win.add("statictext", undefined, "生成会叠加，不覆盖已有参考线", { multiline: true });
    lblHint.preferredSize.width = 240;

    var grpMain = win.add("group");
    grpMain.alignment = ["fill", "center"];
    var btnGrid = grpMain.add("button", undefined, "生成栅格");
    var btnOutline = grpMain.add("button", undefined, "四边");
    var btnMid = grpMain.add("button", undefined, "中线");

    var grpMore = win.add("group");
    grpMore.alignment = ["fill", "center"];
    var btnClear = grpMore.add("button", undefined, "清除");
    var btnClose = grpMore.add("button", undefined, "关闭");

    var lblStatus = win.add("statictext", undefined, "就绪");
    lblStatus.alignment = ["fill", "center"];

    function currentScope() {
        if (rbAll.value) return "all";
        if (rbSel.value) return "selection";
        return "active";
    }

    function collectOpts(action) {
        return {
            action: action,
            scope: currentScope(),
            unit: ddlUnit.selection ? ddlUnit.selection.text : "mm",
            sameMargin: chkSame.value,
            margin: edtMargin.text,
            top: edtTop.text,
            right: edtRight.text,
            bottom: edtBottom.text,
            left: edtLeft.text,
            cols: edtCols.text,
            colGutter: edtColGutter.text,
            rows: edtRows.text,
            rowGutter: edtRowGutter.text,
            midGutter: chkMid.value
        };
    }

    function go(action, busyText) {
        lblStatus.text = busyText;
        dispatch(collectOpts(action), function (msg) {
            lblStatus.text = msg || "完成";
        });
    }

    btnGrid.onClick = function () {
        go("grid", "正在生成栅格...");
    };
    btnOutline.onClick = function () {
        go("outline", "正在添加四边...");
    };
    btnMid.onClick = function () {
        go("mid", "正在添加中线...");
    };
    btnClear.onClick = function () {
        go("clear", "正在清除...");
    };
    btnClose.onClick = function () {
        win.close();
    };

    win.show();
})();
