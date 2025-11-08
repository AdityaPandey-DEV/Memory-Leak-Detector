/**
 * AST Parser for improved code analysis
 * Converts source code into an Abstract Syntax Tree (AST) or AST-like structure
 */
class ASTParser {
    /**
     * Create a new ASTParser instance
     * @param {string} language - Programming language ('c', 'cpp', 'javascript', etc.)
     */
    constructor(language = 'c') {
        this.language = language;
    }

    /**
     * Parse code into AST-like structure
     * @param {string} code - Source code to parse
     * @returns {Object} AST object with type, body, and source
     */
    parse(code) {
        try {
            if (!code || typeof code !== 'string') {
                throw new Error('Invalid code input: code must be a non-empty string');
            }

            // Remove comments first
            const cleanedCode = this.removeComments(code);
            
            let result;
            try {
                switch(this.language) {
                    case 'javascript':
                        result = this.parseJavaScript(cleanedCode);
                        break;
                    case 'c':
                    case 'cpp':
                        result = this.parseC(cleanedCode);
                        break;
                    case 'python':
                        result = this.parsePython(cleanedCode);
                        break;
                    case 'java':
                        result = this.parseJava(cleanedCode);
                        break;
                    case 'rust':
                        result = this.parseRust(cleanedCode);
                        break;
                    case 'go':
                        result = this.parseGo(cleanedCode);
                        break;
                    default:
                        result = this.parseGeneric(cleanedCode);
                }
            } catch (parseError) {
                // If language-specific parser fails, try generic parser as fallback
                debugWarn(`Language-specific parser failed for ${this.language}, trying generic parser:`, parseError.message);
                try {
                    result = this.parseGeneric(cleanedCode);
                } catch (genericError) {
                    // Even generic parser failed - return empty AST instead of throwing
                    debugError('All parsers failed, returning empty AST:', genericError);
                    result = {
                        type: 'Program',
                        body: [],
                        source: code
                    };
                }
            }
            
            // Ensure result has required structure
            if (!result || typeof result !== 'object') {
                result = {
                    type: 'Program',
                    body: [],
                    source: code
                };
            }
            
            if (!result.body) {
                result.body = [];
            }
            
            return result;
        } catch (error) {
            // Last resort: return empty AST instead of throwing
            debugError('Critical error in parse, returning empty AST:', error);
            return {
                type: 'Program',
                body: [],
                source: code || ''
            };
        }
    }

    /**
     * Remove comments from code
     * @param {string} code - Source code
     * @returns {string} Code with comments removed
     */
    removeComments(code) {
        try {
            // Remove single-line comments
            let cleaned = code.replace(/\/\/.*$/gm, '');
            // Remove multi-line comments
            cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, '');
            return cleaned;
        } catch (error) {
            debugError('Error removing comments:', error);
            return code; // Return original code if comment removal fails
        }
    }

    /**
     * Parse JavaScript using Acorn (if available) or fallback
     * @param {string} code - JavaScript source code
     * @returns {Object} AST object
     */
    parseJavaScript(code) {
        const ast = {
            type: 'Program',
            body: [],
            source: code
        };

        try {
            // Try using Acorn if available
            if (typeof acorn !== 'undefined') {
                try {
                    const parsed = acorn.parse(code, { 
                        ecmaVersion: 2020, 
                        locations: true,
                        allowReturnOutsideFunction: true,
                        allowAwaitOutsideFunction: true
                    });
                    return this.convertAcornAST(parsed);
                } catch (parseError) {
                    // Acorn parsing failed (syntax errors, etc.)
                    // This is expected for invalid JavaScript code
                    debugWarn('Acorn parsing failed (code may have syntax errors), using fallback:', parseError.message);
                    // Don't rethrow - fall through to generic parser
                }
            }
        } catch (e) {
            // Any other error in parseJavaScript
            debugWarn('Error in parseJavaScript, using fallback:', e);
        }

        // Fallback: parse manually (handles syntax errors gracefully)
        try {
            return this.parseGeneric(code);
        } catch (fallbackError) {
            // Even fallback failed - return empty AST
            debugError('Fallback parser also failed:', fallbackError);
            return {
                type: 'Program',
                body: [],
                source: code
            };
        }
    }

    convertAcornAST(acornAST) {
        const nodes = [];
        
        const evaluateExpr = (node) => {
            try {
                if (!node) return null;
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
            } catch (error) {
                debugWarn('Error evaluating expression:', error);
                return null;
            }
        };
        
        function traverse(node) {
            try {
                if (!node) return;
                
                // Detect variable declarations with allocations
                if (node.type === 'VariableDeclaration') {
                    try {
                        if (node.declarations && Array.isArray(node.declarations)) {
                            node.declarations.forEach(decl => {
                                try {
                                    if (decl && decl.init) {
                                        const initNode = decl.init;
                                        
                                        // Check for new Array(), new Object(), etc.
                                        if (initNode.type === 'NewExpression') {
                                            nodes.push({
                                                type: 'Allocation',
                                                var: decl.id ? decl.id.name : 'unknown',
                                                line: node.loc ? node.loc.start.line : 0,
                                                function: initNode.callee ? (initNode.callee.name || 'new') : 'new',
                                                args: initNode.arguments ? initNode.arguments.map(arg => evaluateExpr(arg)) : [],
                                                nodeType: 'VariableDeclaration',
                                                originalNode: node
                                            });
                                        }
                                        
                                        // Check for array literals []
                                        if (initNode.type === 'ArrayExpression') {
                                            nodes.push({
                                                type: 'Allocation',
                                                var: decl.id ? decl.id.name : 'unknown',
                                                line: node.loc ? node.loc.start.line : 0,
                                                function: 'Array',
                                                args: [initNode.elements ? initNode.elements.length : 0],
                                                nodeType: 'VariableDeclaration',
                                                originalNode: node
                                            });
                                        }
                                        
                                        // Check for object literals {}
                                        if (initNode.type === 'ObjectExpression') {
                                            nodes.push({
                                                type: 'Allocation',
                                                var: decl.id ? decl.id.name : 'unknown',
                                                line: node.loc ? node.loc.start.line : 0,
                                                function: 'Object',
                                                args: [initNode.properties ? initNode.properties.length : 0],
                                                nodeType: 'VariableDeclaration',
                                                originalNode: node
                                            });
                                        }
                                    }
                                } catch (declError) {
                                    debugWarn('Error processing declaration:', declError);
                                    // Continue with next declaration
                                }
                            });
                        }
                    } catch (varDeclError) {
                        debugWarn('Error processing variable declaration:', varDeclError);
                        // Continue traversal
                    }
                }
                
                // Detect assignments (var = null, var = undefined)
                if (node.type === 'AssignmentExpression') {
                    try {
                        if (node.right && node.right.type === 'Literal' && (node.right.value === null || node.right.raw === 'undefined')) {
                            if (node.left && node.left.name) {
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
                    } catch (assignError) {
                        debugWarn('Error processing assignment:', assignError);
                        // Continue traversal
                    }
                }
                
                // Recursively traverse children
                try {
                    for (const key in node) {
                        if (key === 'parent' || key === 'loc') continue;
                        try {
                            const child = node[key];
                            if (Array.isArray(child)) {
                                child.forEach(childNode => {
                                    try {
                                        traverse(childNode);
                                    } catch (childError) {
                                        debugWarn('Error traversing child array element:', childError);
                                        // Continue with next child
                                    }
                                });
                            } else if (child && typeof child === 'object' && child.type) {
                                traverse(child);
                            }
                        } catch (keyError) {
                            debugWarn('Error accessing node property:', key, keyError);
                            // Continue with next property
                        }
                    }
                } catch (traverseError) {
                    debugWarn('Error in traversal loop:', traverseError);
                    // Stop traversal for this node
                }
            } catch (error) {
                debugWarn('Error in traverse function:', error);
                // Stop traversal for this node
            }
        }
        
        try {
            traverse(acornAST);
        } catch (error) {
            debugError('Error traversing AST:', error);
            // Return partial results
        }
        
        return {
            type: 'Program',
            body: nodes,
            source: acornAST.source || ''
        };
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
                const completeStatement = currentStatement;
                inStatement = false;
                
                // Parse allocations from complete statement
                const alloc = this.parseCAllocation(completeStatement, statementStartLine || lineNum, line, currentFunction, inLoop);
                if (alloc) {
                    nodes.push(alloc);
                }
                
                // Parse deallocations from complete statement
                const dealloc = this.parseCDeallocation(completeStatement, statementStartLine || lineNum, line);
                if (dealloc) {
                    nodes.push(dealloc);
                }
                
                // Reset statement tracking
                currentStatement = '';
                statementStartLine = 0;
            } else {
                // Parse allocations (only if not in multi-line statement)
                const alloc = this.parseCAllocation(trimmed, lineNum, line, currentFunction, inLoop);
                if (alloc) {
                    nodes.push(alloc);
                }
                
                // Parse deallocations
                const dealloc = this.parseCDeallocation(trimmed, lineNum, line);
                if (dealloc) {
                    nodes.push(dealloc);
                }
            }
            
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

