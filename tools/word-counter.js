(function () {
    window.LitescanTools = window.LitescanTools || {};

    window.LitescanTools.wordCounter = {
        name: 'Word Counter',
        description: 'Count characters, words, sentences, paragraphs, and reading time.',
        status: 'ready',
        sanitizeText(rawText) {
            return (rawText || '')
                .replace(/\u00A0/g, ' ')
                .replace(/[\u200B-\u200D\uFEFF]/g, '')
                .replace(/\r\n?/g, '\n')
                .replace(/\t/g, ' ')
                .replace(/\u2028/g, '\n')
                .replace(/\u2029/g, '\n')
                .trim();
        },
        countWords(rawText) {
            const text = this.sanitizeText(rawText).replace(/\s+/g, ' ').trim();
            if (!text) return 0;
            return (text.match(/[A-Za-z0-9]+(?:['-][A-Za-z0-9]+)*/g) || []).length;
        },
        countSentences(rawText) {
            const text = this.sanitizeText(rawText);
            if (!text) return 0;

            const parts = text
                .split(/(?<=[.!?])(?:\s+|\n+)/)
                .map(part => part.trim())
                .filter(part => part.length > 0);

            return parts.length;
        },
        countParagraphs(rawText) {
            const text = this.sanitizeText(rawText);
            if (!text) return 0;

            return text
                .split(/\n\s*\n+/)
                .map(part => part.trim())
                .filter(part => part.length > 0).length;
        },
        readingTimeInSeconds(rawText) {
            const words = this.countWords(rawText);
            if (!words) return 0;
            return Math.max(1, Math.ceil(words / 200 * 60));
        }
    };
})();
