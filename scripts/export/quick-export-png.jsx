/**
 * Vector Toolbox - Quick Export PNG (快速导出PNG)
 * Exports the active artboard directly to 300 DPI PNG in 1 click
 */

#target illustrator

(function () {
    if (!app.documents || app.documents.length === 0) {
        return "⚠ 无打开的文档";
    }

    var doc = app.activeDocument;
    var abIdx = doc.artboards.getActiveArtboardIndex();
    var ab = doc.artboards[abIdx];
    var abName = ab.name || ("Artboard_" + (abIdx + 1));
    var docBaseName = doc.name.replace(/\.[^\.]+$/, "");

    var destDir = doc.path.exists ? doc.path : Folder.desktop;
    var pngFile = new File(destDir.fsName + "/" + docBaseName + "_" + abName + "_300dpi.png");

    var pngOpts = new ExportOptionsPNG24();
    pngOpts.antiAliasing = true;
    pngOpts.transparency = true;
    pngOpts.artBoardClipping = true;
    pngOpts.horizontalScale = (300 / 72) * 100;
    pngOpts.verticalScale = (300 / 72) * 100;

    doc.exportFile(pngFile, ExportType.PNG24, pngOpts);

    return "✓ 已导出画板「" + abName + "」为 300DPI PNG";
})();
