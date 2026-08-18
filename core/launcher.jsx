/**
 * Vector Toolbox - Tool Launcher
 * Executes scripts by mode (action, dialog, palette), manages status updates and recents
 */

var VTLauncher = $.global.VTLauncher = (function () {
    var launcher = {};
    var rootPath = "";
    var statusCallback = null;

    launcher.init = function (basePath, onStatusUpdate) {
        rootPath = basePath || (new File($.fileName)).parent.parent.fsName;
        statusCallback = onStatusUpdate || null;
    };

    launcher.setStatus = function (msg, type) {
        // type: "info" | "success" | "warning" | "error"
        if (statusCallback) {
            statusCallback(msg, type || "info");
        }
    };

    launcher.resolveScriptFile = function (relativePath) {
        var cleanPath = relativePath.replace(/\\/g, "/");
        if (cleanPath.indexOf(":") !== -1 || cleanPath.indexOf("/") === 0) {
            return new File(cleanPath);
        }
        return new File(rootPath + "/" + cleanPath);
    };

    function applyResultStatus(tool, result) {
        var text = result === undefined || result === null ? "" : ("" + result);
        if (text === "undefined" || text === "null") {
            text = "";
        }
        if (text.length > 0) {
            launcher.setStatus(text, "success");
        } else {
            launcher.setStatus("✓ " + tool.name + " 执行完成", "success");
        }
    }

    function evalInCurrentEngine(code) {
        return $.global.eval(code);
    }

    launcher.run = function (tool) {
        if (!tool) {
            launcher.setStatus("未指定工具", "error");
            return;
        }

        var scriptFile = launcher.resolveScriptFile(tool.script);
        if (!scriptFile.exists) {
            launcher.setStatus("找不到脚本: " + tool.name + " (" + tool.script + ")", "error");
            return;
        }

        var code;
        try {
            code = VTUtils.readJsxSource(scriptFile);
        } catch (readErr) {
            launcher.setStatus("× " + tool.name + " 失败: " + (readErr.message || readErr.toString()), "error");
            return;
        }

        if (typeof VTStorage !== "undefined") {
            VTStorage.addRecent(tool.id);
        }

        launcher.setStatus("正在运行: " + tool.name + "...", "info");

        try {
            if (tool.mode === "palette") {
                // Keep the sub-palette in this persistent engine so its handlers stay alive.
                evalInCurrentEngine(code);
                launcher.setStatus("已启动: " + tool.name, "success");
                return;
            }

            // Dialog/action must leave the palette event loop; otherwise
            // modal windows and DOM writes are ignored or crash on several AI versions.
            if (typeof VTBridge !== "undefined") {
                VTBridge.runAsync(
                    code,
                    function (result) {
                        applyResultStatus(tool, result);
                    },
                    function (errMsg) {
                        launcher.setStatus("× " + tool.name + " 失败: " + errMsg, "error");
                    }
                );
                return;
            }

            applyResultStatus(tool, evalInCurrentEngine(code));
        } catch (e) {
            launcher.setStatus("× " + tool.name + " 失败: " + (e.message || e.toString()), "error");
        }
    };

    return launcher;
})();
