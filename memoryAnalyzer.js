// Comprehensive Memory Leak Detection Engine
class MemoryAnalyzer {
    constructor(language = 'c') {
        this.language = language;
        this.allocations = new Map(); // varName -> [allocations]
        this.frees = [];
        this.warnings = [];
        this.timeline = [];
        this.currentMemory = 0;
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
            
            // Handle C++ new patterns
            if (this.language === 'cpp') {
                if (astNode.function === 'new[]') {
                    const arrayMatch = args.match(/(\d+)/);
                    if (arrayMatch) {
                        const count = parseInt(arrayMatch[1]) || 1;
                        return count * 4; // Default type size
                    }
                } else if (astNode.function === 'new') {
                    return 4; // Default object size
                }
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

