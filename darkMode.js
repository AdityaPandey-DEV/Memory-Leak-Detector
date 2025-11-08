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
 * Update dark mode toggle icons
 */
function updateDarkModeIcons(isDark) {
    const darkIcon = document.getElementById('darkModeIcon');
    const lightIcon = document.getElementById('lightModeIcon');
    
    if (darkIcon && lightIcon) {
        if (isDark) {
            darkIcon.classList.add('hidden');
            lightIcon.classList.remove('hidden');
        } else {
            darkIcon.classList.remove('hidden');
            lightIcon.classList.add('hidden');
        }
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
            updateDarkModeIcons(true);
        } else {
            document.documentElement.classList.remove('dark');
            document.body.classList.remove('dark-mode');
            localStorage.setItem('theme', 'light');
            updateDarkModeIcons(false);
        }
        
        // Update theme toggle button (for old button if exists)
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
    // Check if button already exists in HTML
    const existingToggle = document.getElementById('darkModeToggle');
    if (existingToggle) {
        // Button already exists in HTML, just add event listener
        existingToggle.addEventListener('click', toggleDarkMode);
        return;
    }

    // Fallback: Create button if it doesn't exist (for backward compatibility)
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

    // Dark mode styles are now handled by CSS variables and classes in styles.css
    // This function is kept for backward compatibility but styles are primarily in CSS
}

