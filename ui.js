/**
 * UI Update Functions
 * Handles all UI updates including dashboard, charts, and tabs
 */

/**
 * Escape HTML to prevent XSS attacks
 * @param {string} text - Text to escape
 * @returns {string} Escaped HTML
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Update dashboard with analysis results
 * @param {Object} analysis - Analysis results object
 */
function updateDashboard(analysis) {
    try {
        if (!analysis) {
            debugError('Invalid analysis object');
            return;
        }

        const totalAlloc = analysis.allocations ? analysis.allocations.length : 0;
        const totalFree = analysis.frees ? analysis.frees.length : 0;
        const leaks = analysis.leaks ? analysis.leaks.length : 0;
        const leakedBytes = analysis.leaks ? analysis.leaks.reduce((sum, leak) => sum + (leak.size || 0), 0) : 0;
        const critical = analysis.warnings ? analysis.warnings.filter(w => w.type === 'Missing NULL Check' || w.type === 'Double Free').length : 0;

        // Update text content safely
        const elements = {
            totalAllocations: document.getElementById('totalAllocations'),
            totalFrees: document.getElementById('totalFrees'),
            memoryLeaks: document.getElementById('memoryLeaks'),
            leakedBytes: document.getElementById('leakedBytes'),
            criticalIssues: document.getElementById('criticalIssues')
        };

        // Update values (numbers only, units are shown separately in HTML)
        if (elements.totalAllocations) elements.totalAllocations.textContent = totalAlloc;
        if (elements.totalFrees) elements.totalFrees.textContent = totalFree;
        if (elements.memoryLeaks) elements.memoryLeaks.textContent = leaks;
        if (elements.leakedBytes) elements.leakedBytes.textContent = formatBytes(leakedBytes);
        if (elements.criticalIssues) elements.criticalIssues.textContent = critical;

        // Update pie chart
        const allocated = analysis.allocations ? analysis.allocations.reduce((sum, a) => sum + (a.size || 0), 0) : 0;
        const freed = analysis.frees ? analysis.frees.reduce((sum, f) => {
            const alloc = analysis.allocations ? analysis.allocations.find(a => a.allocId === f.freedAllocId) : null;
            return sum + (alloc ? (alloc.size || 0) : 0);
        }, 0) : 0;
        const leaked = leakedBytes;

        const chartCanvas = document.getElementById('memoryChart');
        if (!chartCanvas) {
            debugError('Memory chart canvas not found');
            return;
        }

        const ctx = chartCanvas.getContext('2d');
        if (!ctx) {
            debugError('Could not get 2d context for memory chart');
            return;
        }

        if (memoryChart) {
            memoryChart.destroy();
        }
        
        memoryChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['Allocated', 'Freed', 'Leaked'],
                datasets: [{
                    data: [allocated, freed, leaked],
                    backgroundColor: [
                        CONFIG.CHART_COLORS.ALLOCATED,
                        CONFIG.CHART_COLORS.FREED,
                        CONFIG.CHART_COLORS.LEAKED
                    ],
                    borderWidth: 2,
                    borderColor: CONFIG.CHART_COLORS.BORDER
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.label + ': ' + formatBytes(context.parsed);
                            }
                        }
                    }
                }
            }
        });
    } catch (error) {
        debugError('Error updating dashboard:', error);
        notifications.error('Failed to update dashboard: ' + error.message);
    }
}

/**
 * Update memory leaks tab with analysis results
 * @param {Object} analysis - Analysis results object
 */
function updateLeaksTab(analysis) {
    try {
        const leaksList = document.getElementById('leaksList');
        if (!leaksList) {
            debugError('Leaks list element not found');
            return;
        }

        if (!analysis.leaks || analysis.leaks.length === 0) {
            leaksList.innerHTML = '<p class="text-green-600 text-center py-8 font-semibold">✓ No memory leaks detected!</p>';
            return;
        }

        // Add filter/sort controls
        if (analysis.leaks && analysis.leaks.length > 1) {
            leaksList.innerHTML = `
                <div class="mb-4 flex flex-wrap gap-2 items-center">
                    <label class="text-sm font-medium text-gray-700">Sort by:</label>
                    <select id="sortLeaks" class="bg-white border border-gray-300 rounded px-2 py-1 text-sm" onchange="sortLeaks(this.value)">
                        <option value="line">Line Number</option>
                        <option value="size">Size (Largest First)</option>
                        <option value="variable">Variable Name</option>
                    </select>
                    <label class="text-sm font-medium text-gray-700 ml-4">Filter:</label>
                    <input type="text" id="filterLeaks" placeholder="Search leaks..." 
                           class="bg-white border border-gray-300 rounded px-2 py-1 text-sm flex-1 max-w-xs"
                           onkeyup="filterLeaks(this.value)">
                    <button onclick="copyAnalysisResults(currentAnalysis)" 
                            class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm">
                        📋 Copy All
                    </button>
                </div>
                <div id="leaksContainer" class="space-y-4">
            `;
        } else {
            leaksList.innerHTML = '<div id="leaksContainer" class="space-y-4">';
        }

        // Use textContent for safety, but we need HTML for formatting
        // So we'll escape user content
        const leaksContainer = leaksList.querySelector('#leaksContainer') || leaksList;
        const leaksArray = analysis.leaks && Array.isArray(analysis.leaks) ? analysis.leaks : [];
        const leaksHTML = leaksArray.map((leak, index) => {
            const varName = escapeHtml(leak.var || 'unknown');
            const line = leak.line || 0;
            const func = escapeHtml(leak.function || 'unknown');
            const size = formatBytes(leak.size || 0);
            const fix = escapeHtml(leak.fix || 'No fix available');
            const leakData = escapeHtml(JSON.stringify(leak));
            return '<div class="leak-item bg-red-50 border-l-4 border-red-500 p-4 rounded-lg" data-line="' + line + '" data-size="' + (leak.size || 0) + '" data-variable="' + varName + '" data-leak="' + leakData + '">' +
                '<div class="flex justify-between items-start mb-2">' +
                '<div class="flex-1">' +
                '<h4 class="font-semibold text-red-800">Variable: <code class="bg-red-100 px-2 py-1 rounded">' + varName + '</code></h4>' +
                '<p class="text-sm text-gray-600 mt-1">Line ' + line + ' | Function: ' + func + '() | Size: ' + size + '</p>' +
                '</div>' +
                '<button onclick="copyLeakFromElement(this)" ' +
                'class="ml-2 bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs" ' +
                'aria-label="Copy leak details">📋</button>' +
                '</div>' +
                '<div class="mt-3 bg-white p-3 rounded border border-red-200">' +
                '<p class="text-sm font-semibold text-gray-700 mb-1">Fix/Solution:</p>' +
                '<p class="text-sm text-gray-800">' + fix + '</p>' +
                '</div>' +
                '</div>';
        }).join('');
        
        // Only add closing div if we have a container
        if (leaksContainer !== leaksList) {
            leaksContainer.innerHTML = leaksHTML;
        } else {
            leaksList.innerHTML = leaksHTML;
        }
    } catch (error) {
        debugError('Error updating leaks tab:', error);
        notifications.error('Failed to update leaks tab: ' + error.message);
    }
}

/**
 * Update code analysis tab with analysis results
 * @param {Object} analysis - Analysis results object
 */
function updateAnalysisTab(analysis) {
    try {
        const analysisContent = document.getElementById('analysisContent');
        if (!analysisContent) {
            debugError('Analysis content element not found');
            return;
        }

        const allocCount = analysis.allocations ? analysis.allocations.length : 0;
        const freeCount = analysis.frees ? analysis.frees.length : 0;
        const warningCount = analysis.warnings ? analysis.warnings.length : 0;
        const balanceStatus = allocCount === freeCount ? 'Balanced' : 'Unbalanced';
        const balanceColor = balanceStatus === 'Balanced' ? 'green' : 'red';

        let html = `
            <div class="space-y-6">
                <div class="bg-gray-50 p-4 rounded-lg">
                    <h4 class="font-semibold text-gray-800 mb-3">Memory Allocation Analysis</h4>
                    <div class="grid grid-cols-3 gap-4">
                        <div class="text-center">
                            <p class="text-2xl font-bold text-blue-600">${allocCount}</p>
                            <p class="text-sm text-gray-600">malloc/calloc/realloc calls</p>
                        </div>
                        <div class="text-center">
                            <p class="text-2xl font-bold text-green-600">${freeCount}</p>
                            <p class="text-sm text-gray-600">free() calls</p>
                        </div>
                        <div class="text-center">
                            <p class="text-2xl font-bold text-${balanceColor}-600">${balanceStatus}</p>
                            <p class="text-sm text-gray-600">Memory Balance</p>
                        </div>
                    </div>
                </div>

                <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-lg">
                    <h4 class="font-semibold text-yellow-800 mb-3">Code Quality Warnings (${warningCount})</h4>
        `;

        if (warningCount === 0) {
            html += '<p class="text-green-600">✓ No warnings detected!</p>';
        } else {
            html += '<div class="space-y-3">';
            const warningsArray = analysis.warnings && Array.isArray(analysis.warnings) ? analysis.warnings : [];
            warningsArray.forEach(warning => {
                const type = escapeHtml(warning.type || 'Unknown');
                const line = warning.line || 0;
                const message = escapeHtml(warning.message || 'No message');
                const lineText = escapeHtml(warning.lineText || '');
                
                html += '<div class="bg-white p-3 rounded border border-yellow-200">' +
                    '<p class="font-semibold text-gray-800">' + type + ' (Line ' + line + ')</p>' +
                    '<p class="text-sm text-gray-700 mt-1">' + message + '</p>' +
                    '<code class="text-xs bg-gray-100 px-2 py-1 rounded block mt-2">' + lineText + '</code>' +
                    '</div>';
            });
            html += '</div>';
        }

        html += `
                </div>
            </div>
        `;

        analysisContent.innerHTML = html;
    } catch (error) {
        debugError('Error updating analysis tab:', error);
        notifications.error('Failed to update analysis tab: ' + error.message);
    }
}

/**
 * Update memory timeline chart
 * @param {Object} analysis - Analysis results object
 */
function updateTimelineChart(analysis) {
    try {
        const canvas = document.getElementById('timelineChart');
        if (!canvas) {
            debugError('Timeline chart canvas not found');
            return;
        }

    // Remove any existing messages
    const timelineTab = document.getElementById('timeline-tab');
    if (timelineTab) {
        const existingMsg = timelineTab.querySelector('.no-timeline-msg');
        if (existingMsg) {
            existingMsg.remove();
        }
    }

    // Destroy existing chart
    if (timelineChart) {
        timelineChart.destroy();
        timelineChart = null;
    }

    if (!analysis || !analysis.timeline || !Array.isArray(analysis.timeline) || analysis.timeline.length === 0) {
        // Show message if no timeline data
        if (timelineTab) {
            const msg = document.createElement('p');
            msg.className = 'no-timeline-msg text-gray-500 text-center py-8';
            msg.textContent = 'No timeline data available. Please analyze code first.';
            canvas.parentElement.appendChild(msg);
        }
        return;
    }

    const labels = analysis.timeline ? analysis.timeline.map(t => `Line ${t.line || 0}`) : [];
    const data = analysis.timeline ? analysis.timeline.map(t => t.memory || 0) : [];

        // Use setTimeout to ensure canvas is visible before rendering
        setTimeout(() => {
            try {
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    debugError('Could not get 2d context for timeline chart');
                    return;
                }

                if (timelineChart) {
                    timelineChart.destroy();
                }

                timelineChart = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'Memory Usage (Bytes)',
                            data: data,
                            borderColor: CONFIG.CHART_COLORS.ALLOCATED,
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            borderWidth: 2,
                            fill: true,
                            tension: 0.4
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            y: {
                                beginAtZero: true,
                                title: {
                                    display: true,
                                    text: 'Memory (Bytes)'
                                }
                            },
                            x: {
                                title: {
                                    display: true,
                                    text: 'Code Execution Line'
                                },
                                ticks: {
                                    maxRotation: 45,
                                    minRotation: 45
                                }
                            }
                        },
                        plugins: {
                            legend: {
                                display: true,
                                position: 'top'
                            },
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        return 'Memory: ' + formatBytes(context.parsed.y);
                                    }
                                }
                            }
                        }
                    }
                });
            } catch (error) {
                debugError('Error creating timeline chart:', error);
                notifications.error('Failed to create timeline chart: ' + error.message);
            }
        }, CONFIG.UI.CHART_DELAY);
    } catch (error) {
        debugError('Error updating timeline chart:', error);
        notifications.error('Failed to update timeline chart: ' + error.message);
    }
}

/**
 * Switch between tabs
 * @param {string} tabName - Name of the tab to switch to
 */
function switchTab(tabName) {
    try {
        debugLog('Switching to tab:', tabName);
        
        if (!tabName) {
            debugWarn('No tab name provided');
            return;
        }
        
        // Hide all tabs
        const tabContents = document.querySelectorAll('.tab-content');
        if (tabContents.length === 0) {
            debugWarn('No tab content elements found');
        } else {
            tabContents.forEach(tab => {
                tab.classList.remove('active');
            });
        }
        
        // Reset all buttons
        const tabButtons = document.querySelectorAll('.tab-btn');
        if (tabButtons.length === 0) {
            debugWarn('No tab buttons found');
        } else {
            tabButtons.forEach(btn => {
                btn.classList.remove('active', 'text-blue-600', 'border-b-2', 'border-blue-600');
                btn.classList.add('text-gray-500');
            });
        }

        // Show selected tab
        const tabElement = document.getElementById(`${tabName}-tab`);
        if (tabElement) {
            tabElement.classList.add('active');
            debugLog('Tab element found and activated:', tabElement.id);
        } else {
            debugError('Tab element not found:', `${tabName}-tab`);
            notifications.warning(`Tab "${tabName}" not found`);
            return;
        }

        // Update button styles - find button by data-tab attribute
        const buttons = document.querySelectorAll('.tab-btn');
        buttons.forEach(btn => {
            if (btn.getAttribute('data-tab') === tabName) {
                btn.classList.add('active', 'text-blue-600', 'border-b-2', 'border-blue-600');
                btn.classList.remove('text-gray-500');
            }
        });

        // If switching to timeline and analysis exists, ensure chart is updated
        if (tabName === 'timeline') {
            if (currentAnalysis) {
                // Small delay to ensure tab is visible before rendering chart
                setTimeout(() => {
                    updateTimelineChart(currentAnalysis);
                }, CONFIG.UI.CHART_DELAY);
            } else {
                // Show message if no analysis
                const canvas = document.getElementById('timelineChart');
                if (canvas && canvas.parentElement) {
                    const existingMsg = canvas.parentElement.querySelector('.no-timeline-msg');
                    if (!existingMsg) {
                        const msg = document.createElement('p');
                        msg.className = 'no-timeline-msg text-gray-500 text-center py-8';
                        msg.textContent = 'No analysis performed yet. Click "Analyze Memory" to start.';
                        canvas.parentElement.insertBefore(msg, canvas);
                    }
                }
            }
        }
    } catch (error) {
        debugError('Error switching tab:', error);
        notifications.error('Failed to switch tab: ' + error.message);
    }
}

