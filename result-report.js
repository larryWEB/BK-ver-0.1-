// Result Report Handler for BRAINKASH Quiz
// This handles generating and downloading results in PDF and DOC formats

// Array of inspiring messages to display randomly
const inspiringMessages = [
    "Success is not final, failure is not fatal: It is the courage to continue that counts.",
    "Believe in yourself and all that you are. Know that there is something inside you that is greater than any obstacle.",
    "The only way to do great work is to love what you do.",
    "Your attitude, not your aptitude, will determine your altitude.",
    "Don't watch the clock; do what it does. Keep going.",
    "The future belongs to those who believe in the beauty of their dreams.",
    "You are never too old to set another goal or to dream a new dream.",
    "Challenges are what make life interesting and overcoming them is what makes life meaningful.",
    "The only person you are destined to become is the person you decide to be.",
    "It always seems impossible until it's done.",
    "The best time to plant a tree was 20 years ago. The second best time is now.",
    "The mind is everything. What you think you become.",
    "Education is the most powerful weapon which you can use to change the world.",
    "The only limit to our realization of tomorrow is our doubts of today.",
    "Knowledge is power. Information is liberating. Education is the premise of progress."
];

// Function to get a random inspiring message
function getRandomInspiringMessage() {
    const randomIndex = Math.floor(Math.random() * inspiringMessages.length);
    return inspiringMessages[randomIndex];
}

// Function to calculate category-wise scores
function calculateCategoryScores() {
    const categoryScores = {};
    const categoryTotals = {};
    
    // Initialize scores for all categories in current user's categories
    for (const category in currentUser.categories) {
        categoryScores[category] = 0;
        categoryTotals[category] = currentUser.categories[category];
    }
    
    // Calculate score for each category
    currentUser.randomQuestions.forEach((questionInfo, index) => {
        const category = questionInfo.category;
        const selectedAnswer = currentUser.selectedAnswers[index];
        
        if (!categoryScores.hasOwnProperty(category)) {
            categoryScores[category] = 0;
        }
        
        // Get question from window.quizQuestions
        const question = window.quizQuestions[category][questionInfo.index];
        
        // Check if answer is correct
        if (selectedAnswer === question.correctAnswer) {
            categoryScores[category] += 5; // Each question is worth 5 points
        }
    });
    
    return { categoryScores, categoryTotals };
}

// Function to generate the HTML content for the result report
function generateResultReportHTML() {
    // Calculate scores by category
    const { categoryScores, categoryTotals } = calculateCategoryScores();
    
    // Get current date and time
    const now = new Date();
    const formattedDate = now.toLocaleDateString();
    const formattedTime = now.toLocaleTimeString();
    
    // Get total score and total possible
    let totalScore = 0;
    let totalPossible = 0;
    
    for (const category in categoryScores) {
        totalScore += categoryScores[category];
        // Calculate total possible for this category
        const possibleForCategory = categoryTotals[category] * 5; // 5 points per question
        totalPossible += possibleForCategory;
    }
    
    // Get a random inspiring message
    const inspiringMessage = getRandomInspiringMessage();
    
    // Create the HTML content
    const html = `
        <div class="result-report">
            <h1>BRAINKASH Quiz Results</h1>
            
            <div class="user-info">
                <p><strong>Name:</strong> ${currentUser.name}</p>
                <p><strong>Date:</strong> ${formattedDate}</p>
                <p><strong>Time:</strong> ${formattedTime}</p>
            </div>
            
            <table class="result-table">
                <thead>
                    <tr>
                        <th>Category</th>
                        <th>Score</th>
                        <th>Out of</th>
                        <th>Percentage</th>
                    </tr>
                </thead>
                <tbody>
                    ${Object.keys(categoryScores).map(category => {
                        const score = categoryScores[category];
                        const possibleScore = categoryTotals[category] * 5; // 5 points per question
                        const percentage = possibleScore > 0 ? Math.round((score / possibleScore) * 100) : 0;
                        
                        return `
                            <tr>
                                <td>${category.charAt(0).toUpperCase() + category.slice(1)}</td>
                                <td>${score}</td>
                                <td>${possibleScore}</td>
                                <td>${percentage}%</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
                <tfoot>
                    <tr>
                        <th>Total</th>
                        <th>${totalScore}</th>
                        <th>${totalPossible}</th>
                        <th>${Math.round((totalScore / totalPossible) * 100)}%</th>
                    </tr>
                </tfoot>
            </table>
            
            <div class="inspiring-message">
                <p><em>"${inspiringMessage}"</em></p>
            <p class="signature">BRODA OLA<br>CEO, BRAINKASH INC</p>
            </div>
        </div>
    `;
    
    return html;
}

// Function to generate the PDF
function generatePDF() {
    // Check if html2pdf is already loaded
    if (typeof html2pdf === 'undefined') {
        alert("PDF generation library is loading. Please try again in a few seconds.");
        return;
    }
    
    // Create a container for the report with proper styling
    const reportContainer = document.createElement('div');
    reportContainer.innerHTML = generateResultReportHTML();
    reportContainer.style.padding = '20px';
    reportContainer.style.backgroundColor = 'white';
    document.body.appendChild(reportContainer);
    
    // Apply styling for PDF
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        .result-report {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .result-report h1 {
            color: #2c3e50;
            text-align: center;
            margin-bottom: 30px;
        }
        
        .user-info {
            margin-bottom: 30px;
        }
        
        .result-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }
        
        .result-table th, .result-table td {
            border: 1px solid #ddd;
            padding: 10px;
            text-align: left;
        }
        
        .result-table th {
            background-color: #f2f2f2;
            font-weight: bold;
        }
        
        .result-table tfoot th {
            background-color: #e9e9e9;
        }
        
        .inspiring-message {
            font-style: italic;
            margin: 30px 0;
            text-align: center;
        }
        
        .signature {
            text-align: right;
            margin-top: 40px;
            font-weight: bold;
        }
    `;
    document.head.appendChild(styleElement);
    
    // Configure PDF options
    const opt = {
        margin: [10, 10],
        filename: `BRAINKASH_Results_${currentUser.name.replace(/\s+/g, '_')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    // Generate the PDF
    html2pdf().from(reportContainer).set(opt).save().then(() => {
        // Clean up
        document.body.removeChild(reportContainer);
        document.head.removeChild(styleElement);
    }).catch(error => {
        console.error("PDF generation error:", error);
        alert("Could not generate PDF. Please try again.");
        document.body.removeChild(reportContainer);
        document.head.removeChild(styleElement);
    });
}

// Function to generate and download DOC file
function generateDOC() {
    // Create the content for the DOC file
    const content = generateResultReportHTML();
    
    // Create the complete HTML document with styles
    const htmlDocument = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
            <meta charset="utf-8">
            <title>BRAINKASH Quiz Results</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    padding: 20px;
                }
                
                h1 {
                    color: #2c3e50;
                    text-align: center;
                    margin-bottom: 30px;
                }
                
                .user-info {
                    margin-bottom: 30px;
                }
                
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 30px;
                }
                
                th, td {
                    border: 1px solid #ddd;
                    padding: 10px;
                    text-align: left;
                }
                
                th {
                    background-color: #f2f2f2;
                    font-weight: bold;
                }
                
                tfoot th {
                    background-color: #e9e9e9;
                }
                
                .inspiring-message {
                    font-style: italic;
                    margin: 30px 0;
                    text-align: center;
                }
                
                .signature {
                    text-align: right;
                    margin-top: 40px;
                    font-weight: bold;
                }
            </style>
        </head>
        <body>
            ${content}
        </body>
        </html>
    `;
    
    // Convert HTML to Blob
    const blob = new Blob([htmlDocument], { type: "application/msword" });
    
    // Create download link
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `BRAINKASH_Results_${currentUser.name.replace(/\s+/g, '_')}.doc`;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Add download buttons to the result section
function addDownloadButtons() {
    // Check if buttons already exist
    if (document.getElementById('download-buttons-container')) {
        return;
    }
    
    // Get the result container
    const resultContainer = document.querySelector('.result-container');
    
    // Create the download buttons container
    const downloadButtonsContainer = document.createElement('div');
    downloadButtonsContainer.id = 'download-buttons-container';
    downloadButtonsContainer.className = 'btn-container';
    downloadButtonsContainer.style.marginTop = '20px';
    
    // Create PDF download button
    const pdfButton = document.createElement('button');
    pdfButton.id = 'download-pdf-btn';
    pdfButton.textContent = 'Download PDF';
    pdfButton.addEventListener('click', generatePDF);
    
    // Create DOC download button
    const docButton = document.createElement('button');
    docButton.id = 'download-doc-btn';
    docButton.textContent = 'Download DOC';
    docButton.addEventListener('click', generateDOC);
    
    // Add buttons to container
    downloadButtonsContainer.appendChild(pdfButton);
    downloadButtonsContainer.appendChild(docButton);
    
    // Add the container to the result section
    resultContainer.appendChild(downloadButtonsContainer);
}

// Function to show the result card directly on screen
function showResultCard() {
    // Check if card already exists
    if (document.querySelector('.result-card')) {
        return;
    }
    
    // Calculate scores by category
    const { categoryScores, categoryTotals } = calculateCategoryScores();
    
    // Get current date and time
    const now = new Date();
    const formattedDate = now.toLocaleDateString();
    const formattedTime = now.toLocaleTimeString();
    
    // Create the result card element
    const resultCard = document.createElement('div');
    resultCard.className = 'result-card';
    
    // Get a random inspiring message
    const inspiringMessage = getRandomInspiringMessage();
    
    // Get total score
    let totalScore = 0;
    let totalPossible = 0;
    
    for (const category in categoryScores) {
        totalScore += categoryScores[category];
        totalPossible += categoryTotals[category] * 5; // 5 points per question
    }
    
    // Create HTML for the result card
    resultCard.innerHTML = `
        <h3>Report Card</h3>
        <div class="user-info">
            <p><strong>Name:</strong> ${currentUser.name}</p>
            <p><strong>Date:</strong> ${formattedDate}</p>
            <p><strong>Time:</strong> ${formattedTime}</p>
        </div>
        
        <table class="result-table">
            <thead>
                <tr>
                    <th>Category</th>
                    <th>Score</th>
                    <th>Out of</th>
                </tr>
            </thead>
            <tbody>
                ${Object.keys(categoryScores).map(category => {
                    const score = categoryScores[category];
                    const possibleScore = categoryTotals[category] * 5; // 5 points per question
                    
                    return `
                        <tr>
                            <td>${category.charAt(0).toUpperCase() + category.slice(1)}</td>
                            <td>${score}</td>
                            <td>${possibleScore}</td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
            <tfoot>
                <tr>
                    <th>Total</th>
                    <th>${totalScore}</th>
                    <th>${totalPossible}</th>
                </tr>
            </tfoot>
        </table>
        
        <div class="inspiring-message">
            <p><em>"${inspiringMessage}"</em></p>
            <p class="signature">BRODA OLA<br>CEO, BRAINKASH INC</p>
        </div>
    `;
    
    // Find where to insert the result card
    const resultContainer = document.querySelector('.result-container');
    
    // Insert the result card before the try-again or perfect-score section
    const insertBeforeElement = document.getElementById('perfect-score-section') || document.getElementById('try-again-section');
    if (insertBeforeElement) {
        resultContainer.insertBefore(resultCard, insertBeforeElement);
    } else {
        resultContainer.appendChild(resultCard);
    }
}

// Ensure html2pdf library is loaded
function ensureLibrariesLoaded() {
    return new Promise((resolve, reject) => {
        if (typeof html2pdf !== 'undefined') {
            resolve();
            return;
        }
        
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
        script.onload = resolve;
        script.onerror = () => reject(new Error('Failed to load html2pdf library'));
        document.head.appendChild(script);
    });
}

// Modify the endQuiz function to include result card and download buttons
function enhanceEndQuiz() {
    // Check if window and endQuiz exist
    if (!window || typeof window.endQuiz !== 'function') {
        console.error('endQuiz function not found');
        return;
    }
    
    // Store the original endQuiz function if not already stored
    if (!window.originalEndQuiz) {
        window.originalEndQuiz = window.endQuiz;
    }
    
    // Override the endQuiz function
    window.endQuiz = function() {
        // Call the original function
        window.originalEndQuiz.call(this);
        
        // Load libraries first
        ensureLibrariesLoaded()
            .then(() => {
                // Show result card and add download buttons
                showResultCard();
                addDownloadButtons();
            })
            .catch(error => {
                console.error('Error setting up result functionality:', error);
                // Still show the result card even if PDF library fails to load
                showResultCard();
            });
    };
}

// Initialize the result report functionality when the page loads
document.addEventListener('DOMContentLoaded', function() {
    // Load libraries in advance
    ensureLibrariesLoaded()
        .then(() => console.log('PDF library loaded successfully'))
        .catch(error => console.error('Failed to load PDF library:', error));
    
    // Enhance the endQuiz function
    enhanceEndQuiz();
});
