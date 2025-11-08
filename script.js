let memoryChart = null;
let timelineChart = null;
let currentAnalysis = null;
let selectedLanguage = 'c'; // Default language

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
    const language = document.getElementById('languageSelect').value;
    let sample = '';
    
    switch(language) {
        case 'c':
        case 'cpp':
            sample = sampleCode; // Use existing C/C++ sample
            break;
        case 'javascript':
            sample = `// JavaScript Memory Leak Example
function createLeak() {
    const arr = new Array(1000).fill(0);
    // Memory leak: arr is not cleared
    return arr;
}

function processData() {
    const buffer = new ArrayBuffer(1024);
    // Memory leak: buffer is not released
}

createLeak();
processData();`;
            break;
        case 'python':
            sample = `# Python Memory Leak Example
import sys

def create_leak():
    data = [0] * 1000
    # Memory leak: data is not cleared
    return data

def process_data():
    buffer = bytearray(1024)
    # Memory leak: buffer is not released
    pass

create_leak()
process_data()`;
            break;
        case 'java':
            sample = `// Java Memory Leak Example
public class MemoryLeak {
    public static void createLeak() {
        int[] arr = new int[1000];
        // Memory leak: arr is not cleared
    }
    
    public static void processData() {
        byte[] buffer = new byte[1024];
        // Memory leak: buffer is not released
    }
}`;
            break;
        case 'rust':
            sample = `// Rust Memory Leak Example
fn create_leak() {
    let vec = vec![0; 1000];
    // Memory leak: vec is not dropped
}

fn process_data() {
    let buffer = vec![0u8; 1024];
    // Memory leak: buffer is not released
}`;
            break;
        case 'go':
            sample = `// Go Memory Leak Example
package main

func createLeak() {
    arr := make([]int, 1000)
    // Memory leak: arr is not cleared
}

func processData() {
    buffer := make([]byte, 1024)
    // Memory leak: buffer is not released
}`;
            break;
        default:
            sample = sampleCode;
    }
    
    document.getElementById('codeEditor').value = sample;
}

function updateLanguage() {
    selectedLanguage = document.getElementById('languageSelect').value;
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
    
    console.log('Language changed to:', selectedLanguage);
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

// Comprehensive Memory Leak Detection Engine
class MemoryAnalyzer {
    constructor() {
        this.allocations = new Map(); // varName -> [allocations]
        this.frees = [];
        this.warnings = [];
        this.timeline = [];
        this.currentMemory = 0;
        this.scopeStack = []; // Track scopes (functions, blocks)
        this.controlFlow = {
            inLoop: false,
            loopDepth: 0,
            inFunction: false,
            functionName: null,
            braceDepth: 0
        };
    }

    analyze(code) {
        const lines = code.split('\n');
        const analysis = {
            allocations: [],
            frees: [],
            leaks: [],
            warnings: [],
            timeline: []
        };

        lines.forEach((line, index) => {
            const lineNum = index + 1;
            const cleaned = this.preprocessLine(line);
            
            if (!cleaned.trim()) {
                this.updateTimeline(lineNum);
                return;
            }

            // Update control flow state
            this.updateControlFlow(cleaned);

            // Detect allocations
            const alloc = this.detectAllocation(cleaned, lineNum, line);
            if (alloc) {
                this.handleAllocation(alloc, analysis);
            }

            // Detect frees
            const free = this.detectFree(cleaned, lineNum, line);
            if (free) {
                this.handleFree(free, analysis);
            }

            // Detect code quality issues
            this.detectCodeQualityIssues(cleaned, lineNum, line, analysis);

            this.updateTimeline(lineNum);
        });

        // Find all leaks
        this.findLeaks(analysis);

        return analysis;
    }

    preprocessLine(line) {
        // Remove comments
        let cleaned = line.replace(/\/\/.*$/, '');
        cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, '');
        return cleaned.trim();
    }

    updateControlFlow(line) {
        // Detect function definitions
        const funcMatch = line.match(/(\w+)\s*\([^)]*\)\s*\{?/);
        if (funcMatch && !line.includes('if') && !line.includes('while') && !line.includes('for')) {
            this.controlFlow.inFunction = true;
            this.controlFlow.functionName = funcMatch[1];
        }

        // Detect loops
        if (line.match(/\b(for|while|do)\s*\(/)) {
            this.controlFlow.inLoop = true;
            this.controlFlow.loopDepth++;
        }

        // Track braces
        const openBraces = (line.match(/\{/g) || []).length;
        const closeBraces = (line.match(/\}/g) || []).length;
        this.controlFlow.braceDepth += openBraces - closeBraces;

        // Detect scope end
        if (line.trim() === '}' && this.controlFlow.braceDepth === 0) {
            if (this.controlFlow.inLoop && this.controlFlow.loopDepth > 0) {
                this.controlFlow.loopDepth--;
                if (this.controlFlow.loopDepth === 0) {
                    this.controlFlow.inLoop = false;
                }
            }
            if (this.controlFlow.inFunction) {
                this.controlFlow.inFunction = false;
                this.controlFlow.functionName = null;
            }
        }
    }

    detectAllocation(line, lineNum, originalLine) {
        // C-style allocation patterns (malloc/calloc/realloc)
        const cPatterns = [
            /\w+\s+\*\s*(\w+)\s*=\s*(malloc|calloc|realloc)\s*\(\s*([^)]+)\s*\)/,  // type *var = malloc(...)
            /\w+\*\s*(\w+)\s*=\s*(malloc|calloc|realloc)\s*\(\s*([^)]+)\s*\)/,     // type* var = malloc(...)
            /(\w+)\s*=\s*\([^)]*\)\s*(malloc|calloc|realloc)\s*\(\s*([^)]+)\s*\)/, // var = (type*)malloc(...)
            /(\w+)\s*=\s*(malloc|calloc|realloc)\s*\(\s*([^)]+)\s*\)/,             // var = malloc(...)
        ];

        for (const pattern of cPatterns) {
            const match = line.match(pattern);
            if (match) {
                const varName = match[1];
                const func = match[2];
                const args = match[3] || '';
                
                const size = this.calculateSize(args, line);
                
                return {
                    var: varName,
                    line: lineNum,
                    function: func,
                    size: size,
                    lineText: originalLine.trim(),
                    inLoop: this.controlFlow.inLoop,
                    inFunction: this.controlFlow.inFunction,
                    functionName: this.controlFlow.functionName,
                    allocId: `${varName}_line${lineNum}_${Date.now()}`,
                    language: 'C'
                };
            }
        }

        // C++ allocation patterns (new/new[])
        const cppPatterns = [
            /\w+\s+\*\s*(\w+)\s*=\s*new\s+\w+\s*\(\s*([^)]*)\s*\)/,              // type *var = new Type(...)
            /\w+\*\s*(\w+)\s*=\s*new\s+\w+\s*\(\s*([^)]*)\s*\)/,                 // type* var = new Type(...)
            /\w+\s+\*\s*(\w+)\s*=\s*new\s+\w+/,                                  // type *var = new Type
            /\w+\*\s*(\w+)\s*=\s*new\s+\w+/,                                     // type* var = new Type
            /\w+\s+\*\s*(\w+)\s*=\s*new\s+\w+\s*\[\s*([^\]]+)\s*\]/,            // type *var = new Type[n]
            /\w+\*\s*(\w+)\s*=\s*new\s+\w+\s*\[\s*([^\]]+)\s*\]/,               // type* var = new Type[n]
            /(\w+)\s*=\s*new\s+\w+\s*\(\s*([^)]*)\s*\)/,                        // var = new Type(...)
            /(\w+)\s*=\s*new\s+\w+/,                                            // var = new Type
            /(\w+)\s*=\s*new\s+\w+\s*\[\s*([^\]]+)\s*\]/,                      // var = new Type[n]
        ];

        for (const pattern of cppPatterns) {
            const match = line.match(pattern);
            if (match) {
                const varName = match[1];
                const args = match[2] || '';
                const isArray = line.includes('[') && line.includes(']');
                
                const size = this.calculateCppSize(line, args, isArray);
                
                return {
                    var: varName,
                    line: lineNum,
                    function: isArray ? 'new[]' : 'new',
                    size: size,
                    lineText: originalLine.trim(),
                    inLoop: this.controlFlow.inLoop,
                    inFunction: this.controlFlow.inFunction,
                    functionName: this.controlFlow.functionName,
                    allocId: `${varName}_line${lineNum}_${Date.now()}`,
                    language: 'C++'
                };
            }
        }
        return null;
    }

    calculateCppSize(line, args, isArray) {
        if (isArray) {
            // Array allocation: new Type[n]
            const arrayMatch = line.match(/\[\s*(\d+)\s*\]/);
            if (arrayMatch) {
                const count = parseInt(arrayMatch[1]) || 1;
                // Try to detect type size from the line
                const typeSize = this.detectCppTypeSize(line);
                return count * typeSize;
            }
            return 4; // default
        } else {
            // Single object allocation: new Type or new Type(...)
            return this.detectCppTypeSize(line);
        }
    }

    detectCppTypeSize(line) {
        // Detect C++ type sizes
        if (line.match(/\b(char|unsigned char|signed char)\b/)) return 1;
        if (line.match(/\b(short|unsigned short)\b/)) return 2;
        if (line.match(/\b(int|unsigned int|float|long)\b/)) return 4;
        if (line.match(/\b(double|long long|unsigned long long)\b/)) return 8;
        if (line.match(/\b(long double)\b/)) return 16;
        // Default for unknown types
        return 4;
    }

    calculateSize(args, line) {
        if (!args) return 1;

        // Handle calloc(n, size)
        const callocMatch = args.match(/(\d+)\s*,\s*(\d+)/);
        if (callocMatch) {
            return (parseInt(callocMatch[1]) || 1) * (parseInt(callocMatch[2]) || 1);
        }

        // Handle sizeof patterns
        const sizeofPattern1 = args.match(/(\d+)\s*\*\s*sizeof\s*\([^)]+\)/);  // n * sizeof(type)
        const sizeofPattern2 = args.match(/sizeof\s*\([^)]+\)\s*\*\s*(\d+)/);   // sizeof(type) * n
        
        if (sizeofPattern1) {
            const count = parseInt(sizeofPattern1[1]) || 1;
            const typeSize = this.getTypeSize(args);
            return count * typeSize;
        } else if (sizeofPattern2) {
            const count = parseInt(sizeofPattern2[1]) || 1;
            const typeSize = this.getTypeSize(args);
            return count * typeSize;
        }

        // Direct number
        const numMatch = args.match(/(\d+)/);
        if (numMatch) {
            return parseInt(numMatch[1]) || 1;
        }

        return 1;
    }

    getTypeSize(args) {
        const sizeofMatch = args.match(/sizeof\s*\(([^)]+)\)/);
        if (sizeofMatch) {
            const type = sizeofMatch[1].trim();
            if (type.includes('char')) return 1;
            if (type.includes('int') || type.includes('float')) return 4;
            if (type.includes('double') || type.includes('long long')) return 8;
        }
        
        // Try to detect from context
        if (args.includes('char')) return 1;
        if (args.includes('int') || args.includes('float')) return 4;
        if (args.includes('double')) return 8;
        
        return 4; // default
    }

    handleAllocation(alloc, analysis) {
        // Check for pointer reassignment (memory leak)
        if (this.allocations.has(alloc.var)) {
            const existingAllocs = this.allocations.get(alloc.var);
            const lastAlloc = existingAllocs[existingAllocs.length - 1];
            
            // Mark previous allocation as leak
            analysis.leaks.push({
                var: alloc.var,
                line: lastAlloc.line,
                function: lastAlloc.function,
                size: lastAlloc.size,
                inLoop: lastAlloc.inLoop,
                fix: `Memory leak: ${alloc.var} was reassigned on line ${alloc.line} without freeing the previous allocation on line ${lastAlloc.line}. Add free(${alloc.var}); before the reassignment.`
            });
            
            // Remove from tracking
            this.currentMemory -= lastAlloc.size;
            existingAllocs.pop();
        }

        // Add new allocation
        if (!this.allocations.has(alloc.var)) {
            this.allocations.set(alloc.var, []);
        }
        this.allocations.get(alloc.var).push(alloc);
        analysis.allocations.push(alloc);
        this.currentMemory += alloc.size;
    }

    detectFree(line, lineNum, originalLine) {
        // C-style free
        const freeMatch = line.match(/free\s*\(\s*(\w+)\s*\)/);
        if (freeMatch) {
            return {
                var: freeMatch[1],
                line: lineNum,
                lineText: originalLine.trim(),
                language: 'C',
                isArray: false
            };
        }

        // C++ delete (handle both delete p and delete(p))
        const deleteMatch = line.match(/delete\s+(?:\(\s*)?(\w+)(?:\s*\))?/);
        if (deleteMatch) {
            return {
                var: deleteMatch[1],
                line: lineNum,
                lineText: originalLine.trim(),
                language: 'C++',
                isArray: false
            };
        }

        // C++ delete[] (handle both delete[] p and delete[](p))
        const deleteArrayMatch = line.match(/delete\s*\[\s*\]\s*(?:\(\s*)?(\w+)(?:\s*\))?/);
        if (deleteArrayMatch) {
            return {
                var: deleteArrayMatch[1],
                line: lineNum,
                lineText: originalLine.trim(),
                language: 'C++',
                isArray: true
            };
        }

        return null;
    }

    handleFree(free, analysis) {
        if (!this.allocations.has(free.var)) {
            // Double free or free of unallocated pointer
            analysis.warnings.push({
                type: 'Potential Double Free',
                line: free.line,
                message: `free() called on ${free.var} which may not be allocated or already freed.`,
                lineText: free.lineText
            });
            return;
        }

        const allocs = this.allocations.get(free.var);
        if (allocs.length === 0) {
            analysis.warnings.push({
                type: 'Double Free',
                line: free.line,
                message: `free() called on ${free.var} which has already been freed.`,
                lineText: free.lineText
            });
            return;
        }

        // Free the most recent allocation (LIFO)
        const freedAlloc = allocs.pop();
        analysis.frees.push({
            var: free.var,
            line: free.line,
            lineText: free.lineText,
            freedAllocId: freedAlloc.allocId
        });
        this.currentMemory -= freedAlloc.size;

        // Clean up if no more allocations for this variable
        if (allocs.length === 0) {
            this.allocations.delete(free.var);
        }
    }

    detectCodeQualityIssues(line, lineNum, originalLine, analysis) {
        // Detect unsafe functions
        if (line.includes('strcpy(') && !line.includes('strncpy')) {
            analysis.warnings.push({
                type: 'Unsafe Function',
                line: lineNum,
                message: 'strcpy() used without bounds checking. Consider using strncpy() or strcpy_s().',
                lineText: originalLine.trim()
            });
        }

        // Detect missing NULL checks (simplified - check next few lines)
        if (line.match(/(malloc|calloc|realloc)\s*\(/)) {
            // This is a simplified check - in a real implementation, you'd do proper control flow analysis
        }
    }

    findLeaks(analysis) {
        // All remaining allocations are leaks
        this.allocations.forEach((allocs, varName) => {
            allocs.forEach(alloc => {
                let fixMessage = `Add free(${varName}); before function return or at appropriate cleanup point.`;
                
                if (alloc.inLoop) {
                    fixMessage = `Add free(${varName}); inside the loop after use, or collect pointers and free them after the loop.`;
                } else if (alloc.inFunction && alloc.functionName !== 'main') {
                    fixMessage = `Memory allocated in ${alloc.functionName}() on line ${alloc.line}. Ensure caller frees this memory, or free it before function return.`;
                }

                analysis.leaks.push({
                    var: varName,
                    line: alloc.line,
                    function: alloc.function,
                    size: alloc.size,
                    inLoop: alloc.inLoop,
                    fix: fixMessage
                });
            });
        });
    }

    updateTimeline(lineNum) {
        this.timeline.push({
            line: lineNum,
            memory: this.currentMemory
        });
    }
}

function performAnalysis(code) {
    const analyzer = new MemoryAnalyzer();
    const analysis = analyzer.analyze(code);
    analysis.timeline = analyzer.timeline;
    return analysis;
}

function updateDashboard(analysis) {
    const totalAlloc = analysis.allocations.length;
    const totalFree = analysis.frees.length;
    const leaks = analysis.leaks.length;
    const leakedBytes = analysis.leaks.reduce((sum, leak) => sum + leak.size, 0);
    const critical = analysis.warnings.filter(w => w.type === 'Missing NULL Check' || w.type === 'Double Free').length;

    document.getElementById('totalAllocations').textContent = totalAlloc + ' calls';
    document.getElementById('totalFrees').textContent = totalFree + ' calls';
    document.getElementById('memoryLeaks').textContent = leaks + ' leaks';
    document.getElementById('leakedBytes').textContent = formatBytes(leakedBytes);
    document.getElementById('criticalIssues').textContent = critical + ' issues';

    // Update pie chart
    const allocated = analysis.allocations.reduce((sum, a) => sum + a.size, 0);
    const freed = analysis.frees.reduce((sum, f) => {
        const alloc = analysis.allocations.find(a => a.allocId === f.freedAllocId);
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
    
    // Set up language selector
    const languageSelect = document.getElementById('languageSelect');
    if (languageSelect) {
        languageSelect.addEventListener('change', updateLanguage);
        selectedLanguage = languageSelect.value;
    }
    
    // Make switchTab available globally for debugging
    window.switchTab = switchTab;
});
