/**
 * Sample Code Module
 * Contains sample code snippets for different programming languages
 */

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

/**
 * Load sample code based on selected language
 */
function loadSampleCode() {
    try {
        const languageSelect = document.getElementById('languageSelect');
        if (!languageSelect) {
            debugError('Language select element not found');
            notifications.error('Language selector not found');
            return;
        }

        const language = languageSelect.value;
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
        
        const codeEditor = document.getElementById('codeEditor');
        if (codeEditor) {
            codeEditor.value = sample;
            notifications.success('Sample code loaded successfully');
        } else {
            debugError('Code editor element not found');
            notifications.error('Code editor not found');
        }
    } catch (error) {
        debugError('Error loading sample code:', error);
        notifications.error('Failed to load sample code: ' + error.message);
    }
}

