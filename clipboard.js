/**
 * Clipboard Module
 * Handles copy to clipboard functionality
 */

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @param {string} successMessage - Success message to show
 * @returns {Promise<boolean>} True if successful
 */
async function copyToClipboard(text, successMessage = 'Copied to clipboard!') {
    try {
        if (!text || typeof text !== 'string') {
            notifications.warning('Nothing to copy');
            return false;
        }

        // Use modern Clipboard API if available
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(text);
            notifications.success(successMessage);
            announceToScreenReader(successMessage);
            return true;
        } else {
            // Fallback for older browsers
            return copyToClipboardFallback(text, successMessage);
        }
    } catch (error) {
        debugError('Error copying to clipboard:', error);
        notifications.error('Failed to copy to clipboard: ' + error.message);
        return false;
    }
}

/**
 * Fallback method for copying to clipboard
 * @param {string} text - Text to copy
 * @param {string} successMessage - Success message
 * @returns {boolean} True if successful
 */
function copyToClipboardFallback(text, successMessage) {
    try {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (successful) {
            notifications.success(successMessage);
            announceToScreenReader(successMessage);
            return true;
        } else {
            notifications.error('Failed to copy to clipboard');
            return false;
        }
    } catch (error) {
        debugError('Fallback copy failed:', error);
        notifications.error('Failed to copy to clipboard');
        return false;
    }
}

/**
 * Copy code snippet to clipboard
 * @param {string} code - Code to copy
 */
function copyCode(code) {
    copyToClipboard(code, 'Code copied to clipboard!');
}

/**
 * Copy analysis results to clipboard
 * @param {Object} analysis - Analysis results
 */
function copyAnalysisResults(analysis) {
    try {
        if (!analysis) {
            notifications.warning('No analysis to copy');
            return;
        }

        let text = 'Memory Leak Analysis Results\n';
        text += '='.repeat(40) + '\n\n';
        text += `Total Allocations: ${analysis.allocations ? analysis.allocations.length : 0}\n`;
        text += `Total Frees: ${analysis.frees ? analysis.frees.length : 0}\n`;
        text += `Memory Leaks: ${analysis.leaks ? analysis.leaks.length : 0}\n`;
        text += `Leaked Bytes: ${formatBytes(analysis.leaks ? analysis.leaks.reduce((sum, leak) => sum + (leak.size || 0), 0) : 0)}\n`;
        text += `Warnings: ${analysis.warnings ? analysis.warnings.length : 0}\n\n`;

        if (analysis.leaks && Array.isArray(analysis.leaks) && analysis.leaks.length > 0) {
            text += 'Memory Leaks:\n';
            text += '-'.repeat(40) + '\n';
            analysis.leaks.forEach((leak, index) => {
                if (leak) {
                    text += `${index + 1}. Variable: ${leak.var || 'unknown'}\n`;
                    text += `   Line: ${leak.line || 0}\n`;
                    text += `   Function: ${leak.function || 'unknown'}\n`;
                    text += `   Size: ${formatBytes(leak.size || 0)}\n`;
                    text += `   Fix: ${leak.fix || 'No fix available'}\n\n`;
                }
            });
        }

        copyToClipboard(text, 'Analysis results copied to clipboard!');
    } catch (error) {
        debugError('Error copying analysis results:', error);
        notifications.error('Failed to copy analysis results');
    }
}

/**
 * Copy leak details to clipboard
 * @param {Object} leak - Leak object
 */
function copyLeakDetails(leak) {
    try {
        if (!leak) {
            notifications.warning('No leak to copy');
            return;
        }

        let text = `Memory Leak Details\n`;
        text += `Variable: ${leak.var}\n`;
        text += `Line: ${leak.line}\n`;
        text += `Function: ${leak.function}\n`;
        text += `Size: ${formatBytes(leak.size || 0)}\n`;
        text += `Fix: ${leak.fix || 'No fix available'}\n`;

        copyToClipboard(text, 'Leak details copied to clipboard!');
    } catch (error) {
        debugError('Error copying leak details:', error);
        notifications.error('Failed to copy leak details');
    }
}

