/**
 * Accessibility Module
 * Handles ARIA labels, keyboard navigation, and screen reader support
 */

/**
 * Initialize accessibility features
 */
function initAccessibility() {
    try {
        // Add ARIA labels to buttons
        addAriaLabels();
        
        // Set up keyboard navigation
        setupKeyboardNavigation();
        
        // Add focus indicators
        addFocusIndicators();
        
        // Announce dynamic content changes
        setupLiveRegions();
        
        debugLog('Accessibility features initialized');
    } catch (error) {
        debugError('Error initializing accessibility:', error);
    }
}

/**
 * Add ARIA labels to interactive elements
 */
function addAriaLabels() {
    const elements = {
        'analyzeBtn': { label: 'Analyze code for memory leaks', role: 'button' },
        'languageSelect': { label: 'Select programming language', role: 'combobox' },
        'codeEditor': { label: 'Code editor for entering source code', role: 'textbox' }
    };

    Object.keys(elements).forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            const config = elements[id];
            if (!element.getAttribute('aria-label')) {
                element.setAttribute('aria-label', config.label);
            }
            if (config.role && !element.getAttribute('role')) {
                element.setAttribute('role', config.role);
            }
        }
    });

    // Add ARIA labels to tab buttons
    document.querySelectorAll('.tab-btn').forEach((btn, index) => {
        const tabName = btn.getAttribute('data-tab');
        if (tabName && !btn.getAttribute('aria-label')) {
            btn.setAttribute('aria-label', `Switch to ${tabName} tab`);
            btn.setAttribute('role', 'tab');
            btn.setAttribute('aria-controls', `${tabName}-tab`);
        }
    });

    // Add ARIA labels to action buttons
    const buttons = [
        { selector: 'button[onclick="loadSampleCode()"]', label: 'Load sample code' },
        { selector: 'button[onclick="clearEditor()"]', label: 'Clear code editor' },
        { selector: '#exportBtn', label: 'Export analysis results' }
    ];

    buttons.forEach(config => {
        const btn = document.querySelector(config.selector);
        if (btn && !btn.getAttribute('aria-label')) {
            btn.setAttribute('aria-label', config.label);
        }
    });
}

/**
 * Set up keyboard navigation
 */
function setupKeyboardNavigation() {
    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + S: Analyze code
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            const analyzeBtn = document.getElementById('analyzeBtn');
            if (analyzeBtn && !analyzeBtn.disabled) {
                analyzeBtn.click();
            }
            return;
        }

        // Ctrl/Cmd + K: Clear editor
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            clearEditor();
            return;
        }

        // Ctrl/Cmd + L: Load sample
        if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
            e.preventDefault();
            loadSampleCode();
            return;
        }

        // Ctrl/Cmd + E: Export
        if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
            e.preventDefault();
            if (typeof exportAnalysis === 'function') {
                exportAnalysis();
            }
            return;
        }

        // Escape: Close notifications
        if (e.key === 'Escape') {
            const notificationElements = document.querySelectorAll('#notification-container > div');
            notificationElements.forEach(notif => {
                if (notif.querySelector('button')) {
                    notif.querySelector('button').click();
                }
            });
        }

        // Tab navigation for tabs
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            const activeTab = document.querySelector('.tab-btn.active');
            if (activeTab && activeTab.parentElement) {
                const tabs = Array.from(activeTab.parentElement.querySelectorAll('.tab-btn'));
                const currentIndex = tabs.indexOf(activeTab);
                
                if (e.key === 'ArrowLeft' && currentIndex > 0) {
                    e.preventDefault();
                    tabs[currentIndex - 1].click();
                } else if (e.key === 'ArrowRight' && currentIndex < tabs.length - 1) {
                    e.preventDefault();
                    tabs[currentIndex + 1].click();
                }
            }
        }
    });

    // Improve tab navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.click();
            }
        });
    });
}

/**
 * Add focus indicators
 */
function addFocusIndicators() {
    // Add focus styles if not already present
    const style = document.createElement('style');
    style.textContent = `
        *:focus-visible {
            outline: 2px solid #3B82F6;
            outline-offset: 2px;
            border-radius: 4px;
        }
        .tab-btn:focus-visible {
            outline: 2px solid #3B82F6;
            outline-offset: -2px;
        }
        button:focus-visible,
        select:focus-visible,
        textarea:focus-visible {
            outline: 2px solid #3B82F6;
            outline-offset: 2px;
        }
    `;
    document.head.appendChild(style);
}

/**
 * Set up live regions for screen readers
 */
function setupLiveRegions() {
    // Create live region for announcements
    if (!document.getElementById('aria-live-region')) {
        const liveRegion = document.createElement('div');
        liveRegion.id = 'aria-live-region';
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.setAttribute('aria-atomic', 'true');
        liveRegion.className = 'sr-only';
        liveRegion.style.cssText = 'position: absolute; left: -10000px; width: 1px; height: 1px; overflow: hidden;';
        document.body.appendChild(liveRegion);
    }
}

/**
 * Announce to screen readers
 * @param {string} message - Message to announce
 */
function announceToScreenReader(message) {
    const liveRegion = document.getElementById('aria-live-region');
    if (liveRegion) {
        liveRegion.textContent = message;
        // Clear after announcement
        setTimeout(() => {
            liveRegion.textContent = '';
        }, 1000);
    }
}

