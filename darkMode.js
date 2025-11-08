/**
 * Dark Mode Module
 * Handles dark mode toggle and theme management
 */

/**
 * Initialize dark mode
 */
function initDarkMode() {
    try {
        // Check for saved theme preference or default to light mode
        const savedTheme = localStorage.getItem('theme') || 'light';
        setTheme(savedTheme);
        
        // Create theme toggle button
        createThemeToggle();
        
        debugLog('Dark mode initialized');
    } catch (error) {
        debugError('Error initializing dark mode:', error);
    }
}

/**
 * Set theme (light or dark)
 * @param {string} theme - 'light' or 'dark'
 */
function setTheme(theme) {
    try {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
            document.body.classList.add('dark-mode');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            document.body.classList.remove('dark-mode');
            localStorage.setItem('theme', 'light');
        }
        
        // Update theme toggle button
        updateThemeToggleButton(theme);
        
        // Apply dark mode styles
        applyDarkModeStyles(theme);
    } catch (error) {
        debugError('Error setting theme:', error);
    }
}

/**
 * Toggle between light and dark mode
 */
function toggleDarkMode() {
    const currentTheme = localStorage.getItem('theme') || 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    announceToScreenReader(`Switched to ${newTheme} mode`);
}

/**
 * Create theme toggle button
 */
function createThemeToggle() {
    // Check if button already exists
    if (document.getElementById('themeToggle')) {
        return;
    }

    const header = document.querySelector('header');
    if (!header) {
        debugWarn('Header not found, cannot add theme toggle');
        return;
    }

    const themeToggle = document.createElement('button');
    themeToggle.id = 'themeToggle';
    themeToggle.className = 'theme-toggle bg-white/20 hover:bg-white/30 text-white px-3 py-2 rounded-lg transition';
    themeToggle.setAttribute('aria-label', 'Toggle dark mode');
    themeToggle.setAttribute('title', 'Toggle dark mode (Ctrl+D)');
    themeToggle.innerHTML = getThemeIcon(localStorage.getItem('theme') || 'light');
    
    themeToggle.addEventListener('click', toggleDarkMode);
    
    // Add keyboard shortcut
    document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
            e.preventDefault();
            toggleDarkMode();
        }
    });

    // Insert at the end of header
    const headerContent = header.querySelector('.container');
    if (headerContent) {
        headerContent.style.position = 'relative';
        themeToggle.style.position = 'absolute';
        themeToggle.style.right = '1rem';
        themeToggle.style.top = '50%';
        themeToggle.style.transform = 'translateY(-50%)';
        headerContent.appendChild(themeToggle);
    } else {
        header.appendChild(themeToggle);
    }
}

/**
 * Update theme toggle button icon
 * @param {string} theme - Current theme
 */
function updateThemeToggleButton(theme) {
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.innerHTML = getThemeIcon(theme);
    }
}

/**
 * Get theme icon
 * @param {string} theme - Theme name
 * @returns {string} Icon HTML
 */
function getThemeIcon(theme) {
    if (theme === 'dark') {
        return '☀️'; // Sun icon for light mode
    } else {
        return '🌙'; // Moon icon for dark mode
    }
}

/**
 * Apply dark mode styles
 * @param {string} theme - Theme name
 */
function applyDarkModeStyles(theme) {
    // Remove existing dark mode styles if any
    const existingStyle = document.getElementById('dark-mode-styles');
    if (existingStyle) {
        existingStyle.remove();
    }

    if (theme === 'dark') {
        const style = document.createElement('style');
        style.id = 'dark-mode-styles';
        style.textContent = `
            .dark-mode {
                background-color: #1a1a1a !important;
                color: #e5e5e5 !important;
            }
            .dark-mode .bg-white {
                background-color: #2d2d2d !important;
                color: #e5e5e5 !important;
            }
            .dark-mode .bg-gray-100 {
                background-color: #1a1a1a !important;
            }
            .dark-mode .bg-gray-50 {
                background-color: #2d2d2d !important;
            }
            .dark-mode .text-gray-800 {
                color: #e5e5e5 !important;
            }
            .dark-mode .text-gray-700 {
                color: #d1d1d1 !important;
            }
            .dark-mode .text-gray-600 {
                color: #b0b0b0 !important;
            }
            .dark-mode .border-gray-300 {
                border-color: #4a4a4a !important;
            }
            .dark-mode textarea {
                background-color: #2d2d2d !important;
                color: #e5e5e5 !important;
                border-color: #4a4a4a !important;
            }
            .dark-mode select {
                background-color: #2d2d2d !important;
                color: #e5e5e5 !important;
                border-color: #4a4a4a !important;
            }
            .dark-mode .bg-blue-50 {
                background-color: #1e3a5f !important;
            }
            .dark-mode .bg-green-50 {
                background-color: #1e4d2e !important;
            }
            .dark-mode .bg-red-50 {
                background-color: #4d1e1e !important;
            }
            .dark-mode .bg-yellow-50 {
                background-color: #4d3d1e !important;
            }
            .dark-mode .bg-purple-50 {
                background-color: #3d1e4d !important;
            }
            .dark-mode .bg-orange-50 {
                background-color: #4d2e1e !important;
            }
            .dark-mode .bg-indigo-50 {
                background-color: #1e1e4d !important;
            }
            .dark-mode .bg-teal-50 {
                background-color: #1e4d4d !important;
            }
            .dark-mode code {
                background-color: #1a1a1a !important;
                color: #e5e5e5 !important;
            }
        `;
        document.head.appendChild(style);
    }
}

