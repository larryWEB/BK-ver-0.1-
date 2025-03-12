// Modified quiz-timer.js
// This version properly integrates with the existing timer functionality

// Global variables
let globalTimer; // Overall quiz timer (5 minutes)
let globalTimeLeft = 5 * 60; // 5 minutes in seconds
let quizTimerInitialized = false; // Flag to track if the timer system is initialized

// Initialize the quiz timer system
function initQuizTimer() {
    if (quizTimerInitialized) return; // Prevent multiple initializations
    console.log('Initializing quiz timer system...');
    quizTimerInitialized = true;
    
    // Add global timer to the quiz section
    const quizSection = document.getElementById('quiz-section');
    if (!quizSection) {
        console.error('Quiz section not found!');
        return;
    }
    
    // Find the timer container without replacing it
    const timerContainer = quizSection.querySelector('.timer-container');
    if (!timerContainer) {
        console.error('Timer container not found!');
        return;
    }
    
    // Create global timer display
    const globalTimerDisplay = document.createElement('div');
    globalTimerDisplay.className = 'global-timer';
    globalTimerDisplay.innerHTML = '<span id="global-minutes">5</span>:<span id="global-seconds">00</span>';
    
    // Add label for global timer
    const globalTimerLabel = document.createElement('div');
    globalTimerLabel.className = 'timer-label';
    globalTimerLabel.textContent = 'Quiz Time:';
    
    // Create container for global timer
    const globalTimerContainer = document.createElement('div');
    globalTimerContainer.className = 'global-timer-container';
    globalTimerContainer.appendChild(globalTimerLabel);
    globalTimerContainer.appendChild(globalTimerDisplay);
    
    // Add the global timer next to the existing timer without replacing it
    timerContainer.appendChild(globalTimerContainer);
    
    // Add CSS for timers
    addTimerStyles();
}

// Add CSS styles for timers
function addTimerStyles() {
    // Check if styles already exist
    if (document.getElementById('timer-styles')) return;
    
    const styleElement = document.createElement('style');
    styleElement.id = 'timer-styles';
    styleElement.textContent = `
        .timer-container {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            background-color: #2c3e50;
            padding: 10px;
            border-radius: 5px;
        }
        
        .global-timer-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            margin-left: 20px;
        }
        
        .timer-label {
            font-size: 12px;
            color: #ecf0f1;
            margin-bottom: 5px;
        }
        
        .global-timer {
            font-size: 24px;
            font-weight: bold;
            color: #3498db;
        }
        
        .timer-warning {
            color: #f39c12;
        }
        
        .timer-danger {
            color: #e74c3c;
        }
    `;
    document.head.appendChild(styleElement);
}

// Start the global timer
function startGlobalTimer() {
    // Clear any existing timer
    if (globalTimer) clearInterval(globalTimer);
    
    // Reset global time
    globalTimeLeft = 5 * 60; // 5 minutes in seconds
    
    // Display initial time
    updateGlobalTimerDisplay();
    
    // Start the countdown
    globalTimer = setInterval(() => {
        globalTimeLeft--;
        updateGlobalTimerDisplay();
        
        // If time is up, end the quiz
        if (globalTimeLeft <= 0) {
            clearInterval(globalTimer);
            if (typeof endQuiz === 'function') {
                endQuiz();
            }
        }
    }, 1000);
}

// Update the global timer display
function updateGlobalTimerDisplay() {
    const minutes = Math.floor(globalTimeLeft / 60);
    const seconds = globalTimeLeft % 60;
    
    const minutesElement = document.getElementById('global-minutes');
    const secondsElement = document.getElementById('global-seconds');
    
    if (minutesElement && secondsElement) {
        minutesElement.textContent = minutes;
        secondsElement.textContent = seconds < 10 ? `0${seconds}` : seconds;
        
        // Add warning colors
        const globalTimerDisplay = document.querySelector('.global-timer');
        if (globalTimerDisplay) {
            if (globalTimeLeft <= 60) { // last minute
                globalTimerDisplay.className = 'global-timer timer-danger';
            } else if (globalTimeLeft <= 120) { // last 2 minutes
                globalTimerDisplay.className = 'global-timer timer-warning';
            } else {
                globalTimerDisplay.className = 'global-timer';
            }
        }
    }
}

// Fix the original startTimer function in quit.js
function fixQuitJsTimerFunctions() {
    // Fix the startTimer function to ensure it properly counts down
    window.startTimer = function() {
        timeLeft = 15;
        updateTimerDisplay();
        
        clearInterval(timer);
        timer = setInterval(() => {
            timeLeft--;
            updateTimerDisplay();
            
            if (timeLeft <= 0) {
                clearInterval(timer);
                // Auto-select answer or move to next question
                if (currentUser.selectedAnswers[currentUser.currentQuestion] === undefined) {
                    currentUser.selectedAnswers[currentUser.currentQuestion] = -1; // No answer
                    showAnswerFeedback(); // Show feedback when timer runs out
                }
            }
        }, 1000);
    };
    
    // Fix updateTimerDisplay to ensure the timer UI updates correctly
    window.updateTimerDisplay = function() {
        const timerElement = document.getElementById('timer');
        if (timerElement) {
            timerElement.textContent = timeLeft;
            
            // Add warning colors
            if (timeLeft <= 5) {
                timerElement.style.color = '#e74c3c'; // Red for last 5 seconds
            } else if (timeLeft <= 10) {
                timerElement.style.color = '#f39c12'; // Orange for last 10 seconds
            } else {
                timerElement.style.color = ''; // Default color
            }
        }
    };
    
    // Fix loadQuestion to ensure progress updates correctly
    window.loadQuestion = function() {
        const questionIndex = currentUser.currentQuestion;
        
        // Safety check
        if (questionIndex >= currentUser.randomQuestions.length) {
            console.error('Question index out of bounds!');
            endQuiz();
            return;
        }
        
        const questionInfo = currentUser.randomQuestions[questionIndex];
        const category = questionInfo.category;
        const randomIndex = questionInfo.index;
        
        if (!window.quizQuestions[category] || !window.quizQuestions[category][randomIndex]) {
            console.error(`Question not found: ${category}[${randomIndex}]`);
            alert('Error loading question. Please try again.');
            resetQuiz();
            return;
        }
        
        const question = window.quizQuestions[category][randomIndex];
        
        // Update question text (add category label and question number)
        questionText.textContent = `${questionIndex + 1}/20. [${category.toUpperCase()}] ${question.question}`;
        
        // Create option elements
        optionsContainer.innerHTML = '';
        question.options.forEach((option, index) => {
            const optionElement = document.createElement('div');
            optionElement.classList.add('option');
            optionElement.dataset.index = index;
            optionElement.textContent = option;
            optionElement.addEventListener('click', selectOption);
            optionsContainer.appendChild(optionElement);
        });
        
        // Update progress bar - fix calculation
        const progress = ((questionIndex) / 19) * 100; // 0-based index so 19 questions total
        progressBar.style.width = `${progress}%`;
        
        // Disable next button until option is selected
        nextBtn.disabled = true;
        
        // Reset the next button text (in case it was changed)
        nextBtn.textContent = "Next Question";
        
        // If there's a feedback element, clear it
        if (answerFeedbackText) {
            answerFeedbackText.textContent = "";
            answerFeedbackText.classList.add('hidden');
        }
    };
}

// Hook into existing functions without completely replacing them
document.addEventListener('DOMContentLoaded', function() {
    console.log('Fixed Quiz timer system: DOM loaded');
    
    // Wait a short time to ensure all original scripts are loaded
    setTimeout(() => {
        // Fix the timer functions
        fixQuitJsTimerFunctions();
        
        // Connect our initQuizTimer to the original startQuiz
        const originalStartQuiz = window.startQuiz;
        window.startQuiz = function() {
            console.log('Starting quiz with fixed timer system...');
            
            // Initialize the timer system
            initQuizTimer();
            
            // Start the global timer
            startGlobalTimer();
            
            // Call the original startQuiz
            if (typeof originalStartQuiz === 'function') {
                return originalStartQuiz();
            }
        };
    }, 500);
});