# Tool Development Guide

This guide walks you through creating and integrating new JSX tools into **Vector Toolbox**.

---

## 1. Tool Anatomy

Choose one of three modes depending on your tool's needs:

### A. Action Mode (Instant Execution)

Best for 1-click cleanups, generators, or formatters with no user parameters.

```javascript
#target illustrator

(function () {
    if (!app.documents || app.documents.length === 0) {
        return "⚠ 无打开的文档";
    }

    var doc = app.activeDocument;
    var sel = doc.selection;
    if (!sel || sel.length === 0) {
        return "⚠ 请先选择对象";
    }

    // Perform operations...
    for (var i = 0; i < sel.length; i++) {
        sel[i].rotate(45);
    }

    // Return status message for status bar
    return "✓ 已旋转 " + sel.length + " 个对象 45°";
})();
```

---

### B. Dialog Mode (Modal Parameter Input)

Best for tools that require user configuration before executing.

```javascript
#target illustrator

(function () {
    if (!app.documents || app.documents.length === 0) {
        alert("请先打开一个文档！");
        return;
    }

    var dlg = new Window("dialog", "自定义旋转 - Vector Toolbox");
    dlg.orientation = "column";

    var grp = dlg.add("group");
    grp.add("statictext", undefined, "旋转角度:");
    var edtAngle = grp.add("edittext", undefined, "90");
    edtAngle.characters = 5;

    var grpBtns = dlg.add("group");
    grpBtns.add("button", undefined, "确定", { name: "ok" });
    grpBtns.add("button", undefined, "取消", { name: "cancel" });

    if (dlg.show() !== 1) return;

    var angle = parseFloat(edtAngle.text) || 0;
    var sel = app.activeDocument.selection;
    for (var i = 0; i < sel.length; i++) {
        sel[i].rotate(angle);
    }

    return "✓ 已旋转 " + sel.length + " 个对象 " + angle + "°";
})();
```

---

### C. Palette Mode (Resident Sub-Window)

Best for tools requiring persistent, repeated interaction on the canvas.

```javascript
#target illustrator
#targetengine "MyCustomSubEngine"

(function () {
    var win = new Window("palette", "实时属性调整", undefined, { resizeable: true });
    win.orientation = "column";

    var btn = win.add("button", undefined, "更新选区");
    btn.onClick = function () {
        if (!app.documents || app.documents.length === 0) return;
        // Do live work...
    };

    win.show();
})();
```

---

## 2. Registering in `config/tools.jsx`

Add an entry to the `TOOLBOX_CONFIG` array:

```javascript
{
    id: "my-awesome-tool",
    name: "工具名称",
    category: "分类名称", // "标注" | "对象" | "画板" | "导出" | 自定义
    script: "scripts/<category>/my-awesome-tool.jsx",
    mode: "action", // "action" | "dialog" | "palette"
    keywords: ["关键词1", "关键词2", "tag"],
    description: "简短描述该工具的功能与用法",
    author: "Your Name",
    version: "1.0.0"
}
```

---

## 3. Testing & Hot Reload

1. Save your `.jsx` file.
2. In Vector Toolbox, click **↻ 刷新 (Refresh)** in the bottom bar.
3. Your tool is immediately indexed and available in the list and search bar!
