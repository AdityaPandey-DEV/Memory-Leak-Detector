// Configuration and Constants

const CONFIG = {
    // Type sizes in bytes
    TYPE_SIZES: {
        CHAR: 1,
        SHORT: 2,
        INT: 4,
        FLOAT: 4,
        DOUBLE: 8,
        LONG_LONG: 8,
        LONG_DOUBLE: 16,
        DEFAULT: 4
    },
    
    // Language-specific size estimates
    LANGUAGE_SIZES: {
        javascript: 8,
        python: 8,
        rust: 8,
        go: 8,
        java: 4,
        c: 4,
        cpp: 4
    },
    
    // Chart colors
    CHART_COLORS: {
        ALLOCATED: '#3B82F6',
        FREED: '#10B981',
        LEAKED: '#EF4444',
        BORDER: '#fff'
    },
    
    // UI Settings
    UI: {
        CHART_DELAY: 100, // ms delay for chart rendering
        DEBOUNCE_DELAY: 300, // ms for debouncing
        TOAST_DURATION: 3000 // ms for toast notifications
    },
    
    // Debug mode
    DEBUG: false // Set to true for development
};

// Utility function for conditional logging
function debugLog(...args) {
    if (CONFIG.DEBUG) {
        console.log(...args);
    }
}

function debugError(...args) {
    if (CONFIG.DEBUG) {
        console.error(...args);
    }
}

function debugWarn(...args) {
    if (CONFIG.DEBUG) {
        console.warn(...args);
    }
}

