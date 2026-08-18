/**
 * Vector Toolbox - Tool Registry
 * Manages tool discovery, metadata validation, categories, and search indexing
 */

var VTRegistry = $.global.VTRegistry = (function () {
    var registry = {};
    var toolsList = [];
    var toolsById = {};
    var categories = ["全部"];

    registry.registerAll = function (tools) {
        toolsList = [];
        toolsById = {};
        categories = ["全部"];

        if (!tools || !(tools instanceof Array)) return;

        for (var i = 0; i < tools.length; i++) {
            registry.register(tools[i]);
        }
    };

    registry.register = function (tool) {
        if (!tool || !tool.id || !tool.name || !tool.script) {
            return false;
        }

        // Default values
        tool.category = tool.category || "其它";
        tool.mode = tool.mode || "action"; // "action" | "dialog" | "palette"
        tool.keywords = tool.keywords || [];
        tool.description = tool.description || "";
        tool.author = tool.author || "Vector Toolbox";
        tool.version = tool.version || "1.0.0";

        toolsList.push(tool);
        toolsById[tool.id] = tool;

        if (VTUtils.indexOf(categories, tool.category) === -1) {
            categories.push(tool.category);
        }

        return true;
    };

    registry.getAll = function () {
        return toolsList.slice(0);
    };

    registry.getById = function (id) {
        return toolsById[id] || null;
    };

    registry.getCategories = function () {
        return categories.slice(0);
    };

    registry.getByCategory = function (category) {
        if (!category || category === "全部") {
            return registry.getAll();
        }
        return VTUtils.filter(toolsList, function (tool) {
            return tool.category === category;
        });
    };

    /**
     * Search tools by query matching against name, category, keywords, and description.
     */
    registry.search = function (query, category) {
        var baseList = registry.getByCategory(category);
        var q = VTUtils.trim(query).toLowerCase();
        if (!q) {
            return baseList;
        }

        return VTUtils.filter(baseList, function (tool) {
            // Check name
            if (tool.name.toLowerCase().indexOf(q) !== -1) return true;
            // Check category
            if (tool.category.toLowerCase().indexOf(q) !== -1) return true;
            // Check description
            if (tool.description && tool.description.toLowerCase().indexOf(q) !== -1) return true;
            // Check keywords
            if (tool.keywords && tool.keywords instanceof Array) {
                for (var i = 0; i < tool.keywords.length; i++) {
                    if (("" + tool.keywords[i]).toLowerCase().indexOf(q) !== -1) {
                        return true;
                    }
                }
            }
            return false;
        });
    };

    return registry;
})();
