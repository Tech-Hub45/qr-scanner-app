(function () {
    window.LitescanTools = window.LitescanTools || {};

    window.LitescanTools.registry = {
        qrScanner: 'tools/qr-scanner.js',
        qrGenerator: 'tools/qr-generator.js',
        ocr: 'tools/ocr.js',
        pdfTools: 'tools/pdf-tools.js',
        wordCounter: 'tools/word-counter.js',
        history: 'tools/history/history.js',
        ocrTool: 'tools/advanced/ocr-tool.js',
        imageCompressor: 'tools/advanced/image-compressor.js',
        imageWatermark: 'tools/advanced/image-watermark.js',
        imageFormatConverter: 'tools/advanced/image-format-converter.js',
        settings: 'tools/settings.js'
    };

    window.LitescanTools.list = function () {
        return Object.keys(window.LitescanTools.registry);
    };
})();
