// Global variables
let memoryChart = null;
let timelineChart = null;
let currentAnalysis = null;
let selectedLanguage = 'c'; // Default language

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

    // Perform analysis
    const analysis = performAnalysis(code, language);
    currentAnalysis = analysis;
    updateDashboard(analysis);
    updateLeaksTab(analysis);
    updateAnalysisTab(analysis);
    updateTimelineChart(analysis);
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
