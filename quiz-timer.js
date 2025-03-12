// Global variables for the timer
let globalTimer;
let globalTimeLeft = 300;
let lastUpdateTime = Date.now();

// Function to initialize the global timer UI
function initGlobalTimer() {
    console.log('Initializing global timer UI...');
    const quizSection = document.getElementById('quiz-section');
    const timerContainer = quizSection.querySelector('.timer-container');
    if (!timerContainer) {
        const newTimerContainer = document.createElement('div');
        newTimerContainer.className = 'timer-container';
        quizSection.insertBefore(newTimerContainer, quizSection.firstChild);
    }
    const activeTimerContainer = quizSection.querySelector('.timer-container');
    activeTimerContainer.innerHTML = `
        <div class="circular-timer">
            <div class="timer-circle">
                <div class="timer-circle-inner">
                    <span id="global-timer-display">05:00</span>
                </div>
            </div>
            <div class="timer-label">Time Remaining</div>
        </div>
    `;
    addCircularTimerStyles();
}

// Function to add CSS styles for the circular timer
function addCircularTimerStyles() {
    const styleElement = document.createElement('style');
    styleElement.id = 'timer-styles';
    styleElement.textContent = `
        .timer-container {
            display: flex;
            justify-content: center;
            align-items: center;
            margin-bottom: 15px;
            padding: 10px;
        }
        .circular-timer {
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        .timer-circle {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            border: 5px solid #3498db;
            display: flex;
            justify-content: center;
            align-items: center;
            transition: border-color 0.5s ease;
        }
        .timer-circle-inner {
            width: 70px;
            height: 70px;
            border-radius: 50%;
            background-color: #2c3e50;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        #global-timer-display {
            font-size: 24px;
            font-weight: bold;
            color: #3498db;
            transition: color 0.5s ease;
        }
        .timer-label {
            font-size: 12px;
            color: #ecf0f1;
            margin-top: 5px;
            text-align: center;
        }
        .timer-warning .timer-circle {
            border-color: #f39c12;
        }
        .timer-warning #global-timer-display {
            color: #f39c12;
        }
        .timer-danger .timer-circle {
            border-color: #e74c3c;
        }
        .timer-danger #global-timer-display {
            color: #e74c3c;
        }
        #timer {
            display: none !important;
        }
    `;
    document.head.appendChild(styleElement);
}

// Function to start the global timer
function startGlobalTimer() {
    console.log('Starting global 300-second timer...');
    globalTimeLeft = 300;
    lastUpdateTime = Date.now(); // Initialize the last update time
    initGlobalTimer();
    updateGlobalTimerDisplay();
    if (globalTimer) clearInterval(globalTimer);
    globalTimer = setInterval(() => {
        const now = Date.now();
        const elapsed = Math.floor((now - lastUpdateTime) / 1000); // Calculate elapsed time in seconds
        globalTimeLeft -= elapsed;
        lastUpdateTime = now; // Update the last update time
        updateGlobalTimerDisplay();
        if (globalTimeLeft <= 0) {
            clearInterval(globalTimer);
            console.log("Time's up! Ending quiz...");
            window.endQuiz();
        }
    }, 1000);
}

// Function to update the global timer display
function updateGlobalTimerDisplay() {
    const timerDisplay = document.getElementById('global-timer-display');
    const circularTimer = document.querySelector('.circular-timer');
    if (timerDisplay) {
        // Convert seconds to minutes and seconds
        const minutes = Math.floor(globalTimeLeft / 60);
        const seconds = globalTimeLeft % 60;
        // Format as MM:SS (e.g., 05:00)
        const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        timerDisplay.textContent = formattedTime;

        // Update timer appearance based on remaining time
        if (circularTimer) {
            if (globalTimeLeft <= 60) { // last minute
                circularTimer.className = 'circular-timer timer-danger';
            } else if (globalTimeLeft <= 120) { // last 2 minutes
                circularTimer.className = 'circular-timer timer-warning';
            } else {
                circularTimer.className = 'circular-timer';
            }
        }
    }
}

// Override the original startQuiz function to use the global timer
const originalStartQuiz = window.startQuiz;
window.startQuiz = function() {
    console.log('Overridden startQuiz called');
    originalStartQuiz.apply(this, arguments);
    startGlobalTimer();
};

// Handle tab visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        // Tab is visible again, update the last update time
        lastUpdateTime = Date.now();
    }
});

// Initialize and apply modifications when everything is loaded
window.addEventListener('load', function() {
    console.log('Window loaded, applying timer modifications...');
    setTimeout(applyTimerModification, 1000);
});

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, waiting to apply timer modifications...');
    setTimeout(applyTimerModification, 1500);
});
