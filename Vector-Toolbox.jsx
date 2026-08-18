/**
 * Vector Toolbox - Main UI Shell & Launcher
 *
 * An open-source, modular, and extensible ScriptUI palette for Adobe Illustrator.
 * GitHub: https://github.com/wynleywu/vector-toolbox
 *
 * @version 1.2.0
 * @license MIT
 */

#target illustrator
#targetengine "VectorToolboxMainEngine"

(function () {
    try {
        // --- 1. Bootstrap & Module Loading ---
        var rootPath = "";

        function normalizeDir(dir) {
            return ("" + dir).replace(/\\/g, "/");
        }

        function dirHasCore(dir) {
            return !!dir && new File(dir + "/core/utils.jsx").exists;
        }

        if (typeof $.global.VECTOR_TOOLBOX_ROOT === "string" && dirHasCore($.global.VECTOR_TOOLBOX_ROOT)) {
            rootPath = normalizeDir($.global.VECTOR_TOOLBOX_ROOT);
        }

        if (!rootPath) {
            try {
                var scriptFile = new File($.fileName);
                if (scriptFile.exists && dirHasCore(scriptFile.parent.fsName)) {
                    rootPath = normalizeDir(scriptFile.parent.fsName);
                }
            } catch (e) {}
        }

        if (!rootPath) {
            var picked = Folder.selectDialog("未能定位 Vector Toolbox，请选择项目根目录（内含 core 与 scripts）：");
            if (picked && dirHasCore(picked.fsName)) {
                rootPath = normalizeDir(picked.fsName);
            }
        }

        if (!rootPath) {
            alert("无法定位 Vector Toolbox 根目录（缺少 core/utils.jsx）。\n请从项目中的 Vector-Toolbox.jsx 启动，或重新运行安装器。");
            return;
        }

        $.global.VECTOR_TOOLBOX_ROOT = rootPath;

        function loadModule(relativePath) {
            var f = new File(rootPath + "/" + relativePath);
            if (f.exists) {
                try {
                    f.encoding = "UTF-8";
                    if (f.open("r")) {
                        var code = f.read();
                        f.close();
                        code = code.replace(/^\s*#target[^\r\n]*/mg, "// $&");
                        $.global.eval(code);
                    }
                } catch (e) {
                    alert("加载核心模块失败: " + relativePath + "\n" + (e.message || e.toString()));
                }
            } else {
                alert("找不到核心模块: " + relativePath);
            }
        }

        // Load Core Architecture Modules
        loadModule("core/utils.jsx");
        loadModule("core/storage.jsx");
        loadModule("core/registry.jsx");
        loadModule("core/bridge.jsx");
        loadModule("core/launcher.jsx");
        loadModule("core/updater.jsx");
        loadModule("config/tools.jsx");

        // Initialize Storage & Updater
        VTStorage.init(rootPath);
        VTUpdater.init(rootPath);

        // Initialize Registry
        if (typeof $.global.TOOLBOX_CONFIG !== "undefined") {
            VTRegistry.registerAll($.global.TOOLBOX_CONFIG);
        }

        // Initialize Launcher with Status Callback
        var uiState = {
            lastToolId: ""
        };

        try {
            var bootSettings = VTStorage.getSettings();
            if (bootSettings.lastToolId) uiState.lastToolId = bootSettings.lastToolId;
        } catch (bootErr) {}

        function persistUiState() {
            try {
                var settings = VTStorage.getSettings();
                settings.lastToolId = uiState.lastToolId;
                VTStorage.saveSettings(settings);
            } catch (e) {}
        }

        function tintStatus(type) {
            if (!lblStatus || !lblStatus.graphics) return;
            try {
                var g = lblStatus.graphics;
                var rgb = null;
                if (type === "error") rgb = [0.78, 0.22, 0.18];
                else if (type === "warning") rgb = [0.72, 0.46, 0.08];
                else if (type === "success") rgb = [0.16, 0.5, 0.28];
                if (rgb) {
                    g.foregroundColor = g.newPen(g.PenType.SOLID_COLOR, rgb, 1);
                }
            } catch (e) {}
        }

        function updateStatus(msg, type) {
            if (!win || !lblStatus) return;
            var prefix = "";
            if (type === "error") prefix = "[x] ";
            else if (type === "warning") prefix = "[!] ";
            lblStatus.text = prefix + msg;
            tintStatus(type || "info");
            if (win.visible) {
                VTUtils.safeLayout(win);
            }
        }

        VTLauncher.init(rootPath, updateStatus);

        // --- 2. Build ScriptUI Floating Palette (Singleton Safe) ---
        if ($.global.vectorToolboxWindow && $.global.vectorToolboxWindow instanceof Window) {
            try {
                if ($.global.vectorToolboxWindow.visible) {
                    $.global.vectorToolboxWindow.active = true;
                    return;
                }
            } catch (e) {
                $.global.vectorToolboxWindow = null;
            }
        }

        var win = new Window("palette", "Vector Toolbox", undefined, { resizeable: true });
        $.global.vectorToolboxWindow = win;

        win.onClose = function () {
            $.global.vectorToolboxWindow = null;
        };

        win.orientation = "column";
        win.alignChildren = ["fill", "top"];
        win.spacing = 8;
        win.margins = 10;
        win.preferredSize.width = 280;
        try {
            win.minimumSize = [240, 280];
        } catch (minErr) {}

        var grpList = win.add("group");
        grpList.orientation = "column";
        grpList.alignChildren = ["fill", "top"];
        grpList.alignment = ["fill", "top"];
        grpList.spacing = 6;

        var pnlStatus = win.add("panel");
        pnlStatus.orientation = "row";
        pnlStatus.alignment = ["fill", "bottom"];
        pnlStatus.margins = [6, 4, 6, 4];

        var lblStatus = pnlStatus.add("statictext", undefined, "就绪");
        lblStatus.alignment = ["fill", "center"];

        var grpFooter = win.add("group");
        grpFooter.orientation = "row";
        grpFooter.alignment = ["fill", "bottom"];
        grpFooter.spacing = 6;

        var btnRefresh = grpFooter.add("button", undefined, "刷新");
        btnRefresh.alignment = ["fill", "center"];
        btnRefresh.helpTip = "重新载入工具配置";

        var btnUpdate = grpFooter.add("button", undefined, "更新");
        btnUpdate.alignment = ["fill", "center"];
        btnUpdate.helpTip = "检查 GitHub 最新版本";

        var btnAbout = grpFooter.add("button", undefined, "关于");
        btnAbout.alignment = ["fill", "center"];
        btnAbout.helpTip = "版本与开源说明";

        win.onResizing = win.onResize = function () {
            try {
                this.layout.resize();
            } catch (e) {}
        };

        function launchTool(tool) {
            if (!tool) return;
            uiState.lastToolId = tool.id;
            persistUiState();
            updateStatus("正在打开: " + tool.name + "...", "info");
            VTLauncher.run(tool);
            renderTools();
        }

        function renderTools() {
            var l;
            for (l = grpList.children.length - 1; l >= 0; l--) {
                grpList.remove(grpList.children[l]);
            }

            var tools = VTRegistry.getAll();
            if (tools.length === 0) {
                var lblEmpty = grpList.add("statictext", undefined, "暂无工具");
                lblEmpty.alignment = ["center", "center"];
            } else {
                var i;
                for (i = 0; i < tools.length; i++) {
                    (function (t) {
                        var btn = grpList.add("button", undefined, t.name);
                        btn.alignment = ["fill", "center"];
                        btn.helpTip = t.description;
                        btn.onClick = function () {
                            launchTool(t);
                        };
                    })(tools[i]);
                }
            }

            VTUtils.safeLayout(win);
        }

        btnRefresh.onClick = function () {
            try {
                loadModule("config/tools.jsx");
                if (typeof $.global.TOOLBOX_CONFIG !== "undefined") {
                    VTRegistry.registerAll($.global.TOOLBOX_CONFIG);
                }
                renderTools();
                updateStatus("已刷新 · " + VTRegistry.getAll().length + " 个工具", "success");
            } catch (e) {
                updateStatus("刷新失败: " + e.message, "error");
            }
        };

        btnUpdate.onClick = function () {
            updateStatus("正在检查最新版本...", "warning");
            VTUpdater.checkUpdate(false, function (hasUpdate, data) {
                if (!hasUpdate) {
                    updateStatus("已是最新版 v" + VTUpdater.CURRENT_VERSION, "success");
                }
            });
        };

        btnAbout.onClick = function () {
            alert(
                "Vector Toolbox  v" + VTUpdater.CURRENT_VERSION + "\n" +
                "Illustrator " + VTUtils.getAiYear() + "  ·  MIT",
                "关于"
            );
        };

        renderTools();
        win.show();
    } catch (globalErr) {
        alert("Vector Toolbox 启动异常:\n" + (globalErr.message || globalErr.toString()), "Vector Toolbox 错误");
    }
})();
