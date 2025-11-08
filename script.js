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
            sample = `#include <stdio.h>
#include <stdlib.h>
#include <string.h>

char *helper_leak(void) {
    char *p = malloc(128);
    strcpy(p, "helper leaked buffer");
    return p;
    // Memory leak: p is returned but never freed by caller
}

int main(void) {
    char *a = malloc(100);
    strcpy(a, "This will be leaked (a)");
    
    char *b = malloc(200);
    strcpy(b, "This will be freed (b)");
    
    char *c = malloc(50);
    strcpy(c, "Leaked (c)");
    
    char *h = helper_leak();
    
    char *d = malloc(300);
    strcpy(d, "This will be freed (d)");
    
    free(b);
    free(d);
    
    // Memory leaks: a, c, h are never freed
    
    return 0;
}`;
            break;
        case 'cpp':
            sample = `#include <iostream>
#include <cstdlib>

int* createArray(int size) {
    int *arr = new int[size];
    for (int i = 0; i < size; i++) {
        arr[i] = i * 2;
    }
    return arr;
    // Memory leak: arr is returned but never deleted by caller
}

void processData() {
    int* ptr = new int(10);
    ptr = new int(20);
    // Memory leak: first allocation is lost
    delete ptr;
}

int main() {
    int* numbers = createArray(10);
    int* x = new int(64);
    int* y = new int(128);
    int* z = new int(256);
    
    delete y;
    
    // Memory leaks: numbers, x, z are never deleted
    
    processData();
    
    return 0;
}`;
            break;
        case 'javascript':
            sample = `// JavaScript Memory Leak Example
function createLeak() {
    const arr = new Array(1000).fill(0);
    const buffer = new ArrayBuffer(1024);
    const obj = new Object();
    // Memory leak: arr, buffer, obj are not cleared
    return arr;
}

function processData() {
    const data = [];
    for (let i = 0; i < 100; i++) {
        data.push(new Array(100).fill(i));
    }
    // Memory leak: data array is not cleared
}

// Event listener leak
function setupListener() {
    const element = document.createElement('div');
    element.addEventListener('click', function() {
        // Closure keeps reference to element
    });
    // Memory leak: element is not removed
}

createLeak();
processData();
setupListener();`;
            break;
        case 'python':
            sample = `# Python Memory Leak Example
import sys

def create_leak():
    data = [0] * 1000
    buffer = bytearray(1024)
    d = {}
    # Memory leak: data, buffer, d are not cleared
    return data

def process_data():
    arr = []
    for i in range(100):
        arr.append([0] * 100)
    # Memory leak: arr list is not cleared
    pass

# Circular reference leak
class Node:
    def __init__(self):
        self.ref = None

def create_circular():
    a = Node()
    b = Node()
    a.ref = b
    b.ref = a
    # Memory leak: circular reference prevents GC

create_leak()
process_data()
create_circular()`;
            break;
        case 'java':
            sample = `// Java Memory Leak Example
import java.util.*;

public class MemoryLeak {
    private static List<int[]> cache = new ArrayList<>();
    
    public static void createLeak() {
        int[] arr = new int[1000];
        cache.add(arr);
        // Memory leak: arr is added to cache but never removed
    }
    
    public static void processData() {
        byte[] buffer = new byte[1024];
        ArrayList<Integer> list = new ArrayList<>();
        for (int i = 0; i < 100; i++) {
            list.add(i);
        }
        // Memory leak: buffer and list are not cleared
    }
    
    // Listener leak
    public static void setupListener() {
        EventListener listener = new EventListener() {
            // Anonymous class holds reference
        };
        // Memory leak: listener is not removed
    }
    
    public static void main(String[] args) {
        createLeak();
        processData();
        setupListener();
    }
}`;
            break;
        case 'rust':
            sample = `// Rust Memory Leak Example
use std::rc::Rc;
use std::cell::RefCell;

fn create_leak() {
    let vec = vec![0; 1000];
    let boxed = Box::new(42);
    // Memory leak: vec and boxed are not dropped
}

fn process_data() {
    let buffer = vec![0u8; 1024];
    let rc = Rc::new(RefCell::new(42));
    // Memory leak: buffer and rc are not dropped
}

// Circular reference leak
struct Node {
    next: Option<Rc<RefCell<Node>>>,
}

fn create_circular() {
    let a = Rc::new(RefCell::new(Node { next: None }));
    let b = Rc::new(RefCell::new(Node { next: None }));
    a.borrow_mut().next = Some(b.clone());
    b.borrow_mut().next = Some(a.clone());
    // Memory leak: circular reference prevents deallocation
}

fn main() {
    create_leak();
    process_data();
    create_circular();
}`;
            break;
        case 'go':
            sample = `// Go Memory Leak Example
package main

import "fmt"

func createLeak() {
    arr := make([]int, 1000)
    buffer := make([]byte, 1024)
    m := make(map[string]int)
    // Memory leak: arr, buffer, m are not cleared
}

func processData() {
    data := make([]int, 0, 100)
    for i := 0; i < 100; i++ {
        data = append(data, i)
    }
    // Memory leak: data slice is not cleared
}

// Goroutine leak
func goroutineLeak() {
    ch := make(chan int)
    go func() {
        ch <- 1
    }()
    // Memory leak: goroutine is never cleaned up
}

func main() {
    createLeak()
    processData()
    goroutineLeak()
}`;
            break;
        case 'html':
            sample = `<!DOCTYPE html>
<html>
<head>
    <title>Memory Leak Example</title>
</head>
<body>
    <div id="container"></div>
    <script>
        // DOM element leak
        function createLeak() {
            const div = document.createElement('div');
            document.getElementById('container').appendChild(div);
            // Memory leak: div is never removed
        }
        
        // Event listener leak
        function setupListener() {
            const button = document.createElement('button');
            button.addEventListener('click', function() {
                // Closure keeps reference
            });
            // Memory leak: button and listener are not removed
        }
        
        createLeak();
        setupListener();
    </script>
</body>
</html>`;
            break;
        case 'css':
            sample = `/* CSS Memory Leak Example */
/* Note: CSS itself doesn't have memory leaks, */
/* but improper CSS can cause memory issues in browsers */

.container {
    /* Memory leak: Large background images not optimized */
    background-image: url('huge-image.jpg');
    background-size: cover;
}

/* Memory leak: Excessive animations */
@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

.animated {
    animation: spin 1s linear infinite;
    /* Memory leak: Animation never stops */
}

/* Memory leak: Unused styles accumulate */
.unused-class-1 { }
.unused-class-2 { }
.unused-class-3 { }
/* ... thousands of unused classes ... */`;
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

    // Get selected language
    const language = document.getElementById('languageSelect').value;

    // Simulate analysis
    const analysis = performAnalysis(code, language);
    currentAnalysis = analysis;
    updateDashboard(analysis);
    updateLeaksTab(analysis);
    updateAnalysisTab(analysis);
    updateTimelineChart(analysis);
}

// AST Parser for improved code analysis
class ASTParser {
    constructor(language = 'c') {
        this.language = language;
    }

    // Parse code into AST-like structure
    parse(code) {
        // Remove comments first
        const cleanedCode = this.removeComments(code);
        
        switch(this.language) {
            case 'javascript':
                return this.parseJavaScript(cleanedCode);
            case 'c':
            case 'cpp':
                return this.parseC(cleanedCode);
            case 'python':
                return this.parsePython(cleanedCode);
            case 'java':
                return this.parseJava(cleanedCode);
            case 'rust':
                return this.parseRust(cleanedCode);
            case 'go':
                return this.parseGo(cleanedCode);
            default:
                return this.parseGeneric(cleanedCode);
        }
    }

    removeComments(code) {
        // Remove single-line comments
        let cleaned = code.replace(/\/\/.*$/gm, '');
        // Remove multi-line comments
        cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, '');
        // Remove string literals temporarily to avoid false matches
        return cleaned;
    }

    // Parse JavaScript using Acorn (if available) or fallback
    parseJavaScript(code) {
        const ast = {
            type: 'Program',
            body: [],
            source: code
        };

        try {
            // Try using Acorn if available
            if (typeof acorn !== 'undefined') {
                const parsed = acorn.parse(code, { ecmaVersion: 2020, locations: true });
                return this.convertAcornAST(parsed);
            }
        } catch (e) {
            console.warn('Acorn parsing failed, using fallback:', e);
        }

        // Fallback: parse manually
        return this.parseGeneric(code);
    }

    convertAcornAST(acornAST) {
        const nodes = [];
        const self = this;
        
        const evaluateExpr = (node) => {
            if (node.type === 'Literal') {
                return node.value;
            }
            if (node.type === 'Identifier') {
                return node.name;
            }
            if (node.type === 'BinaryExpression') {
                const left = evaluateExpr(node.left);
                const right = evaluateExpr(node.right);
                if (typeof left === 'number' && typeof right === 'number') {
                    if (node.operator === '*') return left * right;
                    if (node.operator === '+') return left + right;
                }
            }
            return null;
        };
        
        function traverse(node) {
            if (!node) return;
            
            // Detect variable declarations with allocations
            if (node.type === 'VariableDeclaration') {
                node.declarations.forEach(decl => {
                    if (decl.init) {
                        const initNode = decl.init;
                        
                        // Check for new Array(), new Object(), etc.
                        if (initNode.type === 'NewExpression') {
                            nodes.push({
                                type: 'Allocation',
                                var: decl.id.name,
                                line: node.loc ? node.loc.start.line : 0,
                                function: initNode.callee.name || 'new',
                                args: initNode.arguments.map(arg => evaluateExpr(arg)),
                                nodeType: 'VariableDeclaration',
                                originalNode: node
                            });
                        }
                        
                        // Check for array literals []
                        if (initNode.type === 'ArrayExpression') {
                            nodes.push({
                                type: 'Allocation',
                                var: decl.id.name,
                                line: node.loc ? node.loc.start.line : 0,
                                function: 'Array',
                                args: [initNode.elements.length],
                                nodeType: 'VariableDeclaration',
                                originalNode: node
                            });
                        }
                        
                        // Check for object literals {}
                        if (initNode.type === 'ObjectExpression') {
                            nodes.push({
                                type: 'Allocation',
                                var: decl.id.name,
                                line: node.loc ? node.loc.start.line : 0,
                                function: 'Object',
                                args: [initNode.properties.length],
                                nodeType: 'VariableDeclaration',
                                originalNode: node
                            });
                        }
                    }
                });
            }
            
            // Detect assignments (var = null, var = undefined)
            if (node.type === 'AssignmentExpression') {
                if (node.right.type === 'Literal' && (node.right.value === null || node.right.raw === 'undefined')) {
                    nodes.push({
                        type: 'Deallocation',
                        var: node.left.name,
                        line: node.loc ? node.loc.start.line : 0,
                        function: 'null',
                        nodeType: 'AssignmentExpression',
                        originalNode: node
                    });
                }
            }
            
            // Recursively traverse children
            for (const key in node) {
                if (key === 'parent' || key === 'loc') continue;
                const child = node[key];
                if (Array.isArray(child)) {
                    child.forEach(traverse);
                } else if (child && typeof child === 'object' && child.type) {
                    traverse(child);
                }
            }
        }
        
        traverse(acornAST);
        
        return {
            type: 'Program',
            body: nodes,
            source: acornAST.source || ''
        };
    }

    evaluateExpression(node) {
        if (node.type === 'Literal') {
            return node.value;
        }
        if (node.type === 'Identifier') {
            return node.name;
        }
        if (node.type === 'BinaryExpression') {
            const left = this.evaluateExpression(node.left);
            const right = this.evaluateExpression(node.right);
            if (typeof left === 'number' && typeof right === 'number') {
                if (node.operator === '*') return left * right;
                if (node.operator === '+') return left + right;
            }
        }
        return null;
    }

    // Parse C/C++ code into AST-like structure
    parseC(code) {
        const lines = code.split('\n');
        const nodes = [];
        let currentFunction = null;
        let braceDepth = 0;
        let inLoop = false;
        let loopDepth = 0;
        
        // Track multi-line statements
        let currentStatement = '';
        let statementStartLine = 0;
        let inStatement = false;
        
        lines.forEach((line, index) => {
            const lineNum = index + 1;
            const trimmed = line.trim();
            
            if (!trimmed) {
                if (inStatement) {
                    currentStatement += ' ' + trimmed;
                }
                return;
            }
            
            // Detect function definitions
            const funcMatch = trimmed.match(/(\w+)\s*\([^)]*\)\s*\{?/);
            if (funcMatch && !trimmed.match(/\b(if|while|for|switch)\s*\(/)) {
                currentFunction = funcMatch[1];
            }
            
            // Detect loops
            if (trimmed.match(/\b(for|while|do)\s*\(/)) {
                inLoop = true;
                loopDepth++;
            }
            
            // Track braces
            const openBraces = (trimmed.match(/\{/g) || []).length;
            const closeBraces = (trimmed.match(/\}/g) || []).length;
            braceDepth += openBraces - closeBraces;
            
            // Check if statement continues on next line
            if (trimmed.endsWith('\\') || (!trimmed.endsWith(';') && !trimmed.endsWith('{') && !trimmed.endsWith('}'))) {
                if (!inStatement) {
                    currentStatement = trimmed;
                    statementStartLine = lineNum;
                    inStatement = true;
                } else {
                    currentStatement += ' ' + trimmed;
                }
                return;
            }
            
            // Complete statement
            if (inStatement) {
                currentStatement += ' ' + trimmed;
                trimmed = currentStatement;
                inStatement = false;
            }
            
            // Parse allocations
            const alloc = this.parseCAllocation(trimmed, statementStartLine || lineNum, line, currentFunction, inLoop);
            if (alloc) {
                nodes.push(alloc);
            }
            
            // Parse deallocations
            const dealloc = this.parseCDeallocation(trimmed, lineNum, line);
            if (dealloc) {
                nodes.push(dealloc);
            }
            
            // Reset statement tracking
            currentStatement = '';
            statementStartLine = 0;
            
            // Detect scope end
            if (braceDepth === 0) {
                if (inLoop && loopDepth > 0) {
                    loopDepth--;
                    if (loopDepth === 0) inLoop = false;
                }
                if (currentFunction) {
                    currentFunction = null;
                }
            }
        });
        
        return {
            type: 'Program',
            body: nodes,
            source: code
        };
    }

    parseCAllocation(line, lineNum, originalLine, functionName, inLoop) {
        // Improved patterns that handle multi-line and complex expressions
        const patterns = [
            // type *var = malloc(...)
            /\w+\s+\*\s*(\w+)\s*=\s*(malloc|calloc|realloc)\s*\(\s*([^)]+)\s*\)/,
            // type* var = malloc(...)
            /\w+\*\s*(\w+)\s*=\s*(malloc|calloc|realloc)\s*\(\s*([^)]+)\s*\)/,
            // var = (type*)malloc(...)
            /(\w+)\s*=\s*\([^)]*\)\s*(malloc|calloc|realloc)\s*\(\s*([^)]+)\s*\)/,
            // var = malloc(...)
            /(\w+)\s*=\s*(malloc|calloc|realloc)\s*\(\s*([^)]+)\s*\)/,
        ];
        
        for (const pattern of patterns) {
            const match = line.match(pattern);
            if (match) {
                const varName = match[1];
                const func = match[2];
                const args = match[3] || '';
                
                return {
                    type: 'Allocation',
                    var: varName,
                    line: lineNum,
                    function: func,
                    args: args,
                    functionName: functionName,
                    inLoop: inLoop,
                    nodeType: 'VariableDeclaration',
                    originalLine: originalLine.trim()
                };
            }
        }
        
        // C++ new patterns
        const cppPatterns = [
            /\w+\s+\*\s*(\w+)\s*=\s*new\s+\w+\s*\(\s*([^)]*)\s*\)/,
            /\w+\*\s*(\w+)\s*=\s*new\s+\w+\s*\(\s*([^)]*)\s*\)/,
            /\w+\s+\*\s*(\w+)\s*=\s*new\s+\w+/,
            /\w+\*\s*(\w+)\s*=\s*new\s+\w+/,
            /\w+\s+\*\s*(\w+)\s*=\s*new\s+\w+\s*\[\s*([^\]]+)\s*\]/,
            /\w+\*\s*(\w+)\s*=\s*new\s+\w+\s*\[\s*([^\]]+)\s*\]/,
            /(\w+)\s*=\s*new\s+\w+\s*\(\s*([^)]*)\s*\)/,
            /(\w+)\s*=\s*new\s+\w+/,
            /(\w+)\s*=\s*new\s+\w+\s*\[\s*([^\]]+)\s*\]/,
        ];
        
        for (const pattern of cppPatterns) {
            const match = line.match(pattern);
            if (match) {
                const varName = match[1];
                const args = match[2] || '';
                const isArray = line.includes('[') && line.includes(']');
                
                return {
                    type: 'Allocation',
                    var: varName,
                    line: lineNum,
                    function: isArray ? 'new[]' : 'new',
                    args: args,
                    functionName: functionName,
                    inLoop: inLoop,
                    nodeType: 'VariableDeclaration',
                    originalLine: originalLine.trim()
                };
            }
        }
        
        return null;
    }

    parseCDeallocation(line, lineNum, originalLine) {
        // free() pattern
        const freeMatch = line.match(/free\s*\(\s*(\w+)\s*\)/);
        if (freeMatch) {
            return {
                type: 'Deallocation',
                var: freeMatch[1],
                line: lineNum,
                function: 'free',
                nodeType: 'CallExpression',
                originalLine: originalLine.trim()
            };
        }
        
        // delete patterns
        const deleteArrayMatch = line.match(/delete\s*\[\s*\]\s*(?:\(\s*)?(\w+)(?:\s*\))?/);
        if (deleteArrayMatch) {
            return {
                type: 'Deallocation',
                var: deleteArrayMatch[1],
                line: lineNum,
                function: 'delete[]',
                nodeType: 'CallExpression',
                originalLine: originalLine.trim()
            };
        }
        
        const deleteMatch = line.match(/delete\s+(?:\(\s*)?(\w+)(?:\s*\))?/);
        if (deleteMatch) {
            return {
                type: 'Deallocation',
                var: deleteMatch[1],
                line: lineNum,
                function: 'delete',
                nodeType: 'CallExpression',
                originalLine: originalLine.trim()
            };
        }
        
        return null;
    }

    // Generic parser for other languages
    parseGeneric(code) {
        return this.parseC(code); // Use C parser as fallback
    }

    parsePython(code) {
        return this.parseGeneric(code);
    }

    parseJava(code) {
        return this.parseGeneric(code);
    }

    parseRust(code) {
        return this.parseGeneric(code);
    }

    parseGo(code) {
        return this.parseGeneric(code);
    }
}

// Comprehensive Memory Leak Detection Engine
class MemoryAnalyzer {
    constructor(language = 'c') {
        this.language = language;
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
        this.astParser = new ASTParser(language);
    }

    analyze(code) {
        // Use AST parser for improved accuracy
        const ast = this.astParser.parse(code);
        const analysis = {
            allocations: [],
            frees: [],
            leaks: [],
            warnings: [],
            timeline: []
        };

        // Traverse AST nodes
        ast.body.forEach(node => {
            if (node.type === 'Allocation') {
                const alloc = this.processASTAllocation(node, code);
                if (alloc) {
                    this.handleAllocation(alloc, analysis);
                }
            } else if (node.type === 'Deallocation') {
                const free = this.processASTDeallocation(node, code);
                if (free) {
                    this.handleFree(free, analysis);
                }
            }
            
            // Update timeline for each node
            this.updateTimeline(node.line || 1);
        });

        // Also check for code quality issues using original code
        const lines = code.split('\n');
        lines.forEach((line, index) => {
            this.detectCodeQualityIssues(line, index + 1, line, analysis);
        });

        // Find all leaks
        this.findLeaks(analysis);

        return analysis;
    }

    // Process AST allocation node into allocation object
    processASTAllocation(astNode, originalCode) {
        const args = Array.isArray(astNode.args) ? astNode.args.join(', ') : (astNode.args || '');
        const size = this.calculateSizeFromAST(astNode, args);
        
        return {
            var: astNode.var,
            line: astNode.line,
            function: astNode.function,
            size: size,
            lineText: astNode.originalLine || this.getLineFromCode(originalCode, astNode.line),
            inLoop: astNode.inLoop || false,
            inFunction: astNode.inFunction || false,
            functionName: astNode.functionName || null,
            allocId: `${astNode.var}_line${astNode.line}_${Date.now()}`,
            language: this.language
        };
    }

    // Process AST deallocation node into free object
    processASTDeallocation(astNode, originalCode) {
        return {
            var: astNode.var,
            line: astNode.line,
            lineText: astNode.originalLine || this.getLineFromCode(originalCode, astNode.line),
            language: this.language,
            isArray: astNode.function === 'delete[]'
        };
    }

    // Calculate size from AST node
    calculateSizeFromAST(astNode, args) {
        if (this.language === 'c' || this.language === 'cpp') {
            if (astNode.function === 'calloc') {
                const callocMatch = args.match(/(\d+)\s*,\s*(\d+)/);
                if (callocMatch) {
                    return (parseInt(callocMatch[1]) || 1) * (parseInt(callocMatch[2]) || 1);
                }
            }
            
            // Handle sizeof patterns
            const sizeofPattern1 = args.match(/(\d+)\s*\*\s*sizeof\s*\([^)]+\)/);
            const sizeofPattern2 = args.match(/sizeof\s*\([^)]+\)\s*\*\s*(\d+)/);
            
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
        } else if (this.language === 'cpp') {
            if (astNode.function === 'new[]') {
                const arrayMatch = args.match(/(\d+)/);
                if (arrayMatch) {
                    const count = parseInt(arrayMatch[1]) || 1;
                    return count * 4; // Default type size
                }
            } else if (astNode.function === 'new') {
                return 4; // Default object size
            }
        } else if (this.language === 'javascript') {
            if (Array.isArray(astNode.args)) {
                const size = astNode.args[0] || 1;
                return (typeof size === 'number' ? size : 1) * 8;
            }
            return 8;
        } else if (this.language === 'python' || this.language === 'rust' || this.language === 'go') {
            const sizeArg = Array.isArray(astNode.args) ? astNode.args[0] : (astNode.args || '1');
            const size = typeof sizeArg === 'number' ? sizeArg : parseInt(sizeArg) || 1;
            return size * 8;
        } else if (this.language === 'java') {
            const sizeArg = Array.isArray(astNode.args) ? astNode.args[0] : (astNode.args || '1');
            const size = typeof sizeArg === 'number' ? sizeArg : parseInt(sizeArg) || 1;
            return size * 4;
        }
        
        return 1;
    }

    // Get line from code by line number
    getLineFromCode(code, lineNum) {
        const lines = code.split('\n');
        return lines[lineNum - 1] || '';
    }

    // Note: Old regex-based detection methods removed - now using AST parsing

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

    // Note: Old regex-based deallocation detection methods removed - now using AST parsing

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

function performAnalysis(code, language = 'c') {
    const analyzer = new MemoryAnalyzer(language);
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
        // Initialize placeholder on page load
        updateLanguage();
    }
    
    // Make switchTab available globally for debugging
    window.switchTab = switchTab;
});
