/**
 * Vector Toolbox - Storage Manager
 * Handles persistence for recents, favorites, and user settings
 */

var VTStorage = $.global.VTStorage = (function () {
    var storage = {};
    var rootFolder = null;
    var userFolder = null;

    storage.init = function (basePath) {
        if (basePath) {
            rootFolder = new Folder(basePath);
        } else {
            rootFolder = new File($.fileName).parent.parent;
        }
        userFolder = new Folder(rootFolder.fsName + "/user");
        if (!userFolder.exists) {
            userFolder.create();
        }
    };

    function getFile(fileName) {
        if (!userFolder) storage.init();
        return new File(userFolder.fsName + "/" + fileName);
    }

    function readFile(fileName, defaultValue) {
        var file = getFile(fileName);
        if (!file.exists) {
            return defaultValue;
        }
        try {
            file.encoding = "UTF-8";
            if (file.open("r")) {
                var content = file.read();
                file.close();
                var data = VTUtils.parseJSON(content);
                return data !== null ? data : defaultValue;
            }
        } catch (e) {}
        return defaultValue;
    }

    function writeFile(fileName, data) {
        var file = getFile(fileName);
        try {
            file.encoding = "UTF-8";
            if (file.open("w")) {
                file.write(VTUtils.toJSON(data));
                file.close();
                return true;
            }
        } catch (e) {}
        return false;
    }

    // --- Recents Management ---
    storage.getRecents = function (maxCount) {
        maxCount = maxCount || 6;
        var list = readFile("recents.json", []);
        if (!(list instanceof Array)) list = [];
        return list.slice(0, maxCount);
    };

    storage.addRecent = function (toolId, maxCount) {
        maxCount = maxCount || 6;
        if (!toolId) return;
        var list = readFile("recents.json", []);
        if (!(list instanceof Array)) list = [];

        var idx = VTUtils.indexOf(list, toolId);
        if (idx !== -1) {
            list.splice(idx, 1);
        }
        list.unshift(toolId);
        if (list.length > maxCount) {
            list = list.slice(0, maxCount);
        }
        writeFile("recents.json", list);
    };

    // --- Favorites Management ---
    storage.getFavorites = function () {
        var list = readFile("favorites.json", []);
        if (!(list instanceof Array)) list = [];
        return list;
    };

    storage.isFavorite = function (toolId) {
        var list = storage.getFavorites();
        return VTUtils.indexOf(list, toolId) !== -1;
    };

    storage.toggleFavorite = function (toolId) {
        var list = storage.getFavorites();
        var idx = VTUtils.indexOf(list, toolId);
        var isFav = false;
        if (idx !== -1) {
            list.splice(idx, 1);
            isFav = false;
        } else {
            list.push(toolId);
            isFav = true;
        }
        writeFile("favorites.json", list);
        return isFav;
    };

    // --- Settings Management ---
    storage.getSettings = function () {
        return readFile("settings.json", {
            width: 320,
            activeCategory: "全部",
            showRecents: true,
            showFavorites: true
        });
    };

    storage.saveSettings = function (settings) {
        return writeFile("settings.json", settings);
    };

    return storage;
})();
