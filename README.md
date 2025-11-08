# MLDA - Memory Leak Detector & Code Analyzer

A comprehensive, web-based Operating System (OS) project that detects memory leaks in user-provided code (initially focused on C/C++), provides detailed analysis, and suggests direct solutions to fix them. This project is developed by a 4-member B.Tech team for 5th semester OS principles course.

## 🎯 Project Overview

MLDA (Memory Leak Detector & Code Analyzer) is a universal memory leak detection tool that helps developers identify and fix memory management issues in their C/C++ code. The application provides real-time analysis, visualizations, and actionable recommendations to improve code quality and prevent memory leaks.

## ✨ Features

### 1. **Code Editor**
- Large, user-friendly code input area
- Syntax highlighting support
- Sample code loading functionality
- Clear editor option

### 2. **Real-Time Memory Statistics Dashboard**
- **Total Allocations**: Count of all malloc/calloc/realloc calls
- **Total Frees**: Count of all free() calls
- **Memory Leaks**: Number of detected memory leaks
- **Leaked Bytes**: Total amount of memory leaked
- **Critical Issues**: Count of critical code quality issues

### 3. **Memory Distribution Visualization**
- Interactive pie chart showing:
  - Allocated memory
  - Freed memory
  - Leaked memory

### 4. **Detailed Reporting Tabs**

#### A. Memory Leaks Tab
- Comprehensive list of all detected memory leaks
- For each leak, displays:
  - **Variable Name**: The variable that caused the leak
  - **Line Number**: Exact location in code
  - **Function**: Type of allocation function used
  - **Estimated Size**: Memory size in bytes
  - **Fix/Solution**: Actionable solution to fix the leak

#### B. Code Analysis Tab
- **Memory Allocation Analysis**: Detailed breakdown of allocation and deallocation calls
- **Memory Balance Status**: Shows if memory is balanced or unbalanced
- **Code Quality Warnings**:
  - Missing NULL pointer checks after allocation
  - Unsafe function usage (e.g., strcpy without bounds checking)
  - Other potential security issues

#### C. Memory Timeline Tab
- Line graph visualization showing:
  - Memory usage over code execution
  - Memory allocation and deallocation patterns
  - Helps identify where memory leaks occur during execution

#### D. Recommendations Tab
- Best practices for preventing memory leaks:
  - Always free allocated memory
  - Check for NULL pointers
  - Use safe string functions
  - Implement proper error handling
  - Use memory debugging tools
  - Follow RAII principles
  - Regular code reviews

## 🚀 Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, Edge)
- No additional installation required!

### Installation
1. Clone the repository:
```bash
git clone https://github.com/AdityaPandey-DEV/Memory-Leak-Detector.git
cd Memory-Leak-Detector
```

2. Open the HTML file in your browser:
```bash
open index.html
```
Or simply double-click the `index.html` file.

Alternatively, visit the live site: [https://adityapandey-dev.github.io/Memory-Leak-Detector/](https://adityapandey-dev.github.io/Memory-Leak-Detector/)

## 📖 How to Use

1. **Load Sample Code**: Click the "Load Sample" button to load example code with memory leaks
2. **Enter Your Code**: Paste or type your C/C++ code in the editor
3. **Analyze**: Click "Analyze Memory" to run the analysis
4. **Review Results**: 
   - Check the dashboard for quick statistics
   - Explore the tabs for detailed analysis
   - Review recommendations for best practices
5. **Fix Issues**: Use the suggested fixes to resolve memory leaks

## 🏗️ Architecture

### Frontend
- **HTML5**: Structure and layout
- **Tailwind CSS**: Modern, responsive design
- **JavaScript**: Analysis engine and interactivity
- **Chart.js**: Data visualization (pie charts and line graphs)

### Analysis Engine
- **Static Code Analysis**: Parses C/C++ code to detect:
  - Memory allocation calls (malloc, calloc, realloc)
  - Memory deallocation calls (free)
  - Memory leak patterns
  - Unsafe coding practices

### Key Technologies
- **Tailwind CSS CDN**: For styling
- **Chart.js**: For visualizations
- **Prism.js**: For syntax highlighting (optional)

## 🔬 OS Principles Connection

This project demonstrates several key Operating System concepts:

1. **Memory Management**: 
   - Heap allocation and deallocation
   - Memory leak detection
   - Memory tracking and monitoring

2. **Process Memory Layout**:
   - Understanding stack vs heap
   - Dynamic memory allocation
   - Memory lifecycle management

3. **Resource Management**:
   - Proper resource cleanup
   - Memory leak prevention
   - Resource tracking

4. **System Calls**:
   - Understanding malloc/free system calls
   - Memory allocation strategies
   - Error handling in memory operations

## 📊 Project Structure

```
Memory-Leak-Detector/
│
├── index.html                    # Main application file (single-file HTML)
├── README.md                    # Project documentation
└── .git/                        # Git repository
```

## 🎓 Educational Value

This project serves as a practical implementation of:
- **Memory Management Theory**: Understanding how memory allocation works
- **Static Analysis**: Code analysis without execution
- **Web Development**: Modern web technologies
- **Data Visualization**: Presenting complex data in understandable formats
- **Problem Solving**: Identifying and fixing memory-related issues

## 🛠️ Future Enhancements

Potential improvements for future versions:
- [ ] User authentication and history (Firebase integration)
- [ ] Support for more programming languages
- [ ] Real-time code execution analysis
- [ ] Integration with Valgrind or similar tools
- [ ] Export analysis reports (PDF/JSON)
- [ ] Code editor with syntax highlighting
- [ ] Multiple file analysis
- [ ] Performance metrics

## 👥 Team

Developed by a 4-member B.Tech team for 5th semester Operating Systems course.

## 📝 License

This project is developed for educational purposes as part of the B.Tech curriculum.

## 🤝 Contributing

This is an academic project. For suggestions or improvements, please open an issue or submit a pull request.

## 📧 Contact

For questions or feedback, please contact the development team.

---

**Note**: This is a static analysis tool that simulates memory leak detection. For production code, always use professional tools like Valgrind, AddressSanitizer, or Dr. Memory for comprehensive memory debugging.
