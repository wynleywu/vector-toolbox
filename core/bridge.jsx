/**
 * Vector Toolbox - BridgeTalk & Script Execution Engine
 * Provides stable IPC / script evaluation between ScriptUI palettes and Illustrator DOM
 */

var VTBridge = $.global.VTBridge = (function () {
    var bridge = {};

    bridge.getAppSpecifier = function () {
        if (typeof BridgeTalk !== "undefined" && BridgeTalk.appSpecifier) {
            return BridgeTalk.appSpecifier;
        }
        return "illustrator";
    };

    /**
     * Run code or script file via BridgeTalk
     */
    bridge.runAsync = function (scriptCode, onResult, onError) {
        if (typeof BridgeTalk === "undefined") {
            try {
                var res = eval(scriptCode);
                if (onResult) onResult(res);
            } catch (e) {
                if (onError) onError(e.toString());
            }
            return;
        }

        var bt = new BridgeTalk();
        bt.target = bridge.getAppSpecifier();
        // BridgeTalk doubles every backslash in the message body, which turns
        // "\/" inside a regex literal into an unescaped "/" and breaks parsing.
        // Percent-encoding keeps the body free of backslashes and quotes.
        // encodeURIComponent leaves "'" unescaped but escapes '"', so quote with '"'.
        bt.body = 'eval(decodeURIComponent("' + encodeURIComponent(scriptCode) + '"))';

        bt.onResult = function (resObj) {
            if (onResult) {
                onResult(resObj.body);
            }
        };

        bt.onError = function (errObj) {
            if (onError) {
                onError(errObj.body);
            }
        };

        bt.send();
    };

    /**
     * Execute a script file safely
     */
    bridge.evalScriptFile = function (fileObj, onResult, onError) {
        if (!fileObj || !fileObj.exists) {
            var errMsg = "脚本文件不存在: " + (fileObj ? fileObj.fsName : "null");
            if (onError) onError(errMsg);
            return;
        }

        try {
            var code = VTUtils.readJsxSource(fileObj);
            bridge.runAsync(code, onResult, onError);
        } catch (e) {
            if (onError) onError(e.toString());
        }
    };

    return bridge;
})();
