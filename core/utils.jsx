/**
 * Vector Toolbox - Core Utilities
 * ExtendScript ES3 Compatible
 */

var VTUtils = $.global.VTUtils = (function () {
    var utils = {};

    // --- Array & String Helpers (ES3 Polyfills) ---

    utils.trim = function (str) {
        if (!str) return "";
        return ("" + str).replace(/^\s+|\s+$/g, "");
    };

    utils.indexOf = function (arr, item) {
        if (!arr) return -1;
        for (var i = 0; i < arr.length; i++) {
            if (arr[i] === item) return i;
        }
        return -1;
    };

    utils.forEach = function (arr, fn) {
        if (!arr || !fn) return;
        for (var i = 0; i < arr.length; i++) {
            fn(arr[i], i, arr);
        }
    };

    utils.filter = function (arr, fn) {
        var res = [];
        if (!arr || !fn) return res;
        for (var i = 0; i < arr.length; i++) {
            if (fn(arr[i], i, arr)) {
                res.push(arr[i]);
            }
        }
        return res;
    };

    utils.map = function (arr, fn) {
        var res = [];
        if (!arr || !fn) return res;
        for (var i = 0; i < arr.length; i++) {
            res.push(fn(arr[i], i, arr));
        }
        return res;
    };

    // --- Lightweight JSON Serializer / Parser Fallback ---

    utils.toJSON = function (obj) {
        if (typeof JSON !== "undefined" && JSON.stringify) {
            try {
                return JSON.stringify(obj, null, 2);
            } catch (e) {}
        }
        return serialize(obj);

        function serialize(v) {
            if (v === null) return "null";
            if (typeof v === "undefined") return "undefined";
            if (typeof v === "number" || typeof v === "boolean") return "" + v;
            if (typeof v === "string") {
                return '"' + v.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n").replace(/\r/g, "\\r") + '"';
            }
            if (v instanceof Array) {
                var arrItems = [];
                for (var i = 0; i < v.length; i++) {
                    arrItems.push(serialize(v[i]));
                }
                return "[" + arrItems.join(",") + "]";
            }
            if (typeof v === "object") {
                var objItems = [];
                for (var k in v) {
                    if (v.hasOwnProperty(k)) {
                        objItems.push(serialize(k) + ":" + serialize(v[k]));
                    }
                }
                return "{" + objItems.join(",") + "}";
            }
            return '""';
        }
    };

    utils.parseJSON = function (str) {
        if (!str) return null;
        if (typeof JSON !== "undefined" && JSON.parse) {
            try {
                return JSON.parse(str);
            } catch (e) {}
        }
        try {
            return eval("(" + str + ")");
        } catch (e) {
            return null;
        }
    };

    // --- Unit Conversions ---
    // Adobe Illustrator internal base unit is PostScript Points (pt, 72 pt = 1 inch, 1 pt = 0.352777778 mm)
    var PT_PER_INCH = 72;
    var MM_PER_INCH = 25.4;
    var PT_PER_MM = PT_PER_INCH / MM_PER_INCH; // 2.83464567

    utils.toPoints = function (val, unit) {
        var num = parseFloat(val) || 0;
        switch (unit.toLowerCase()) {
            case "mm":
                return num * PT_PER_MM;
            case "cm":
                return num * PT_PER_MM * 10;
            case "in":
            case "inch":
                return num * PT_PER_INCH;
            case "px":
            case "pt":
            default:
                return num;
        }
    };

    utils.fromPoints = function (points, unit, decimals) {
        var num = parseFloat(points) || 0;
        var res = 0;
        switch (unit.toLowerCase()) {
            case "mm":
                res = num / PT_PER_MM;
                break;
            case "cm":
                res = (num / PT_PER_MM) / 10;
                break;
            case "in":
            case "inch":
                res = num / PT_PER_INCH;
                break;
            case "px":
            case "pt":
            default:
                res = num;
                break;
        }
        if (typeof decimals === "number") {
            var factor = Math.pow(10, decimals);
            return Math.round(res * factor) / factor;
        }
        return res;
    };

    // --- Illustrator Document & Selection Helpers ---

    utils.hasDoc = function () {
        return (app.documents && app.documents.length > 0);
    };

    utils.getDoc = function () {
        if (!utils.hasDoc()) return null;
        return app.activeDocument;
    };

    utils.getSelection = function () {
        var doc = utils.getDoc();
        if (!doc) return [];
        return doc.selection || [];
    };

    /**
     * Get bounding box of item or array of items: [left, top, right, bottom]
     * In Illustrator:
     * bounds[0] = Left (X min)
     * bounds[1] = Top (Y max)
     * bounds[2] = Right (X max)
     * bounds[3] = Bottom (Y min)
     */
    utils.getBounds = function (items, useVisibleBounds) {
        if (!items) return null;
        if (!(items instanceof Array)) {
            items = [items];
        }
        if (items.length === 0) return null;

        var l = Infinity, t = -Infinity, r = -Infinity, b = Infinity;
        var found = false;

        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            var box = useVisibleBounds ? item.visibleBounds : item.geometricBounds;
            if (box && box.length === 4) {
                found = true;
                if (box[0] < l) l = box[0];
                if (box[1] > t) t = box[1];
                if (box[2] > r) r = box[2];
                if (box[3] < b) b = box[3];
            }
        }

        if (!found) return null;
        return [l, t, r, b];
    };

    utils.getWidth = function (bounds) {
        if (!bounds) return 0;
        return Math.abs(bounds[2] - bounds[0]);
    };

    utils.getHeight = function (bounds) {
        if (!bounds) return 0;
        return Math.abs(bounds[1] - bounds[3]);
    };

    // --- Layer Management ---

    utils.getOrCreateLayer = function (doc, layerName, isTopLevel) {
        if (!doc) doc = utils.getDoc();
        if (!doc) return null;

        for (var i = 0; i < doc.layers.length; i++) {
            if (doc.layers[i].name === layerName) {
                return doc.layers[i];
            }
        }

        var layer = doc.layers.add();
        layer.name = layerName;
        if (isTopLevel) {
            layer.zOrder(ZOrderMethod.BRINGTOFRONT);
        }
        return layer;
    };

    // --- Color Creators ---

    utils.createRGBColor = function (r, g, b) {
        var color = new RGBColor();
        color.red = r;
        color.green = g;
        color.blue = b;
        return color;
    };

    utils.createCMYKColor = function (c, m, y, k) {
        var color = new CMYKColor();
        color.cyan = c;
        color.magenta = m;
        color.yellow = y;
        color.black = k;
        return color;
    };

    // --- Host Illustrator 2021+ (v25.0 - v30.0+) Compatibility ---

    utils.getAiVersion = function () {
        var vStr = app.version || "0";
        var major = parseInt(vStr.split(".")[0], 10) || 0;
        return major;
    };

    utils.getAiYear = function () {
        var major = utils.getAiVersion();
        // Illustrator version to release year mapping:
        // v25 -> 2021, v26 -> 2022, v27 -> 2023, v28 -> 2024, v29 -> 2025, v30 -> 2026
        if (major >= 25) {
            return (1996 + major).toString(); // 1996 + 25 = 2021
        }
        return "CC (" + major + ")";
    };

    utils.is2021OrHigher = function () {
        return utils.getAiVersion() >= 25;
    };

    /**
     * Read JSX as UTF-8 and neutralize #target / #targetengine.
     * $.evalFile uses the host encoding and honors engine directives, so
     * UTF-8 BOM tools launched from a resident palette fail or do nothing.
     */
    utils.readJsxSource = function (fileOrPath) {
        var file = fileOrPath instanceof File ? fileOrPath : new File(fileOrPath);
        if (!file || !file.exists) {
            throw new Error("脚本不存在: " + (file ? file.fsName : String(fileOrPath)));
        }

        file.encoding = "UTF-8";
        var opened = false;
        try {
            if (!file.open("r")) {
                throw new Error(file.error || ("无法打开脚本: " + file.fsName));
            }
            opened = true;
            var code = file.read();
            if (code && code.charCodeAt(0) === 0xFEFF) {
                code = code.substring(1);
            }
            if (!code) {
                throw new Error("脚本为空: " + file.fsName);
            }
            // Anchor on spaces/tabs only: \s* would swallow the preceding newline
            // into the match and leave the directive itself uncommented.
            return code.replace(/^[ \t]*#target[^\r\n]*/mg, "// $&");
        } finally {
            if (opened) {
                try { file.close(); } catch (closeErr) {}
            }
        }
    };

    /**
     * Safe UI redraw to handle high-DPI / Retina scaling quirks in AI 2021-2026+
     */
    utils.safeLayout = function (win) {
        if (!win) return;
        try {
            if (win.layout) {
                win.layout.layout(true);
            }
        } catch (e) {}
    };

    return utils;
})();

