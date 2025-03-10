// Initialize global quiz questions object
if (!window.quizQuestions) {
    window.quizQuestions = {};
}

// Application state
let currentUser = {
    name: "",
    category: "",
    currentQuestion: 0,
    score: 0,
    selectedAnswers: [],
    randomQuestions: [] // Array to store indices of random questions
};

let timer;
let timeLeft = 15;

// Elements
const nameModal = document.getElementById('name-modal');
const nameInput = document.getElementById('name-input');
const nameError = document.getElementById('name-error');
const nameSubmitBtn = document.getElementById('name-submit-btn');

const welcomeSection = document.getElementById('welcome-section');
const userNameDisplay = document.getElementById('user-name-display');
const categoryCards = document.querySelectorAll('.category-card');

const rulesSection = document.getElementById('rules-section');
const selectedCategoryDisplay = document.getElementById('selected-category-display');
const startQuizBtn = document.getElementById('start-quiz-btn');

const quizSection = document.getElementById('quiz-section');
const timerElement = document.getElementById('timer');
const progressBar = document.getElementById('progress-bar');
const questionText = document.getElementById('question-text');
const optionsContainer = document.getElementById('options-container');
const nextBtn = document.getElementById('next-btn');

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

// Set up cookie functions
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
    

// Get reference to the back button
const backToCategoriesBtn = document.getElementById('back-to-categories-btn');

// Add event listener for back button
backToCategoriesBtn.addEventListener('click', function() {
    rulesSection.classList.add('hidden');
    welcomeSection.classList.remove('hidden');
});

    // Handle category selection
    categoryCards.forEach(card => {
        card.addEventListener('click', selectCategory);
    });
    
    // Handle start quiz button
    startQuizBtn.addEventListener('click', startQuiz);
    
    // Handle next question button
    nextBtn.addEventListener('click', goToNextQuestion);
    
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
}

// Convert input to uppercase as the user types
nameInput.addEventListener("input", function() {
    this.value = this.value.toUpperCase();
});

// Show welcome screen
function showWelcomeScreen() {
    nameModal.classList.add('hidden');
    welcomeSection.classList.remove('hidden');
    userNameDisplay.textContent = currentUser.name;
}

// Select category
function selectCategory(e) {
    const category = e.target.getAttribute('data-category');
    currentUser.category = category;
    console.log(`Category selected: ${category}`);
    
    // Load questions for this category
    loadCategoryQuestions(category)
        .then(() => {
            // Show rules screen
            welcomeSection.classList.add('hidden');
            rulesSection.classList.remove('hidden');
            selectedCategoryDisplay.textContent = e.target.textContent;
            console.log(`Category loaded successfully: ${category}`);
        })
        .catch(error => {
            console.error(`Error loading category:`, error);
            alert('Failed to load questions. Please try again.');
        });
}

// Generate random question indices
function generateRandomQuestions() {
    const category = currentUser.category;
    
    // Safety check - make sure questions exist
    if (!window.quizQuestions || !window.quizQuestions[category]) {
        console.error(`Questions for ${category} not found!`);
        alert(`Error: Questions for ${category} could not be loaded. Please try another category.`);
        return [];
    }
    
    const totalQuestions = window.quizQuestions[category].length;
    console.log(`Generating random questions from ${totalQuestions} available questions`);
    
    const randomQuestions = [];
    
    // If we have fewer than 20 questions available, use all of them
    if (totalQuestions <= 20) {
        for (let i = 0; i < totalQuestions; i++) {
            randomQuestions.push(i);
        }
    } else {
        // Generate 20 unique random indices
        while (randomQuestions.length < 20) {
            const randomIndex = Math.floor(Math.random() * totalQuestions);
            if (!randomQuestions.includes(randomIndex)) {
                randomQuestions.push(randomIndex);
            }
        }
    }
    
    console.log(`Generated ${randomQuestions.length} random question indices`);
    return randomQuestions;
}

// Start quiz
function startQuiz() {
    console.log('Starting quiz...');
    
    // Make sure questions are loaded before starting the quiz
    loadCategoryQuestions(currentUser.category)
        .then(() => {
            rulesSection.classList.add('hidden');
            quizSection.classList.remove('hidden');
            
            // Generate random questions for this session
            currentUser.randomQuestions = generateRandomQuestions();
            
            if (currentUser.randomQuestions.length === 0) {
                console.error('No questions available!');
                alert('Error: No questions available for this category. Please try another category.');
                resetQuiz();
                return;
            }
            
            // Set up first question
            loadQuestion();
            startTimer();
            
            // Save user data to cookies
            setCookie('quizUser', JSON.stringify(currentUser), 7);
        })
        .catch(error => {
            console.error('Failed to start quiz:', error);
            alert('Failed to load questions. Please try again.');
        });
}

// Load question
function loadQuestion() {
    const category = currentUser.category;
    const questionIndex = currentUser.currentQuestion;
    
    console.log(`Loading question ${questionIndex + 1} for category ${category}`);
    
    // Safety checks
    if (!window.quizQuestions || !window.quizQuestions[category]) {
        console.error(`Questions for ${category} not found when loading question!`);
        alert('Error loading questions. Please try again.');
        resetQuiz();
        return;
    }
    
    if (questionIndex >= currentUser.randomQuestions.length) {
        console.error(`Question index ${questionIndex} is out of bounds!`);
        endQuiz();
        return;
    }
    
    // Get the random question index from our array
    const randomIndex = currentUser.randomQuestions[questionIndex];
    
    if (randomIndex === undefined || !window.quizQuestions[category][randomIndex]) {
        console.error(`Question at index ${randomIndex} not found!`);
        alert('Error loading question. Please try again.');
        resetQuiz();
        return;
    }
    
    const question = window.quizQuestions[category][randomIndex];
    
    // Update question text
    questionText.textContent = `${questionIndex + 1}. ${question.question}`;
    
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
            }
            goToNextQuestion();
        }
    }, 1000);
}

// Update timer display
function updateTimerDisplay() {
    timerElement.textContent = timeLeft;
}

// Go to next question
function goToNextQuestion() {
    clearInterval(timer);
    
    // Safety checks
    const category = currentUser.category;
    if (!window.quizQuestions || !window.quizQuestions[category]) {
        console.error('Questions not found when checking answer!');
        alert('Error checking answer. Please try again.');
        resetQuiz();
        return;
    }
    
    // Check if answer is correct and update score
    const questionIndex = currentUser.currentQuestion;
    
    // Get the random question index from our array
    if (questionIndex >= currentUser.randomQuestions.length) {
        console.error(`Question index ${questionIndex} is out of bounds!`);
        endQuiz();
        return;
    }
    
    const randomIndex = currentUser.randomQuestions[questionIndex];
    
    if (randomIndex === undefined || !window.quizQuestions[category][randomIndex]) {
        console.error(`Question at index ${randomIndex} not found!`);
        alert('Error checking answer. Please try again.');
        resetQuiz();
        return;
    }
    
    const question = window.quizQuestions[category][randomIndex];
    const selectedAnswer = currentUser.selectedAnswers[questionIndex];
    
    console.log(`Checking answer for question ${questionIndex + 1}: selected=${selectedAnswer}, correct=${question.correctAnswer}`);
    
    if (selectedAnswer === question.correctAnswer) {
        currentUser.score += 5; // Each question is worth 5 marks
    }
    
    // Move to next question or end quiz
    currentUser.currentQuestion++;
    if (currentUser.currentQuestion >= 20 || currentUser.currentQuestion >= currentUser.randomQuestions.length) {
        endQuiz();
    } else {
        loadQuestion();
        startTimer();
    }
    
    // Save user data to cookies
    setCookie('quizUser', JSON.stringify(currentUser), 7);
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

    // Display user name and category
    const userNameDisplay = document.getElementById('user-name-result');
    const categoryDisplay = document.getElementById('category-result');
    const dateDisplay = document.getElementById('date-result'); // For date
    const timeDisplay = document.getElementById('time-result'); // For time

    if (userNameDisplay) {
        userNameDisplay.textContent = `Name: ${currentUser.name}`;
    }
    if (categoryDisplay) {
        categoryDisplay.textContent = `Category: ${currentUser.category.toUpperCase()}`; // Convert category to uppercase
    }

    // Get current date and time
    const now = new Date();
    const formattedDate = now.toLocaleDateString(); // Format: MM/DD/YYYY
    const formattedTime = now.toLocaleTimeString(); // Format: HH:MM AM/PM

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
    
    resultSection.classList.add('hidden');
    welcomeSection.classList.remove('hidden');
    
    // Save user data to cookies
    setCookie('quizUser', JSON.stringify(currentUser), 7);
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
