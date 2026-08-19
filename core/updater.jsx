/**
 * Vector Toolbox - Core Auto-Updater Module
 * Checks GitHub for latest releases, shows changelog, and performs 1-click updates
 */

var VTUpdater = $.global.VTUpdater = (function () {
    var updater = {};

    updater.CURRENT_VERSION = "";
    updater.REPO_OWNER = "wynleywu";
    updater.REPO_NAME = "vector-toolbox";
    updater.RAW_VERSION_URL = "https://github.com/wynleywu/vector-toolbox/releases/latest/download/version.json";
    updater.GITHUB_URL = "https://github.com/wynleywu/vector-toolbox";

    var rootDir = null;

    function readLocalVersion(rootPath) {
        var versionFile = new File(rootPath + "/version.json");
        if (!versionFile.exists) {
            throw new Error("缺少本地版本清单: " + versionFile.fsName);
        }

        var opened = false;
        var content = "";
        try {
            versionFile.encoding = "UTF-8";
            if (!versionFile.open("r")) {
                throw new Error("无法读取本地版本清单: " + versionFile.fsName);
            }
            opened = true;
            content = versionFile.read();
        } finally {
            if (opened) versionFile.close();
        }

        var data = VTUtils.parseJSON(content);
        var version = data && data.version ? ("" + data.version) : "";
        if (!/^\d+\.\d+\.\d+$/.test(version)) {
            throw new Error("本地版本清单中的版本号无效: " + versionFile.fsName);
        }
        return version;
    }

    updater.init = function (rootPath) {
        rootDir = rootPath;
        updater.CURRENT_VERSION = readLocalVersion(rootDir);
    };

    // Semver comparison: returns true if v1 is newer than v2
    function isNewerVersion(vRemote, vCurrent) {
        if (!vRemote || !vCurrent) return false;
        var rParts = vRemote.replace(/^v/i, "").split(".");
        var cParts = vCurrent.replace(/^v/i, "").split(".");
        for (var i = 0; i < Math.max(rParts.length, cParts.length); i++) {
            var r = parseInt(rParts[i] || "0", 10);
            var c = parseInt(cParts[i] || "0", 10);
            if (r > c) return true;
            if (r < c) return false;
        }
        return false;
    }

    /**
     * Fetch remote version.json using system curl or powershell
     */
    updater.fetchRemoteVersion = function () {
        if (!rootDir) return null;
        var tempFile = new File(rootDir + "/user/temp_version.json");
        var tempPath = tempFile.fsName;

        // Ensure user directory exists
        var userDir = new Folder(rootDir + "/user");
        if (!userDir.exists) userDir.create();

        if (tempFile.exists) {
            try { tempFile.remove(); } catch (e) {}
        }

        var isWindows = ($.os.indexOf("Windows") !== -1);
        var cmd = "";

        if (isWindows) {
            cmd = 'cmd.exe /c "curl -L -s -k -m 8 "' + updater.RAW_VERSION_URL + '" -o "' + tempPath + '" || powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; (New-Object Net.WebClient).DownloadFile(\'' + updater.RAW_VERSION_URL + '\', \'' + tempPath + '\')""';
        } else {
            cmd = '/bin/bash -c "curl -L -s -k -m 8 \'' + updater.RAW_VERSION_URL + '\' -o \'' + tempPath + '\'"';
        }

        try {
            app.system(cmd);
        } catch (e) {
            return null;
        }

        if (!tempFile.exists || tempFile.length === 0) {
            return null;
        }

        try {
            tempFile.encoding = "UTF-8";
            tempFile.open("r");
            var content = tempFile.read();
            tempFile.close();
            tempFile.remove();
            return VTUtils.parseJSON(content);
        } catch (e) {
            return null;
        }
    };

    /**
     * Check for updates
     */
    updater.checkUpdate = function (silent, callback) {
        var remoteData = updater.fetchRemoteVersion();

        if (!remoteData || !remoteData.version) {
            if (!silent) {
                alert("未能获取到最新版本信息，请检查网络连接或访问 GitHub 仓库:\n" + updater.GITHUB_URL, "检查更新");
            }
            if (callback) callback(false, null);
            return;
        }

        var hasUpdate = isNewerVersion(remoteData.version, updater.CURRENT_VERSION);

        if (hasUpdate) {
            if (callback) callback(true, remoteData);
            updater.showUpdateDialog(remoteData);
        } else {
            if (!silent) {
                alert("当前已是最新版本 (v" + updater.CURRENT_VERSION + ")，无需更新。", "检查更新");
            }
            if (callback) callback(false, remoteData);
        }
    };

    /**
     * Show friendly update dialog
     */
    updater.showUpdateDialog = function (updateData) {
        var dlg = new Window("dialog", "发现新版本 - Vector Toolbox");
        dlg.orientation = "column";
        dlg.alignChildren = ["fill", "top"];
        dlg.spacing = 10;
        dlg.margins = 15;
        dlg.preferredSize.width = 380;

        var lblTitle = dlg.add("statictext", undefined, "[新版本] v" + updateData.version + " (当前: v" + updater.CURRENT_VERSION + ")");

        if (updateData.releaseDate) {
            dlg.add("statictext", undefined, "发布日期: " + updateData.releaseDate);
        }

        var pnlChangelog = dlg.add("panel", undefined, "本次更新内容");
        pnlChangelog.orientation = "column";
        pnlChangelog.alignChildren = ["fill", "top"];
        pnlChangelog.spacing = 4;
        pnlChangelog.margins = 10;

        if (updateData.changelog && updateData.changelog.length > 0) {
            for (var c = 0; c < updateData.changelog.length; c++) {
                var lblItem = pnlChangelog.add("statictext", undefined, "- " + updateData.changelog[c], { multiline: true });
                lblItem.alignment = ["fill", "top"];
            }
        } else {
            pnlChangelog.add("statictext", undefined, "- 性能优化与工具增强");
        }

        var grpBtns = dlg.add("group");
        grpBtns.alignment = ["fill", "center"];
        grpBtns.spacing = 8;

        var btnUpdateNow = grpBtns.add("button", undefined, "立即更新", { name: "ok" });
        var btnOpenWeb = grpBtns.add("button", undefined, "前往 GitHub");
        var btnCancel = grpBtns.add("button", undefined, "稍后提醒", { name: "cancel" });

        btnOpenWeb.onClick = function () {
            var url = updateData.releaseUrl || updater.GITHUB_URL;
            if ($.os.indexOf("Windows") !== -1) {
                app.system('cmd.exe /c start "" "' + url + '"');
            } else {
                app.system('open "' + url + '"');
            }
        };

        if (dlg.show() === 1) {
            updater.performUpdate();
        }
    };

    /**
     * Perform update via git pull or download script
     */
    updater.performUpdate = function () {
        var isWindows = ($.os.indexOf("Windows") !== -1);
        var rootF = new Folder(rootDir);
        var gitDir = new Folder(rootDir + "/.git");
        var success = false;

        if (gitDir.exists) {
            var pullCmd = isWindows ?
                'cmd.exe /c "cd /d "' + rootF.fsName + '" && git pull origin master"' :
                '/bin/bash -c "cd \'' + rootF.fsName + '\' && git pull origin master"';

            try {
                app.system(pullCmd);
                success = true;
            } catch (e) {
                success = false;
            }
        } else {
            if (isWindows) {
                var updateBat = new File(rootDir + "/update-windows.bat");
                if (updateBat.exists) {
                    app.system('cmd.exe /c ""' + updateBat.fsName + '" --no-pause"');
                    success = true;
                }
            } else {
                var updateSh = new File(rootDir + "/update-macos.sh");
                if (updateSh.exists) {
                    app.system('/bin/bash \'' + updateSh.fsName + '\'');
                    success = true;
                }
            }
        }

        if (success) {
            alert("更新已执行完成！\n\n请在面板底部点击【刷新】即可载入新版本组件与工具。", "Vector Toolbox 更新完成");
        } else {
            alert("自动更新未能完成，请手动访问 GitHub 下载最新安装包覆盖:\n" + updater.GITHUB_URL, "更新提示");
        }
    };

    return updater;
})();
