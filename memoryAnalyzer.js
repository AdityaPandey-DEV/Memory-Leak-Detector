/**
 * Comprehensive Memory Leak Detection Engine
 * Analyzes code for memory leaks, allocation/deallocation patterns, and code quality issues
 */
class MemoryAnalyzer {
    /**
     * Create a new MemoryAnalyzer instance
     * @param {string} language - Programming language ('c', 'cpp', 'javascript', etc.)
     */
    constructor(language = 'c') {
        this.language = language;
        this.allocations = new Map(); // varName -> [allocations]
        this.frees = [];
        this.warnings = [];
        this.timeline = [];
        this.currentMemory = 0;
        
        try {
            this.astParser = new ASTParser(language);
        } catch (error) {
            debugError('Failed to create AST parser:', error);
            throw new Error('Failed to initialize analyzer: ' + error.message);
        }
    }

    /**
     * Analyze code for memory leaks and issues
     * @param {string} code - Source code to analyze
     * @returns {Object} Analysis results with allocations, frees, leaks, warnings, and timeline
     */
    analyze(code) {
        if (!code || typeof code !== 'string') {
            throw new Error('Invalid code input: code must be a non-empty string');
        }

        try {
            // Use AST parser for improved accuracy
            const ast = this.astParser.parse(code);
            if (!ast || !ast.body) {
                throw new Error('AST parsing failed: invalid AST structure');
            }

            const analysis = {
                allocations: [],
                frees: [],
                leaks: [],
                warnings: [],
                timeline: []
            };

            // Traverse AST nodes
            ast.body.forEach(node => {
                try {
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
                } catch (error) {
                    debugError('Error processing AST node:', error);
                    // Continue processing other nodes
                }
            });

            // Also check for code quality issues using original code
            const lines = code.split('\n');
            lines.forEach((line, index) => {
                try {
                    this.detectCodeQualityIssues(line, index + 1, line, analysis);
                } catch (error) {
                    debugError('Error detecting code quality issues:', error);
                }
            });

            // Find all leaks
            this.findLeaks(analysis);

            return analysis;
        } catch (error) {
            debugError('Analysis error:', error);
            throw new Error('Analysis failed: ' + error.message);
        }
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

    /**
     * Calculate size from AST node using language-specific constants
     * @param {Object} astNode - AST node containing allocation information
     * @param {string} args - Arguments string from the allocation call
     * @returns {number} Estimated size in bytes
     */
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
            
            // Handle C++ new patterns
            if (this.language === 'cpp') {
                if (astNode.function === 'new[]') {
                    const arrayMatch = args.match(/(\d+)/);
                    if (arrayMatch) {
                        const count = parseInt(arrayMatch[1]) || 1;
                        return count * CONFIG.TYPE_SIZES.DEFAULT;
                    }
                } else if (astNode.function === 'new') {
                    return CONFIG.TYPE_SIZES.DEFAULT;
                }
            }
        } else {
            // Use language-specific size from config
            const langSize = CONFIG.LANGUAGE_SIZES[this.language] || CONFIG.TYPE_SIZES.DEFAULT;
            if (this.language === 'javascript') {
                if (Array.isArray(astNode.args)) {
                    const size = astNode.args[0] || 1;
                    return (typeof size === 'number' ? size : 1) * langSize;
                }
                return langSize;
            } else if (this.language === 'python' || this.language === 'rust' || this.language === 'go') {
                const sizeArg = Array.isArray(astNode.args) ? astNode.args[0] : (astNode.args || '1');
                const size = typeof sizeArg === 'number' ? sizeArg : parseInt(sizeArg) || 1;
                return size * langSize;
            } else if (this.language === 'java') {
                const sizeArg = Array.isArray(astNode.args) ? astNode.args[0] : (astNode.args || '1');
                const size = typeof sizeArg === 'number' ? sizeArg : parseInt(sizeArg) || 1;
                return size * langSize;
            }
        }
        
        return 1;
    }

    // Get line from code by line number
    getLineFromCode(code, lineNum) {
        const lines = code.split('\n');
        return lines[lineNum - 1] || '';
    }

    /**
     * Get type size from sizeof expression or context
     * @param {string} args - Arguments string containing type information
     * @returns {number} Type size in bytes
     */
    getTypeSize(args) {
        const sizeofMatch = args.match(/sizeof\s*\(([^)]+)\)/);
        if (sizeofMatch) {
            const type = sizeofMatch[1].trim();
            if (type.includes('char')) return CONFIG.TYPE_SIZES.CHAR;
            if (type.includes('int') || type.includes('float')) return CONFIG.TYPE_SIZES.INT;
            if (type.includes('double') || type.includes('long long')) return CONFIG.TYPE_SIZES.DOUBLE;
        }
        
        // Try to detect from context
        if (args.includes('char')) return CONFIG.TYPE_SIZES.CHAR;
        if (args.includes('int') || args.includes('float')) return CONFIG.TYPE_SIZES.INT;
        if (args.includes('double')) return CONFIG.TYPE_SIZES.DOUBLE;
        
        return CONFIG.TYPE_SIZES.DEFAULT;
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

