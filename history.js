/**
 * Analysis History Module
 * Handles saving and loading analysis history using localStorage
 */

const HISTORY_KEY = 'mlda_analysis_history';
const MAX_HISTORY_ITEMS = 50;

/**
 * Save analysis to history
 * @param {Object} analysis - Analysis results
 * @param {string} code - Source code
 * @param {string} language - Programming language
 */
function saveToHistory(analysis, code, language) {
    try {
        if (!analysis || !code) {
            debugWarn('Invalid data for history save');
            return;
        }

        const history = getHistory();
        
        const historyItem = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            language: language || 'c',
            code: code.substring(0, 1000), // Store first 1000 chars
            codeLength: code.length,
            statistics: {
                totalAllocations: analysis.allocations ? analysis.allocations.length : 0,
                totalFrees: analysis.frees ? analysis.frees.length : 0,
                memoryLeaks: analysis.leaks ? analysis.leaks.length : 0,
                leakedBytes: analysis.leaks ? analysis.leaks.reduce((sum, leak) => sum + (leak.size || 0), 0) : 0,
                warnings: analysis.warnings ? analysis.warnings.length : 0
            }
        };

        // Add to beginning of history
        history.unshift(historyItem);

        // Limit history size
        if (history.length > MAX_HISTORY_ITEMS) {
            history.pop();
        }

        // Save to localStorage
        localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
        
        debugLog('Analysis saved to history');
    } catch (error) {
        debugError('Error saving to history:', error);
        // localStorage might be full or disabled
        if (error.name === 'QuotaExceededError') {
            notifications.warning('History storage full. Oldest entries will be removed.');
            // Remove oldest entries
            const history = getHistory();
            history.splice(MAX_HISTORY_ITEMS / 2);
            try {
                localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
            } catch (e) {
                debugError('Failed to clear history:', e);
            }
        }
    }
}

/**
 * Get analysis history
 * @returns {Array} History array
 */
function getHistory() {
    try {
        const historyStr = localStorage.getItem(HISTORY_KEY);
        if (historyStr) {
            return JSON.parse(historyStr);
        }
        return [];
    } catch (error) {
        debugError('Error reading history:', error);
        return [];
    }
}

/**
 * Clear analysis history
 */
function clearHistory() {
    try {
        localStorage.removeItem(HISTORY_KEY);
        notifications.success('History cleared');
        debugLog('History cleared');
    } catch (error) {
        debugError('Error clearing history:', error);
        notifications.error('Failed to clear history');
    }
}

/**
 * Load analysis from history
 * @param {number} historyId - History item ID
 * @returns {Object|null} History item or null
 */
function loadFromHistory(historyId) {
    try {
        const history = getHistory();
        const item = history.find(h => h.id === historyId);
        return item || null;
    } catch (error) {
        debugError('Error loading from history:', error);
        return null;
    }
}

/**
 * Delete history item
 * @param {number} historyId - History item ID
 */
function deleteHistoryItem(historyId) {
    try {
        const history = getHistory();
        const filtered = history.filter(h => h.id !== historyId);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered));
        notifications.success('History item deleted');
        debugLog('History item deleted');
    } catch (error) {
        debugError('Error deleting history item:', error);
        notifications.error('Failed to delete history item');
    }
}

/**
 * Get history statistics
 * @returns {Object} Statistics object
 */
function getHistoryStats() {
    const history = getHistory();
    return {
        total: history.length,
        oldest: history.length > 0 ? history[history.length - 1].timestamp : null,
        newest: history.length > 0 ? history[0].timestamp : null
    };
}

/**
 * Create history UI
 */
function createHistoryUI() {
    // This will be called from the main script to add history panel
    // For now, we'll just provide the functions
}

