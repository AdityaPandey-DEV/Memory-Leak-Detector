// Utility functions

function performAnalysis(code, language = 'c') {
    const analyzer = new MemoryAnalyzer(language);
    const analysis = analyzer.analyze(code);
    analysis.timeline = analyzer.timeline;
    return analysis;
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

