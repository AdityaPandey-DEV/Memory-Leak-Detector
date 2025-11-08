let memoryChart = null;
let timelineChart = null;
let currentAnalysis = null;

// Sample code with memory leaks
const sampleCode = `#include <stdio.h>
#include <stdlib.h>
#include <string.h>

void processData() {
    char *buffer = (char*)malloc(100 * sizeof(char));
    strcpy(buffer, "Sample data");
    printf("%s\\n", buffer);
    // Memory leak: buffer is not freed
}

int* createArray(int size) {
    int *arr = (int*)malloc(size * sizeof(int));
    for (int i = 0; i < size; i++) {
        arr[i] = i * 2;
    }
    return arr;
    // Memory leak: arr is returned but never freed by caller
}

void unsafeFunction() {
    char *str = (char*)malloc(50);
    strcpy(str, "Hello World");
    // Memory leak: str is not freed
    // Also unsafe: strcpy without bounds checking
}

int main() {
    int *numbers = createArray(10);
    
    processData();
    unsafeFunction();
    
    // numbers is never freed
    
    return 0;
}`;

function loadSampleCode() {
    document.getElementById('codeEditor').value = sampleCode;
}

function clearEditor() {
    document.getElementById('codeEditor').value = '';
    resetDashboard();
}

function resetDashboard() {
    document.getElementById('totalAllocations').textContent = '0 calls';
    document.getElementById('totalFrees').textContent = '0 calls';
    document.getElementById('memoryLeaks').textContent = '0 leaks';
    document.getElementById('leakedBytes').textContent = '0 B';
    document.getElementById('criticalIssues').textContent = '0 issues';
    document.getElementById('leaksList').innerHTML = '<p class="text-gray-500 text-center py-8">No analysis performed yet. Click "Analyze Memory" to start.</p>';
    document.getElementById('analysisContent').innerHTML = '<p class="text-gray-500 text-center py-8">No analysis performed yet. Click "Analyze Memory" to start.</p>';
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
}

function analyzeCode() {
    const code = document.getElementById('codeEditor').value;
    if (!code.trim()) {
        alert('Please enter some code to analyze.');
        return;
    }

    // Simulate analysis
    const analysis = performAnalysis(code);
    currentAnalysis = analysis;
    updateDashboard(analysis);
    updateLeaksTab(analysis);
    updateAnalysisTab(analysis);
    updateTimelineChart(analysis);
}

// Helper function to remove comments from a line
function removeComments(line) {
    // Remove // comments
    let cleaned = line.replace(/\/\/.*$/, '');
    
    // Remove /* */ comments (single line)
    cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, '');
    
    return cleaned.trim();
}

function performAnalysis(code) {
    const lines = code.split('\n');
    const analysis = {
        allocations: [],
        frees: [],
        leaks: [],
        warnings: [],
        timeline: []
    };

    let lineNum = 0;
    let currentMemory = 0;
    const allocations = [];

    lines.forEach((line, index) => {
        lineNum = index + 1;
        const originalLine = line;
        const trimmed = removeComments(line); // Remove comments before processing
        
        // Skip empty lines after comment removal
        if (!trimmed) {
            analysis.timeline.push({
                line: lineNum,
                memory: currentMemory
            });
            return;
        }

        // Detect malloc/calloc/realloc - more flexible patterns
        // Pattern 1: type *var = malloc(...) - matches "char *p = malloc(128)"
        // Pattern 2: type* var = malloc(...) - matches "char* p = malloc(128)"
        // Pattern 3: var = (type*)malloc(...)
        // Pattern 4: var = malloc(...)
        // Pattern 5: var = (type*)calloc(...)
        // Pattern 6: var = (type*)realloc(...)
        const mallocPatterns = [
            /\w+\s+\*\s*(\w+)\s*=\s*(malloc|calloc|realloc)\s*\([^)]+\)/,      // type *var = malloc(...)
            /\w+\*\s*(\w+)\s*=\s*(malloc|calloc|realloc)\s*\([^)]+\)/,         // type* var = malloc(...)
            /(\w+)\s*=\s*\([^)]*\)\s*(malloc|calloc|realloc)\s*\([^)]+\)/,     // var = (type*)malloc(...)
            /(\w+)\s*=\s*(malloc|calloc|realloc)\s*\([^)]+\)/,                 // var = malloc(...)
        ];
        
        let mallocMatch = null;
        let varName = null;
        let func = null;
        
        for (const pattern of mallocPatterns) {
            mallocMatch = trimmed.match(pattern);
            if (mallocMatch) {
                varName = mallocMatch[1];
                func = mallocMatch[2];
                break;
            }
        }

        if (mallocMatch && varName && func) {
            
            // Extract size - handle various patterns
            let size = 1;
            let bytesPerElement = 1;
            
            // First, try to extract from the function call arguments
            const funcCallMatch = trimmed.match(/(malloc|calloc|realloc)\s*\(\s*([^)]+)\s*\)/);
            if (funcCallMatch && funcCallMatch[2]) {
                const args = funcCallMatch[2].trim();
                
                // Handle calloc(n, size) - multiply both arguments
                const callocMatch = args.match(/(\d+)\s*,\s*(\d+)/);
                if (callocMatch) {
                    size = (parseInt(callocMatch[1]) || 1) * (parseInt(callocMatch[2]) || 1);
                    bytesPerElement = 1; // calloc already gives total bytes
                } else {
                    // Handle sizeof patterns: n * sizeof(type) or sizeof(type) * n
                    const sizeofPattern1 = args.match(/(\d+)\s*\*\s*sizeof\s*\([^)]+\)/);  // n * sizeof(type)
                    const sizeofPattern2 = args.match(/sizeof\s*\([^)]+\)\s*\*\s*(\d+)/);   // sizeof(type) * n
                    
                    if (sizeofPattern1) {
                        // Pattern: 50 * sizeof(int)
                        size = parseInt(sizeofPattern1[1]) || 1;
                        // Detect type from sizeof argument
                        const sizeofType = args.match(/sizeof\s*\(([^)]+)\)/);
                        if (sizeofType) {
                            const type = sizeofType[1].trim();
                            if (type.includes('char')) bytesPerElement = 1;
                            else if (type.includes('int') || type.includes('float')) bytesPerElement = 4;
                            else if (type.includes('double') || type.includes('long long')) bytesPerElement = 8;
                            else bytesPerElement = 4; // default
                        }
                    } else if (sizeofPattern2) {
                        // Pattern: sizeof(int) * 50
                        size = parseInt(sizeofPattern2[1]) || 1;
                        const sizeofType = args.match(/sizeof\s*\(([^)]+)\)/);
                        if (sizeofType) {
                            const type = sizeofType[1].trim();
                            if (type.includes('char')) bytesPerElement = 1;
                            else if (type.includes('int') || type.includes('float')) bytesPerElement = 4;
                            else if (type.includes('double') || type.includes('long long')) bytesPerElement = 8;
                            else bytesPerElement = 4;
                        }
                    } else {
                        // Direct number: malloc(64) or malloc(128)
                        const numMatch = args.match(/(\d+)/);
                        if (numMatch) {
                            size = parseInt(numMatch[1]) || 1;
                            bytesPerElement = 1; // Direct number means bytes, not elements
                        }
                    }
                }
            }
            
            // If bytesPerElement wasn't set (for direct number allocations), detect from type declaration
            if (bytesPerElement === 1 && funcCallMatch && funcCallMatch[2] && !funcCallMatch[2].match(/sizeof/)) {
                // This is a direct number allocation like malloc(64)
                // For direct numbers, the number already represents bytes, so bytesPerElement stays 1
                // But we can use type info for display purposes
            }
            
            const bytes = size * bytesPerElement;
            
            analysis.allocations.push({
                var: varName,
                line: lineNum,
                function: func,
                size: bytes,
                lineText: originalLine.trim()
            });
            allocations.push({ var: varName, line: lineNum, size: bytes });
            currentMemory += bytes;
        }

        // Detect free - more flexible pattern
        const freePatterns = [
            /free\s*\(\s*(\w+)\s*\)/,           // free(var)
            /free\s*\(\s*(\w+)\s*\)\s*;?/       // free(var);
        ];
        
        let freeMatch = null;
        for (const pattern of freePatterns) {
            freeMatch = trimmed.match(pattern);
            if (freeMatch) break;
        }
        
        if (freeMatch) {
            const varName = freeMatch[1];
            const allocIndex = allocations.findIndex(a => a.var === varName);
            if (allocIndex !== -1) {
                analysis.frees.push({
                    var: varName,
                    line: lineNum,
                    lineText: originalLine.trim()
                });
                currentMemory -= allocations[allocIndex].size;
                allocations.splice(allocIndex, 1);
            }
        }

        // Detect unsafe functions
        if (trimmed.includes('strcpy(') && !trimmed.includes('strncpy')) {
            analysis.warnings.push({
                type: 'Unsafe Function',
                line: lineNum,
                message: 'strcpy() used without bounds checking. Consider using strncpy() or strcpy_s().',
                lineText: originalLine.trim()
            });
        }

        // Check for NULL pointer checks
        if (mallocMatch && index < lines.length - 1) {
            const nextLines = lines.slice(index, Math.min(index + 3, lines.length));
            const hasNullCheck = nextLines.some(l => {
                const cleaned = removeComments(l);
                return cleaned.includes('if') && cleaned.includes('NULL') && cleaned.includes(mallocMatch[1]);
            });
            if (!hasNullCheck) {
                analysis.warnings.push({
                    type: 'Missing NULL Check',
                    line: lineNum,
                    message: `No NULL pointer check after ${mallocMatch[2]}() call for ${mallocMatch[1]}.`,
                    lineText: originalLine.trim()
                });
            }
        }

        analysis.timeline.push({
            line: lineNum,
            memory: currentMemory
        });
    });

    // Find leaks (allocations without corresponding free)
    allocations.forEach(alloc => {
        const leakInfo = analysis.allocations.find(a => a.var === alloc.var && a.line === alloc.line);
        if (leakInfo) {
            analysis.leaks.push({
                var: alloc.var,
                line: alloc.line,
                function: leakInfo.function,
                size: alloc.size,
                fix: `Add free(${alloc.var}); before function return or at appropriate cleanup point.`
            });
        }
    });

    return analysis;
}

function updateDashboard(analysis) {
    const totalAlloc = analysis.allocations.length;
    const totalFree = analysis.frees.length;
    const leaks = analysis.leaks.length;
    const leakedBytes = analysis.leaks.reduce((sum, leak) => sum + leak.size, 0);
    const critical = analysis.warnings.filter(w => w.type === 'Missing NULL Check').length;

    document.getElementById('totalAllocations').textContent = totalAlloc + ' calls';
    document.getElementById('totalFrees').textContent = totalFree + ' calls';
    document.getElementById('memoryLeaks').textContent = leaks + ' leaks';
    document.getElementById('leakedBytes').textContent = formatBytes(leakedBytes);
    document.getElementById('criticalIssues').textContent = critical + ' issues';

    // Update pie chart
    const allocated = analysis.allocations.reduce((sum, a) => sum + a.size, 0);
    const freed = analysis.frees.reduce((sum, f) => {
        const alloc = analysis.allocations.find(a => a.var === f.var);
        return sum + (alloc ? alloc.size : 0);
    }, 0);
    const leaked = leakedBytes;

    const ctx = document.getElementById('memoryChart').getContext('2d');
    if (memoryChart) memoryChart.destroy();
    
    memoryChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Allocated', 'Freed', 'Leaked'],
            datasets: [{
                data: [allocated, freed, leaked],
                backgroundColor: ['#3B82F6', '#10B981', '#EF4444'],
                borderWidth: 2,
                borderColor: '#fff'
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
}

function updateLeaksTab(analysis) {
    const leaksList = document.getElementById('leaksList');
    if (analysis.leaks.length === 0) {
        leaksList.innerHTML = '<p class="text-green-600 text-center py-8 font-semibold">✓ No memory leaks detected!</p>';
        return;
    }

    leaksList.innerHTML = analysis.leaks.map(leak => `
        <div class="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
            <div class="flex justify-between items-start mb-2">
                <div>
                    <h4 class="font-semibold text-red-800">Variable: <code class="bg-red-100 px-2 py-1 rounded">${leak.var}</code></h4>
                    <p class="text-sm text-gray-600 mt-1">Line ${leak.line} | Function: ${leak.function}() | Size: ${formatBytes(leak.size)}</p>
                </div>
            </div>
            <div class="mt-3 bg-white p-3 rounded border border-red-200">
                <p class="text-sm font-semibold text-gray-700 mb-1">Fix/Solution:</p>
                <p class="text-sm text-gray-800">${leak.fix}</p>
            </div>
        </div>
    `).join('');
}

function updateAnalysisTab(analysis) {
    const analysisContent = document.getElementById('analysisContent');
    const balanceStatus = analysis.allocations.length === analysis.frees.length ? 'Balanced' : 'Unbalanced';
    const balanceColor = balanceStatus === 'Balanced' ? 'green' : 'red';

    let html = `
        <div class="space-y-6">
            <div class="bg-gray-50 p-4 rounded-lg">
                <h4 class="font-semibold text-gray-800 mb-3">Memory Allocation Analysis</h4>
                <div class="grid grid-cols-3 gap-4">
                    <div class="text-center">
                        <p class="text-2xl font-bold text-blue-600">${analysis.allocations.length}</p>
                        <p class="text-sm text-gray-600">malloc/calloc/realloc calls</p>
                    </div>
                    <div class="text-center">
                        <p class="text-2xl font-bold text-green-600">${analysis.frees.length}</p>
                        <p class="text-sm text-gray-600">free() calls</p>
                    </div>
                    <div class="text-center">
                        <p class="text-2xl font-bold text-${balanceColor}-600">${balanceStatus}</p>
                        <p class="text-sm text-gray-600">Memory Balance</p>
                    </div>
                </div>
            </div>

            <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-lg">
                <h4 class="font-semibold text-yellow-800 mb-3">Code Quality Warnings (${analysis.warnings.length})</h4>
    `;

    if (analysis.warnings.length === 0) {
        html += '<p class="text-green-600">✓ No warnings detected!</p>';
    } else {
        html += '<div class="space-y-3">';
        analysis.warnings.forEach(warning => {
            html += `
                <div class="bg-white p-3 rounded border border-yellow-200">
                    <p class="font-semibold text-gray-800">${warning.type} (Line ${warning.line})</p>
                    <p class="text-sm text-gray-700 mt-1">${warning.message}</p>
                    <code class="text-xs bg-gray-100 px-2 py-1 rounded block mt-2">${warning.lineText}</code>
                </div>
            `;
        });
        html += '</div>';
    }

    html += `
            </div>
        </div>
    `;

    analysisContent.innerHTML = html;
}

function updateTimelineChart(analysis) {
    const canvas = document.getElementById('timelineChart');
    if (!canvas) {
        console.error('Timeline chart canvas not found');
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

    if (!analysis || !analysis.timeline || analysis.timeline.length === 0) {
        // Show message if no timeline data
        if (timelineTab) {
            const msg = document.createElement('p');
            msg.className = 'no-timeline-msg text-gray-500 text-center py-8';
            msg.textContent = 'No timeline data available. Please analyze code first.';
            canvas.parentElement.appendChild(msg);
        }
        return;
    }

    const labels = analysis.timeline.map(t => `Line ${t.line}`);
    const data = analysis.timeline.map(t => t.memory);

    // Use setTimeout to ensure canvas is visible before rendering
    setTimeout(() => {
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            console.error('Could not get 2d context');
            return;
        }

        timelineChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Memory Usage (Bytes)',
                    data: data,
                    borderColor: '#3B82F6',
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
    }, 100);
}

function switchTab(tabName) {
    console.log('Switching to tab:', tabName);
    
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Reset all buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active', 'text-blue-600', 'border-b-2', 'border-blue-600');
        btn.classList.add('text-gray-500');
    });

    // Show selected tab
    const tabElement = document.getElementById(`${tabName}-tab`);
    if (tabElement) {
        tabElement.classList.add('active');
        console.log('Tab element found and activated:', tabElement.id);
    } else {
        console.error('Tab element not found:', `${tabName}-tab`);
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
            }, 100);
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
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    // Set up tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const tabName = this.getAttribute('data-tab');
            if (tabName) {
                switchTab(tabName);
            }
        });
    });
    
    // Make switchTab available globally for debugging
    window.switchTab = switchTab;
});

