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

