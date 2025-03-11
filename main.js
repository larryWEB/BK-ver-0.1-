// Initialize global quiz questions object
if (!window.quizQuestions) {
    window.quizQuestions = {};
}

// Application state
let currentUser = {
    name: "",
    categories: {}, // Will store category: questionCount pairs
    currentQuestion: 0,
    score: 0,
    selectedAnswers: [],
    randomQuestions: [], // Will store objects {category, questionIndex}
    lastCategorySelections: {} // Store last selections to persist them
};

let timer;
let timeLeft = 15;
let isSingleCategoryMode = false; // Track if user chose single category mode
let answerFeedbackTimer; // New timer for showing feedback before moving to next question

// DOM Elements
const nameModal = document.getElementById('name-modal');
const nameInput = document.getElementById('name-input');
const nameError = document.getElementById('name-error');
const nameSubmitBtn = document.getElementById('name-submit-btn');

const welcomeSection = document.getElementById('welcome-section');
const userNameDisplay = document.getElementById('user-name-display');
const categoryCards = document.querySelectorAll('.category-card');

const categorySelectionSection = document.getElementById('category-selection-section');
const totalQuestionsCount = document.getElementById('total-questions-count');
const categoryCountInputs = document.querySelectorAll('.category-count');
const categoryError = document.getElementById('category-error');
const backToWelcomeBtn = document.getElementById('back-to-welcome-btn');
const confirmCategoriesBtn = document.getElementById('confirm-categories-btn');
const quickSelectAllBtn = document.getElementById('quick-select-all');

const rulesSection = document.getElementById('rules-section');
const selectedCategoryDisplay = document.getElementById('selected-category-display');
const startQuizBtn = document.getElementById('start-quiz-btn');
const backToCategoriesBtn = document.getElementById('back-to-categories-btn');

const quizSection = document.getElementById('quiz-section');
const timerElement = document.getElementById('timer');
const progressBar = document.getElementById('progress-bar');
const questionText = document.getElementById('question-text');
const optionsContainer = document.getElementById('options-container');
const nextBtn = document.getElementById('next-btn');
const answerFeedbackText = document.getElementById('answer-feedback-text'); // New element for feedback text

const resultSection = document.getElementById('result-section');
const scoreDisplay = document.getElementById('score-display');
const perfectScoreSection = document.getElementById('perfect-score-section');
const tryAgainSection = document.getElementById('try-again-section');
const scoreInput = document.getElementById('score-input');
const userInfoForm = document.getElementById('user-info-form');
const tryAgainBtn = document.getElementById('try-again-btn');

const thankYouModal = document.getElementById('thank-you-modal');
const closeThankYouBtn = document.getElementById('close-thank-you-btn');
const contactSubmitBtn = document.getElementById('contact-submit-btn');
const contactEmail = document.getElementById('contact-email');
const emailError = document.getElementById('email-error');

// Function to load category questions dynamically
function loadCategoryQuestions(category) {
    console.log(`Attempting to load questions for category: ${category}`);
    return new Promise((resolve, reject) => {
        // Check if questions are already loaded
        if (window.quizQuestions && window.quizQuestions[category]) {
            console.log(`Questions for ${category} already loaded`);
            resolve();
            return;
        }
        
        // Create script element
        const script = document.createElement('script');
        script.src = `questions/${category}.js`;
        console.log(`Loading script from: ${script.src}`);
        
        script.onload = () => {
            console.log(`Successfully loaded questions for ${category}`);
            resolve();
        };
        
        script.onerror = (error) => {
            console.error(`Failed to load ${category} questions:`, error);
            reject(new Error(`Failed to load ${category} questions`));
        };
        
        // Add to document
        document.head.appendChild(script);
    });
}

// Cookie functions
function setCookie(name, value, days) {
    const d = new Date();
    d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "expires=" + d.toUTCString();
    document.cookie = name + "=" + value + ";" + expires + ";path=/";
}

function getCookie(name) {
    const cookieName = name + "=";
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(cookieName) === 0) {
            return c.substring(cookieName.length, c.length);
        }
    }
    return "";
}

// Check for existing user (cookies)
function checkExistingUser() {
    const storedUser = getCookie('quizUser');
    if (storedUser) {
        try {
            return JSON.parse(storedUser);
        } catch (e) {
            return null;
        }
    }
    return null;
}

// Initialize the application
function init() {
    console.log('Initializing application...');
    
    // Check for existing user
    const existingUser = checkExistingUser();
    if (existingUser) {
        console.log('Found existing user:', existingUser.name);
        currentUser = existingUser;
        showWelcomeScreen();
    }
    
    // Prevent browser back button
    window.history.pushState(null, null, window.location.href);
    window.addEventListener('popstate', function() {
        window.history.pushState(null, null, window.location.href);
        alert('Navigation is disabled during the quiz.');
    });
    
    // Prevent leaving the page during quiz
    window.addEventListener('beforeunload', function(e) {
        if (quizSection.classList.contains('hidden') === false) {
            e.preventDefault();
            e.returnValue = '';
            return '';
        }
    });
    
    // Handle name input
    nameSubmitBtn.addEventListener('click', validateAndSubmitName);
    nameInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            validateAndSubmitName();
        }
    });
    
    // Convert input to uppercase as the user types
    nameInput.addEventListener("input", function() {
        this.value = this.value.toUpperCase();
    });
    
    // Handle category selection - Single category mode
    categoryCards.forEach(card => {
        card.addEventListener('click', function() {
            const selectedCategory = this.getAttribute('data-category');
            isSingleCategoryMode = true;
            
            // Clear all previous selections
            categoryCountInputs.forEach(input => {
                input.value = 0;
            });
            
            // Set the selected category to 20 questions
            const selectedInput = document.querySelector(`.category-count[data-category="${selectedCategory}"]`);
            if (selectedInput) {
                selectedInput.value = 20;
            }
            
            welcomeSection.classList.add('hidden');
            categorySelectionSection.classList.remove('hidden');
            updateTotalQuestions();
            
            // Update the UI to indicate single category mode
            categoryError.textContent = `You've selected 20 questions from ${selectedCategory.toUpperCase()}. You can adjust if needed.`;
            categoryError.style.color = '#2ecc71'; // Green color
        });
    });
    
    // Handle category count inputs
    categoryCountInputs.forEach(input => {
        input.addEventListener('change', function() {
            // If we're in single category mode, switch to mixed mode
            if (isSingleCategoryMode) {
                isSingleCategoryMode = false;
            }
            updateTotalQuestions();
        });
    });
    
    // If quick select button exists, add event listener
    if (quickSelectAllBtn) {
        quickSelectAllBtn.addEventListener('click', distributeQuestionsEvenly);
    }
    
    // Handle back to welcome button
    backToWelcomeBtn.addEventListener('click', function() {
        // Save current selections before going back
        saveCurrentSelections();
        
        categorySelectionSection.classList.add('hidden');
        welcomeSection.classList.remove('hidden');
    });
    
    // Handle confirm categories button
    confirmCategoriesBtn.addEventListener('click', confirmCategories);
    
    // Handle back to categories button
    backToCategoriesBtn.addEventListener('click', function() {
        rulesSection.classList.add('hidden');
        categorySelectionSection.classList.remove('hidden');
        
        // Restore previous selections
        restorePreviousSelections();
    });
    
    // Handle start quiz button
    startQuizBtn.addEventListener('click', startQuiz);
    
    // Handle next question button
    nextBtn.addEventListener('click', showAnswerFeedback); // Changed to show feedback first
    
    // Handle try again button
    tryAgainBtn.addEventListener('click', resetQuiz);
    
    // Handle contact submission
    contactSubmitBtn.addEventListener('click', submitContactEmail);
    
    // Handle user info form submission
    userInfoForm.addEventListener('submit', submitUserInfo);
    
    // Handle thank you modal close
    closeThankYouBtn.addEventListener('click', function() {
        thankYouModal.classList.add('hidden');
        resetQuiz();
    });

    // Set greeting on page load
    document.getElementById("greeting").textContent = getTimeBasedGreeting();
}

// Function to save current category selections
function saveCurrentSelections() {
    currentUser.lastCategorySelections = {};
    
    categoryCountInputs.forEach(input => {
        const category = input.getAttribute('data-category');
        const count = parseInt(input.value) || 0;
        if (count > 0) {
            currentUser.lastCategorySelections[category] = count;
        }
    });
    
    console.log("Saved selections:", currentUser.lastCategorySelections);
}

// Function to restore previous selections
function restorePreviousSelections() {
    if (Object.keys(currentUser.lastCategorySelections).length > 0) {
        console.log("Restoring previous selections:", currentUser.lastCategorySelections);
        
        // First clear all inputs
        categoryCountInputs.forEach(input => {
            input.value = 0;
        });
        
        // Then restore saved values
        for (const category in currentUser.lastCategorySelections) {
            const input = document.querySelector(`.category-count[data-category="${category}"]`);
            if (input) {
                input.value = currentUser.lastCategorySelections[category];
            }
        }
        
        updateTotalQuestions();
    }
}

// Function to distribute questions evenly across all categories
function distributeQuestionsEvenly() {
    const categoryCount = categoryCountInputs.length;
    const baseCount = Math.floor(20 / categoryCount);
    let remainder = 20 % categoryCount;
    
    categoryCountInputs.forEach(input => {
        let count = baseCount;
        if (remainder > 0) {
            count++;
            remainder--;
        }
        input.value = count;
    });
    
    updateTotalQuestions();
    isSingleCategoryMode = false;
}

// Function to get time-based greeting
function getTimeBasedGreeting() {
    const hour = new Date().getHours();
    
    if (hour >= 5 && hour < 12) {
        return "Good Morning";
    } else if (hour >= 12 && hour < 17) {
        return "Good Afternoon";
    } else {
        return "Good Evening";
    }
}

// Validate and submit name
function validateAndSubmitName() {
    const name = nameInput.value.trim();
    
    // Check if name is valid (no numbers or symbols)
    if (!name) {
        nameError.textContent = "Please enter your name.";
        return;
    }
    
    if (!/^[A-Z\s]+$/.test(name)) {
        nameError.textContent = "Please enter a valid name in uppercase letters (no numbers or symbols).";
        return;
    }
    
    // Set user name and show welcome screen
    currentUser.name = name;
    showWelcomeScreen();
    
    // Save user data to cookies
    setCookie('quizUser', JSON.stringify(currentUser), 7);
}

// Show welcome screen
function showWelcomeScreen() {
    nameModal.classList.add('hidden');
    welcomeSection.classList.remove('hidden');
    userNameDisplay.textContent = currentUser.name;
}

// Update total questions count
function updateTotalQuestions() {
    let total = 0;
    categoryCountInputs.forEach(input => {
        total += parseInt(input.value) || 0;
    });
    
    totalQuestionsCount.textContent = total;
    
    // Update UI based on total
    if (total > 20) {
        totalQuestionsCount.style.color = '#e74c3c'; // Red for over limit
        categoryError.textContent = "Total questions cannot exceed 20.";
        categoryError.style.color = '#e74c3c';
    } else if (total < 20) {
        totalQuestionsCount.style.color = '#e67e22'; // Orange for under limit
        categoryError.textContent = "Please select exactly 20 questions in total.";
        categoryError.style.color = '#e67e22';
    } else {
        totalQuestionsCount.style.color = '#2ecc71'; // Green for correct
        categoryError.textContent = "Perfect! You've selected 20 questions.";
        categoryError.style.color = '#2ecc71';
    }
}

// Confirm categories
function confirmCategories() {
    // Check if total is exactly 20
    let total = 0;
    const selectedCategories = {};
    
    categoryCountInputs.forEach(input => {
        const count = parseInt(input.value) || 0;
        const category = input.getAttribute('data-category');
        
        if (count > 0) {
            selectedCategories[category] = count;
        }
        
        total += count;
    });
    
    if (total !== 20) {
        categoryError.textContent = "Please select exactly 20 questions in total.";
        categoryError.style.color = '#e74c3c';
        return;
    }
    
    // Store selected categories
    currentUser.categories = selectedCategories;
    
    // Save these selections for later
    saveCurrentSelections();
    
    // Load all selected categories
    const categoryLoadPromises = Object.keys(selectedCategories).map(category => 
        loadCategoryQuestions(category)
    );
    
    Promise.all(categoryLoadPromises)
        .then(() => {
            // Show rules screen
            categorySelectionSection.classList.add('hidden');
            rulesSection.classList.remove('hidden');
            
            // Display categories in the rules section
            const categoryNames = Object.keys(selectedCategories)
                .map(cat => cat.charAt(0).toUpperCase() + cat.slice(1))
                .join(', ');
            selectedCategoryDisplay.textContent = categoryNames;
            
            console.log('All categories loaded successfully');
        })
        .catch(error => {
            console.error('Error loading categories:', error);
            alert('Failed to load questions. Please try again.');
        });
}

// Generate random questions based on selected categories
function generateRandomQuestions() {
    const selectedCategories = currentUser.categories;
    const randomQuestions = [];
    
    // For each selected category
    for (const category in selectedCategories) {
        const count = selectedCategories[category];
        
        // Safety check - make sure questions exist
        if (!window.quizQuestions || !window.quizQuestions[category]) {
            console.error(`Questions for ${category} not found!`);
            alert(`Error: Questions for ${category} could not be loaded. Please try another category.`);
            continue;
        }
        
        const totalAvailable = window.quizQuestions[category].length;
        console.log(`Generating ${count} random questions from ${totalAvailable} available ${category} questions`);
        
        // If we have fewer questions available than requested
        if (totalAvailable < count) {
            console.warn(`Not enough ${category} questions available (requested ${count}, have ${totalAvailable})`);
            for (let i = 0; i < totalAvailable; i++) {
                randomQuestions.push({
                    category: category,
                    index: i
                });
            }
        } else {
            // Generate unique random indices for this category
            const usedIndices = new Set();
            
            while (usedIndices.size < count) {
                const randomIndex = Math.floor(Math.random() * totalAvailable);
                if (!usedIndices.has(randomIndex)) {
                    usedIndices.add(randomIndex);
                    randomQuestions.push({
                        category: category,
                        index: randomIndex
                    });
                }
            }
        }
    }
    
    // Shuffle the questions to mix categories
    for (let i = randomQuestions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [randomQuestions[i], randomQuestions[j]] = [randomQuestions[j], randomQuestions[i]];
    }
    
    console.log(`Generated ${randomQuestions.length} random questions from multiple categories`);
    return randomQuestions;
}

// Start quiz
function startQuiz() {
    console.log('Starting quiz...');
    
    // Hide rules section, show quiz section
    rulesSection.classList.add('hidden');
    quizSection.classList.remove('hidden');
    
    // Generate random questions for this session
    currentUser.randomQuestions = generateRandomQuestions();
    
    if (currentUser.randomQuestions.length === 0) {
        console.error('No questions available!');
        alert('Error: No questions available. Please select different categories.');
        resetQuiz();
        return;
    }
    
    // Reset question counter and score
    currentUser.currentQuestion = 0;
    currentUser.score = 0;
    currentUser.selectedAnswers = [];
    
    // Set up first question
    loadQuestion();
    startTimer();
    
    // Save user data to cookies
    setCookie('quizUser', JSON.stringify(currentUser), 7);
}

// Load current question
function loadQuestion() {
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
    
    // Update question text (add category label)
    questionText.textContent = `${questionIndex + 1}. [${category.toUpperCase()}] ${question.question}`;
    
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
    
    // Update progress bar
    const progress = ((questionIndex) / 20) * 100;
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
}

// Select option
function selectOption(e) {
    // Remove selected class from all options
    document.querySelectorAll('.option').forEach(option => {
        option.classList.remove('selected');
    });
    
    // Add selected class to clicked option
    e.target.classList.add('selected');
    
    // Enable next button
    nextBtn.disabled = false;
    
    // Save selected answer
    currentUser.selectedAnswers[currentUser.currentQuestion] = parseInt(e.target.dataset.index);
}

// Start timer
function startTimer() {
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
}

// Update timer display
function updateTimerDisplay() {
    timerElement.textContent = timeLeft;
}

// NEW: Show answer feedback before moving to next question
function showAnswerFeedback() {
    clearInterval(timer); // Stop the timer
    
    const questionIndex = currentUser.currentQuestion;
    
    // Safety check
    if (questionIndex >= currentUser.randomQuestions.length) {
        console.error(`Question index ${questionIndex} is out of bounds!`);
        endQuiz();
        return;
    }
    
    // Get the question information from our randomQuestions array
    const questionInfo = currentUser.randomQuestions[questionIndex];
    const category = questionInfo.category;
    const indexInCategory = questionInfo.index;
    
    if (!window.quizQuestions || !window.quizQuestions[category]) {
        console.error(`Questions for ${category} not found when checking answer!`);
        alert('Error checking answer. Please try again.');
        resetQuiz();
        return;
    }
    
    const question = window.quizQuestions[category][indexInCategory];
    
    if (!question) {
        console.error(`Question not found in category ${category} at index ${indexInCategory}!`);
        alert('Error checking answer. Please try again.');
        resetQuiz();
        return;
    }
    
    const selectedAnswer = currentUser.selectedAnswers[questionIndex];
    const correctAnswer = question.correctAnswer;
    
    console.log(`Checking answer for question ${questionIndex + 1}: selected=${selectedAnswer}, correct=${correctAnswer}`);
    
    // Get all option elements
    const options = document.querySelectorAll('.option');
    
    // Reset all option styles
    options.forEach(option => {
        option.classList.remove('correct-answer', 'wrong-answer');
    });
    
    // Highlight the correct answer
    const correctOption = options[correctAnswer];
    if (correctOption) {
        correctOption.classList.add('correct-answer');
    }
    
    // If user selected an answer and it's wrong, highlight it as wrong
    if (selectedAnswer !== -1 && selectedAnswer !== correctAnswer) {
        const selectedOption = options[selectedAnswer];
        if (selectedOption) {
            selectedOption.classList.add('wrong-answer');
        }
    }
    
    // Update score if answer is correct
    if (selectedAnswer === correctAnswer) {
        currentUser.score += 5; // Each question is worth 5 marks
        
        // Display feedback text if element exists
        if (answerFeedbackText) {
            answerFeedbackText.textContent = "Correct! +5 points";
            answerFeedbackText.classList.remove('hidden');
            answerFeedbackText.style.color = '#2ecc71'; // Green color
        }
    } else {
        // Display feedback text if element exists
        if (answerFeedbackText) {
            answerFeedbackText.textContent = `Incorrect. The correct answer is: ${question.options[correctAnswer]}`;
            answerFeedbackText.classList.remove('hidden');
            answerFeedbackText.style.color = '#e74c3c'; // Red color
        }
    }
    
    // Disable clicking on options during feedback
    options.forEach(option => {
        option.removeEventListener('click', selectOption);
        option.style.cursor = 'default';
    });
    
    // Change next button text to indicate moving to next question
    nextBtn.textContent = "Continue";
    nextBtn.disabled = false;
    
    // Remove the click event listener and add a new one
    nextBtn.removeEventListener('click', showAnswerFeedback);
    nextBtn.addEventListener('click', goToNextQuestion);
    
    // Save user data to cookies
    setCookie('quizUser', JSON.stringify(currentUser), 7);
}

// Go to next question
function goToNextQuestion() {
    // Reset the next button event listener
    nextBtn.removeEventListener('click', goToNextQuestion);
    nextBtn.addEventListener('click', showAnswerFeedback);
    
    // Move to next question
    currentUser.currentQuestion++;
    if (currentUser.currentQuestion >= 20 || currentUser.currentQuestion >= currentUser.randomQuestions.length) {
        endQuiz();
    } else {
        loadQuestion();
        startTimer();
    }
}

// End quiz
function endQuiz() {
    console.log('Quiz ended. Final score:', currentUser.score);
    clearInterval(timer);
    quizSection.classList.add('hidden');
    resultSection.classList.remove('hidden');

    // Display score
    scoreDisplay.textContent = currentUser.score;
    scoreInput.value = currentUser.score;

    // Display user name and categories
    const userNameDisplay = document.getElementById('user-name-result');
    const categoryDisplay = document.getElementById('category-result');
    const dateDisplay = document.getElementById('date-result');
    const timeDisplay = document.getElementById('time-result');

    if (userNameDisplay) {
        userNameDisplay.textContent = `Name: ${currentUser.name}`;
    }
    if (categoryDisplay) {
        // Create a string of all categories used
        const categoryNames = Object.keys(currentUser.categories)
            .map(cat => cat.toUpperCase())
            .join(', ');
        categoryDisplay.textContent = `Categories: ${categoryNames}`;
    }

    // Get current date and time
    const now = new Date();
    const formattedDate = now.toLocaleDateString();
    const formattedTime = now.toLocaleTimeString();

    // Display date and time separately
    if (dateDisplay) {
        dateDisplay.textContent = formattedDate;
    }
    if (timeDisplay) {
        timeDisplay.textContent = formattedTime;
    }

    // Show appropriate section based on score
    if (currentUser.score === 100) {
        perfectScoreSection.classList.remove('hidden');
        tryAgainSection.classList.add('hidden');
    } else {
        perfectScoreSection.classList.add('hidden');
        tryAgainSection.classList.remove('hidden');
    }
}

// Reset quiz
function resetQuiz() {
    console.log('Resetting quiz...');
    currentUser.currentQuestion = 0;
    currentUser.score = 0;
    currentUser.selectedAnswers = [];
    currentUser.randomQuestions = [];
    
    // Hide all sections
    resultSection.classList.add('hidden');
    quizSection.classList.add('hidden');
    rulesSection.classList.add('hidden');
    categorySelectionSection.classList.add('hidden');
    
    // Clear form data
    if (contactEmail) contactEmail.value = '';
    if (emailError) emailError.textContent = '';
    
    // Hide form and buttons when returning to welcome screen after results
    if (contactSubmitBtn) contactSubmitBtn.style.display = 'none';
    if (tryAgainBtn) tryAgainBtn.style.display = 'none';
    if (userInfoForm) userInfoForm.reset();
    
    // Show welcome section
    welcomeSection.classList.remove('hidden');
    
    // Save user data to cookies
    setCookie('quizUser', JSON.stringify(currentUser), 7);
    
    // After a short delay, restore the form and buttons for future attempts
    setTimeout(() => {
        if (contactSubmitBtn) contactSubmitBtn.style.display = 'block';
        if (tryAgainBtn) tryAgainBtn.style.display = 'block';
    }, 1000);
}

// Submit contact email
function submitContactEmail() {
    const email = contactEmail.value.trim();
    
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        emailError.textContent = "Please enter a valid email address.";
        return;
    }
    
    // Here you would normally send the email to your server
    console.log('Contact email submitted:', email);
    
    // Show thank you message
    thankYouModal.classList.remove('hidden');
    
    // Clear input
    contactEmail.value = '';
    emailError.textContent = '';
}

// Submit user info
function submitUserInfo(e) {
    e.preventDefault();
    
    // Get form data
    const formData = new FormData(userInfoForm);
    const userData = {
        fullName: formData.get('full-name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        comment: formData.get('comment'),
        score: formData.get('score')
    };
    
    console.log('Perfect score form submitted:', userData);
    
    // Show thank you modal
    thankYouModal.classList.remove('hidden');
    userInfoForm.reset();
}

// Initialize the application when DOM is fully loaded
document.addEventListener('DOMContentLoaded', init);
