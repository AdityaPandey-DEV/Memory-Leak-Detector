/**
 * Utility Functions
 * Helper functions for analysis and formatting
 */

/**
 * Perform memory analysis on code
 * @param {string} code - Source code to analyze
 * @param {string} language - Programming language
 * @returns {Object} Analysis results
 */
function performAnalysis(code, language = 'c') {
    try {
        if (!code || typeof code !== 'string') {
            throw new Error('Invalid code input: code must be a non-empty string');
        }

        if (!language || typeof language !== 'string') {
            language = 'c';
        }

        const analyzer = new MemoryAnalyzer(language);
        const analysis = analyzer.analyze(code);
        analysis.timeline = analyzer.timeline;
        return analysis;
    } catch (error) {
        debugError('Error in performAnalysis:', error);
        // Return empty analysis instead of throwing
        // This allows the UI to display results (even if empty) instead of an error
        return {
            allocations: [],
            frees: [],
            leaks: [],
            warnings: [{
                type: 'Analysis Error',
                line: 0,
                message: 'Analysis failed: ' + error.message + '. Please check your code for syntax errors.',
                lineText: ''
            }],
            timeline: []
        };
    }
}

/**
 * Format bytes to human-readable string
 * @param {number} bytes - Number of bytes
 * @returns {string} Formatted string (e.g., "1.5 KB")
 */
function formatBytes(bytes) {
    try {
        if (typeof bytes !== 'number' || isNaN(bytes) || bytes < 0) {
            return '0 B';
        }

        if (bytes === 0) return '0 B';
        
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        const size = bytes / Math.pow(k, i);
        return Math.round(size * 100) / 100 + ' ' + sizes[Math.min(i, sizes.length - 1)];
    } catch (error) {
        debugError('Error formatting bytes:', error);
        return '0 B';
    }
}

