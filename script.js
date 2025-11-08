// Global variables
let memoryChart = null;
let timelineChart = null;
let currentAnalysis = null;
let selectedLanguage = 'c'; // Default language
let isAnalyzing = false; // Flag to prevent multiple simultaneous analyses
let analysisTimeout = null; // For debouncing

/**
 * Update language selection and placeholder
 */
function updateLanguage() {
    try {
        const languageSelect = document.getElementById('languageSelect');
        if (!languageSelect) {
            debugError('Language select element not found');
            return;
        }

        selectedLanguage = languageSelect.value;
        const codeEditor = document.getElementById('codeEditor');
        
        // Update placeholder based on language
        const placeholders = {
            'c': 'Enter your C code here...',
            'cpp': 'Enter your C++ code here...',
            'javascript': 'Enter your JavaScript code here...',
            'python': 'Enter your Python code here...',
            'java': 'Enter your Java code here...',
            'rust': 'Enter your Rust code here...',
            'go': 'Enter your Go code here...',
            'html': 'Enter your HTML code here...',
            'css': 'Enter your CSS code here...',
            'other': 'Enter your code here...'
        };
        
        if (codeEditor) {
            codeEditor.placeholder = placeholders[selectedLanguage] || 'Enter your code here...';
        }
        
        debugLog('Language changed to:', selectedLanguage);
    } catch (error) {
        debugError('Error updating language:', error);
        notifications.error('Failed to update language selection');
    }
}

/**
 * Clear the code editor and reset dashboard
 */
function clearEditor() {
    try {
        const codeEditor = document.getElementById('codeEditor');
        if (codeEditor) {
            codeEditor.value = '';
        }
        resetDashboard();
        notifications.info('Editor cleared');
    } catch (error) {
        debugError('Error clearing editor:', error);
        notifications.error('Failed to clear editor');
    }
}

/**
 * Reset dashboard to initial state
 */
function resetDashboard() {
    try {
        const elements = {
            totalAllocations: document.getElementById('totalAllocations'),
            totalFrees: document.getElementById('totalFrees'),
            memoryLeaks: document.getElementById('memoryLeaks'),
            leakedBytes: document.getElementById('leakedBytes'),
            criticalIssues: document.getElementById('criticalIssues'),
            leaksList: document.getElementById('leaksList'),
            analysisContent: document.getElementById('analysisContent')
        };

        // Update text content safely
        if (elements.totalAllocations) elements.totalAllocations.textContent = '0 calls';
        if (elements.totalFrees) elements.totalFrees.textContent = '0 calls';
        if (elements.memoryLeaks) elements.memoryLeaks.textContent = '0 leaks';
        if (elements.leakedBytes) elements.leakedBytes.textContent = '0 B';
        if (elements.criticalIssues) elements.criticalIssues.textContent = '0 issues';

        // Update HTML content safely
        const defaultMessage = '<p class="text-gray-500 text-center py-8">No analysis performed yet. Click "Analyze Memory" to start.</p>';
        if (elements.leaksList) elements.leaksList.innerHTML = defaultMessage;
        if (elements.analysisContent) elements.analysisContent.innerHTML = defaultMessage;

        // Destroy charts
        if (memoryChart) {
            memoryChart.destroy();
            memoryChart = null;
        }
        if (timelineChart) {
            timelineChart.destroy();
            timelineChart = null;
        }

        // Remove timeline messages
        const timelineTab = document.getElementById('timeline-tab');
        if (timelineTab) {
            const existingMsg = timelineTab.querySelector('.no-timeline-msg');
            if (existingMsg) {
                existingMsg.remove();
            }
        }

        currentAnalysis = null;
    } catch (error) {
        debugError('Error resetting dashboard:', error);
        notifications.error('Failed to reset dashboard');
    }
}

/**
 * Show loading state
 */
function showLoading() {
    const analyzeBtn = document.getElementById('analyzeBtn');
    if (analyzeBtn) {
        analyzeBtn.disabled = true;
        analyzeBtn.innerHTML = '<span class="inline-block animate-spin mr-2">⏳</span>Analyzing...';
    }
}

/**
 * Hide loading state
 */
function hideLoading() {
    const analyzeBtn = document.getElementById('analyzeBtn');
    if (analyzeBtn) {
        analyzeBtn.disabled = false;
        analyzeBtn.innerHTML = 'Analyze Memory';
    }
}

/**
 * Analyze code with error handling and validation
 */
function analyzeCode() {
    try {
        // Prevent multiple simultaneous analyses
        if (isAnalyzing) {
            notifications.warning('Analysis already in progress. Please wait...');
            return;
        }

        // Clear previous timeout
        if (analysisTimeout) {
            clearTimeout(analysisTimeout);
        }

        // Debounce analysis
        analysisTimeout = setTimeout(() => {
            performAnalysisInternal();
        }, CONFIG.UI.DEBOUNCE_DELAY);
    } catch (error) {
        debugError('Error in analyzeCode:', error);
        notifications.error('Failed to start analysis: ' + error.message);
        hideLoading();
    }
}

/**
 * Internal analysis function
 */
function performAnalysisInternal() {
    try {
        const codeEditor = document.getElementById('codeEditor');
        if (!codeEditor) {
            notifications.error('Code editor not found');
            return;
        }

        const code = codeEditor.value.trim();
        
        // Validation
        if (!code) {
            notifications.warning('Please enter some code to analyze.');
            return;
        }

        if (code.length > 100000) {
            notifications.warning('Code is too large. Please analyze smaller code sections.');
            return;
        }

        // Get selected language
        const languageSelect = document.getElementById('languageSelect');
        if (!languageSelect) {
            notifications.error('Language selector not found');
            return;
        }

        const language = languageSelect.value;

        // Show loading state
        isAnalyzing = true;
        showLoading();

        // Perform analysis with error handling
        let analysis;
        try {
            analysis = performAnalysis(code, language);
        } catch (error) {
            debugError('Analysis error:', error);
            notifications.error('Analysis failed: ' + error.message);
            hideLoading();
            isAnalyzing = false;
            return;
        }

        if (!analysis) {
            notifications.error('Analysis returned no results');
            hideLoading();
            isAnalyzing = false;
            return;
        }

        // Update UI
        currentAnalysis = analysis;
        updateDashboard(analysis);
        updateLeaksTab(analysis);
        updateAnalysisTab(analysis);
        updateTimelineChart(analysis);

        // Save to history
        if (typeof saveToHistory === 'function') {
            try {
                saveToHistory(analysis, code, language);
            } catch (error) {
                debugError('Error saving to history:', error);
            }
        }

        // Show success message
        const leakCount = analysis.leaks ? analysis.leaks.length : 0;
        if (leakCount === 0) {
            notifications.success('Analysis complete! No memory leaks detected. ✓');
        } else {
            notifications.warning(`Analysis complete! Found ${leakCount} memory leak(s).`);
        }

        hideLoading();
        isAnalyzing = false;
    } catch (error) {
        debugError('Error in performAnalysisInternal:', error);
        notifications.error('Analysis failed: ' + error.message);
        hideLoading();
        isAnalyzing = false;
    }
}

/**
 * Export analysis results to JSON
 */
function exportAnalysis() {
    try {
        if (!currentAnalysis) {
            notifications.warning('No analysis to export. Please analyze code first.');
            return;
        }

        const exportData = {
            timestamp: new Date().toISOString(),
            language: selectedLanguage,
            statistics: {
                totalAllocations: currentAnalysis.allocations ? currentAnalysis.allocations.length : 0,
                totalFrees: currentAnalysis.frees ? currentAnalysis.frees.length : 0,
                memoryLeaks: currentAnalysis.leaks ? currentAnalysis.leaks.length : 0,
                leakedBytes: currentAnalysis.leaks ? currentAnalysis.leaks.reduce((sum, leak) => sum + (leak.size || 0), 0) : 0,
                warnings: currentAnalysis.warnings ? currentAnalysis.warnings.length : 0
            },
            allocations: currentAnalysis.allocations || [],
            frees: currentAnalysis.frees || [],
            leaks: currentAnalysis.leaks || [],
            warnings: currentAnalysis.warnings || [],
            timeline: currentAnalysis.timeline || []
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `memory-analysis-${Date.now()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        notifications.success('Analysis exported successfully!');
    } catch (error) {
        debugError('Error exporting analysis:', error);
        notifications.error('Failed to export analysis: ' + error.message);
    }
}

/**
 * Initialize application
 */
document.addEventListener('DOMContentLoaded', function() {
    try {
        // Set up tab buttons
        const tabButtons = document.querySelectorAll('.tab-btn');
        if (tabButtons.length === 0) {
            debugWarn('No tab buttons found');
        } else {
            tabButtons.forEach(btn => {
                btn.addEventListener('click', function(e) {
                    e.preventDefault();
                    const tabName = this.getAttribute('data-tab');
                    if (tabName) {
                        switchTab(tabName);
                    }
                });
            });
        }
        
        // Set up language selector
        const languageSelect = document.getElementById('languageSelect');
        if (languageSelect) {
            languageSelect.addEventListener('change', updateLanguage);
            selectedLanguage = languageSelect.value;
            // Initialize placeholder on page load
            updateLanguage();
        } else {
            debugWarn('Language select element not found');
        }

        // Add export and share buttons if they don't exist
        const analyzeBtn = document.getElementById('analyzeBtn');
        if (analyzeBtn) {
            if (!document.getElementById('exportBtn')) {
                const exportBtn = document.createElement('button');
                exportBtn.id = 'exportBtn';
                exportBtn.onclick = exportAnalysis;
                exportBtn.className = 'bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition';
                exportBtn.innerHTML = '📥 Export';
                exportBtn.title = 'Export analysis results to JSON (Ctrl+E)';
                exportBtn.setAttribute('aria-label', 'Export analysis results');
                analyzeBtn.parentElement.insertBefore(exportBtn, analyzeBtn.nextSibling);
            }

            if (!document.getElementById('shareBtn') && typeof shareAnalysis === 'function') {
                const shareBtn = document.createElement('button');
                shareBtn.id = 'shareBtn';
                shareBtn.onclick = () => {
                    if (currentAnalysis) {
                        const code = document.getElementById('codeEditor')?.value || '';
                        shareAnalysis(currentAnalysis, code);
                    } else {
                        notifications.warning('No analysis to share');
                    }
                };
                shareBtn.className = 'bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition';
                shareBtn.innerHTML = '🔗 Share';
                shareBtn.title = 'Share analysis results';
                shareBtn.setAttribute('aria-label', 'Share analysis results');
                const exportBtn = document.getElementById('exportBtn');
                if (exportBtn) {
                    exportBtn.parentElement.insertBefore(shareBtn, exportBtn.nextSibling);
                }
            }
        }
        
        // Make functions available globally for debugging
        if (CONFIG.DEBUG) {
            window.switchTab = switchTab;
            window.exportAnalysis = exportAnalysis;
        }

        // Initialize accessibility
        if (typeof initAccessibility === 'function') {
            initAccessibility();
        }

        // Initialize dark mode
        if (typeof initDarkMode === 'function') {
            initDarkMode();
        }

        // Add keyboard shortcuts info
        addKeyboardShortcutsInfo();

        debugLog('Application initialized successfully');
    } catch (error) {
        debugError('Error initializing application:', error);
        notifications.error('Failed to initialize application: ' + error.message);
    }
});

/**
 * Add keyboard shortcuts information
 */
function addKeyboardShortcutsInfo() {
    // Add keyboard shortcuts tooltip or help section
    const shortcuts = [
        { key: 'Ctrl/Cmd + S', action: 'Analyze code' },
        { key: 'Ctrl/Cmd + K', action: 'Clear editor' },
        { key: 'Ctrl/Cmd + L', action: 'Load sample' },
        { key: 'Ctrl/Cmd + E', action: 'Export results' },
        { key: 'Ctrl/Cmd + D', action: 'Toggle dark mode' },
        { key: 'Esc', action: 'Close notifications' }
    ];

    // Store shortcuts globally for help display
    window.keyboardShortcuts = shortcuts;
}

/**
 * Sort leaks by criteria
 * @param {string} criteria - Sort criteria ('line', 'size', 'variable')
 */
function sortLeaks(criteria) {
    try {
        if (!currentAnalysis || !currentAnalysis.leaks) {
            return;
        }

        // Create a new array and sort it
        const sortedLeaks = [...currentAnalysis.leaks];
        
        switch(criteria) {
            case 'line':
                sortedLeaks.sort((a, b) => (a.line || 0) - (b.line || 0));
                break;
            case 'size':
                sortedLeaks.sort((a, b) => (b.size || 0) - (a.size || 0));
                break;
            case 'variable':
                sortedLeaks.sort((a, b) => (a.var || '').localeCompare(b.var || ''));
                break;
        }

        // Create a new analysis object with sorted leaks instead of modifying the original
        const sortedAnalysis = {
            ...currentAnalysis,
            leaks: sortedLeaks
        };
        
        // Re-render leaks tab with sorted analysis
        updateLeaksTab(sortedAnalysis);
        
        debugLog('Leaks sorted by:', criteria);
    } catch (error) {
        debugError('Error sorting leaks:', error);
        notifications.error('Failed to sort leaks: ' + error.message);
    }
}

/**
 * Filter leaks by search term
 * @param {string} searchTerm - Search term
 */
function filterLeaks(searchTerm) {
    try {
        const leakItems = document.querySelectorAll('.leak-item');
        const term = searchTerm.toLowerCase().trim();
        
        leakItems.forEach(item => {
            const text = item.textContent.toLowerCase();
            if (term === '' || text.includes(term)) {
                item.style.display = '';
            } else {
                item.style.display = 'none';
            }
        });
        
        debugLog('Leaks filtered by:', searchTerm);
    } catch (error) {
        debugError('Error filtering leaks:', error);
    }
}

/**
 * Copy leak details from element
 * @param {HTMLElement} button - Button element
 */
function copyLeakFromElement(button) {
    try {
        const leakItem = button.closest('.leak-item');
        if (!leakItem) {
            notifications.warning('Leak item not found');
            return;
        }

        const leakData = leakItem.getAttribute('data-leak');
        if (!leakData) {
            notifications.warning('Leak data not found');
            return;
        }

        const leak = JSON.parse(leakData);
        copyLeakDetails(leak);
    } catch (error) {
        debugError('Error copying leak from element:', error);
        notifications.error('Failed to copy leak details');
    }
}
