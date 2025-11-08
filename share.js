/**
 * Share Module
 * Handles sharing analysis results
 */

/**
 * Share analysis results
 * @param {Object} analysis - Analysis results
 * @param {string} code - Source code
 */
function shareAnalysis(analysis, code) {
    try {
        if (!analysis) {
            notifications.warning('No analysis to share');
            return;
        }

        // Create shareable data
        const shareData = {
            timestamp: new Date().toISOString(),
            statistics: {
                totalAllocations: analysis.allocations ? analysis.allocations.length : 0,
                totalFrees: analysis.frees ? analysis.frees.length : 0,
                memoryLeaks: analysis.leaks ? analysis.leaks.length : 0,
                leakedBytes: analysis.leaks ? analysis.leaks.reduce((sum, leak) => sum + (leak.size || 0), 0) : 0,
                warnings: analysis.warnings ? analysis.warnings.length : 0
            },
            leaks: analysis.leaks || [],
            warnings: analysis.warnings || []
        };

        // Create shareable text
        let shareText = 'Memory Leak Analysis Results\n';
        shareText += '='.repeat(40) + '\n\n';
        shareText += `Total Allocations: ${shareData.statistics.totalAllocations}\n`;
        shareText += `Total Frees: ${shareData.statistics.totalFrees}\n`;
        shareText += `Memory Leaks: ${shareData.statistics.memoryLeaks}\n`;
        shareText += `Leaked Bytes: ${formatBytes(shareData.statistics.leakedBytes)}\n`;
        shareText += `Warnings: ${shareData.statistics.warnings}\n\n`;

        if (shareData.leaks && Array.isArray(shareData.leaks) && shareData.leaks.length > 0) {
            shareText += 'Memory Leaks:\n';
            shareText += '-'.repeat(40) + '\n';
            shareData.leaks.forEach((leak, index) => {
                if (leak) {
                    shareText += `${index + 1}. ${leak.var || 'unknown'} (Line ${leak.line || 0}) - ${formatBytes(leak.size || 0)}\n`;
                }
            });
        }

        // Try Web Share API first
        if (navigator.share) {
            navigator.share({
                title: 'Memory Leak Analysis Results',
                text: shareText,
                url: window.location.href
            }).then(() => {
                notifications.success('Analysis shared successfully!');
            }).catch((error) => {
                if (error.name !== 'AbortError') {
                    // Fallback to clipboard
                    copyToClipboard(shareText, 'Analysis copied to clipboard!');
                }
            });
        } else {
            // Fallback to clipboard
            copyToClipboard(shareText, 'Analysis copied to clipboard! Share this text manually.');
        }
    } catch (error) {
        debugError('Error sharing analysis:', error);
        notifications.error('Failed to share analysis');
    }
}

/**
 * Generate shareable URL (if needed in future)
 * @param {Object} analysis - Analysis results
 * @returns {string} Shareable URL
 */
function generateShareableURL(analysis) {
    try {
        // For now, just return current URL
        // In future, could encode analysis data in URL or use a service
        return window.location.href;
    } catch (error) {
        debugError('Error generating shareable URL:', error);
        return window.location.href;
    }
}

