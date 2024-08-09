// Get references to HTML elements
const homeScoreElement = document.getElementById('homeScore');
const awayScoreElement = document.getElementById('awayScore');
const homePlusButton = document.getElementById('homePlus');
const homeMinusButton = document.getElementById('homeMinus');
const awayPlusButton = document.getElementById('awayPlus');
const awayMinusButton = document.getElementById('awayMinus');
const newGameButton = document.getElementById('newGameButton');
const hamburgerButton = document.getElementById('hamburgerButton');
const settingsDiv = document.getElementById('settings');
const currentRatioElement = document.getElementById('currentRatio');

const opponentNameInput = document.getElementById('opponentName');
const awayTeamNameElement = document.getElementById('awayTeamName');


const startingRatioInputs = document.querySelectorAll('input[name="startingRatio"]');
// const gameToInput = document.getElementById('gameTo');
// const startOnInputs = document.querySelectorAll('input[name="startOn"]');

const undoLastButton = document.getElementById('undoLast');

const currentLineInputs = document.querySelectorAll('input[name="currentLine"]');
const lineOCountElement = document.getElementById('lineOCount');
const lineDCountElement = document.getElementById('lineDCount');
const lineXCountElement = document.getElementById('lineXCount');
const lineKCountElement = document.getElementById('lineKCount');


// Initialize scores from local storage or set to 0 if not present
let homeScore = localStorage.getItem('homeScore') ? parseInt(localStorage.getItem('homeScore')) : 0;
let awayScore = localStorage.getItem('awayScore') ? parseInt(localStorage.getItem('awayScore')) : 0;

// Initialize settings from local storage or set default values
let startingRatio = localStorage.getItem('startingRatio') || 'M';
// let gameTo = localStorage.getItem('gameTo') || 13;
// let startOn = localStorage.getItem('startOn') || 'O';
let opponentName = localStorage.getItem('opponentName') || 'Away Team';


// Set initial values for settings inputs
document.querySelector(`input[name="startingRatio"][value="${startingRatio}"]`).checked = true;
// gameToInput.value = gameTo;
// document.querySelector(`input[name="startOn"][value="${startOn}"]`).checked = true;

// Update score elements with initial values
homeScoreElement.textContent = homeScore;
awayScoreElement.textContent = awayScore;
opponentNameInput.value = opponentName;
awayTeamNameElement.textContent = opponentName;

let lineOCount = localStorage.getItem('lineOCount') ? parseInt(localStorage.getItem('lineOCount')) : 0;
let lineDCount = localStorage.getItem('lineDCount') ? parseInt(localStorage.getItem('lineDCount')) : 0;
let lineXCount = localStorage.getItem('lineXCount') ? parseInt(localStorage.getItem('lineXCount')) : 0;
let lineKCount = localStorage.getItem('lineKCount') ? parseInt(localStorage.getItem('lineKCount')) : 0;

lineOCountElement.textContent = lineOCount;
lineDCountElement.textContent = lineDCount;
lineXCountElement.textContent = lineXCount;
lineKCountElement.textContent = lineKCount;

let scoreLines = JSON.parse(localStorage.getItem('scoreLines')) || [];
let scoreEvents = JSON.parse(localStorage.getItem('scoreEvents')) || [];

updateCurrentRatio();

// Function to update local storage
function updateLocalStorage() {
    localStorage.setItem('homeScore', homeScore);
    localStorage.setItem('awayScore', awayScore);
    localStorage.setItem('startingRatio', startingRatio);
    localStorage.setItem('opponentName', opponentName);
    // localStorage.setItem('gameTo', gameTo);
    // localStorage.setItem('startOn', startOn);
    localStorage.setItem('lineOCount', lineOCount);
    localStorage.setItem('lineDCount', lineDCount);
    localStorage.setItem('lineXCount', lineXCount);
    localStorage.setItem('lineKCount', lineKCount);
    localStorage.setItem('scoreLines', JSON.stringify(scoreLines));
    localStorage.setItem('scoreEvents', JSON.stringify(scoreEvents));
}


function getSelectedLine() {
    const selectedLine = document.querySelector('input[name="currentLine"]:checked');
    if (!selectedLine) {
        alert('Please select a line before scoring.');
        return null;
    }
    return selectedLine.value;
}

function incrementLineCounter(line) {
    scoreLines.push(line);
    switch (line) {
        case 'O':
            lineOCount++;
            lineOCountElement.textContent = lineOCount;
            break;
        case 'D':
            lineDCount++;
            lineDCountElement.textContent = lineDCount;
            break;
        case 'X':
            lineXCount++;
            lineXCountElement.textContent = lineXCount;
            break;
        case 'K':
            lineKCount++;
            lineKCountElement.textContent = lineKCount;
            break;
    }
    updateLocalStorage();
}

function clearLineSelection() {
    currentLineInputs.forEach(input => input.checked = false);
}

function decrementLastLineCounter() {
    // Implement logic to determine which line was last used and decrement the corresponding counter
    // This requires keeping track of the lines used per score
    const lastLine = scoreLines.pop();
    if (!lastLine) return;
    switch (lastLine) {
        case 'O':
            lineOCount--;
            lineOCountElement.textContent = lineOCount;
            break;
        case 'D':
            lineDCount--;
            lineDCountElement.textContent = lineDCount;
            break;
        case 'X':
            lineXCount--;
            lineXCountElement.textContent = lineXCount;
            break;
        case 'K':
            lineKCount--;
            lineKCountElement.textContent = lineKCount;
            break;
    }
    updateLocalStorage();
}

opponentNameInput.addEventListener('input', () => {
    opponentName = opponentNameInput.value;
    awayTeamNameElement.textContent = opponentName;
    localStorage.setItem('opponentName', opponentName);
});


// Event listeners for score buttons
homePlusButton.addEventListener('click', () => {
    const selectedLine = getSelectedLine();
    if (!selectedLine) return;

    homeScore++;
    homeScoreElement.textContent = homeScore;
    updateCurrentRatio();
    incrementLineCounter(selectedLine);
    scoreEvents.push('home');
    updateLocalStorage();
    clearLineSelection();
});

homeMinusButton.addEventListener('click', () => {
    if (homeScore > 0) {
        homeScore--;
        homeScoreElement.textContent = homeScore;
        updateCurrentRatio();
        decrementLastLineCounter();
        updateLocalStorage();
    }
});

awayPlusButton.addEventListener('click', () => {
    const selectedLine = getSelectedLine();
    if (!selectedLine) return;

    awayScore++;
    awayScoreElement.textContent = awayScore;
    updateCurrentRatio();
    incrementLineCounter(selectedLine);
    scoreEvents.push('away');
    updateLocalStorage();
    clearLineSelection();
});

awayMinusButton.addEventListener('click', () => {
    if (awayScore > 0) {
        awayScore--;
        awayScoreElement.textContent = awayScore;
        updateCurrentRatio();
        decrementLastLineCounter();
        updateLocalStorage();
    }
});

// Event listener for new game button
newGameButton.addEventListener('click', () => {
    homeScore = 0;
    awayScore = 0;
    startingRatio = 'M'
    opponentName = "Away Team"
    homeScoreElement.textContent = homeScore;
    awayScoreElement.textContent = awayScore;
    document.querySelector(`input[name="startingRatio"][value="${startingRatio}"]`).checked = true;
    opponentNameInput.value = opponentName;
    awayTeamNameElement.textContent = opponentName;
    scoreLines = [];
    resetScoreLines();
    updateCurrentRatio();
    updateLocalStorage();
    clearLineSelection();
});

undoLastButton.addEventListener('click', () => {
    const lastEvent = scoreEvents.pop();
    if (!lastEvent) return;

    // localStorage.setItem('scoreEvents', JSON.stringify(scoreEvents));

    if (lastEvent === 'home') {
        homeMinusButton.click();
    } else if (lastEvent === 'away') {
        awayMinusButton.click();
    }
});

// Event listener for hamburger button
// hamburgerButton.addEventListener('click', () => {
//     settingsDiv.classList.toggle('visible');
// });

// Event listeners for settings inputs
startingRatioInputs.forEach(input => {
    input.addEventListener('change', () => {
        startingRatio = document.querySelector('input[name="startingRatio"]:checked').value;
        updateCurrentRatio();
        updateLocalStorage();
    });
});

// gameToInput.addEventListener('input', () => {
//     gameTo = gameToInput.value;
//     updateLocalStorage();
// });

// startOnInputs.forEach(input => {
//     input.addEventListener('change', () => {
//         startOn = document.querySelector('input[name="startOn"]:checked').value;
//         updateLocalStorage();
//     });
// });

// Function to calculate and update current ratio
function updateCurrentRatio() {
    const totalPoints = homeScore + awayScore;
    const ratioPattern = startingRatio === 'M' ? ['M', 'W', 'W', 'M'] : ['W', 'M', 'M', 'W'];
    const currentRatio = ratioPattern[totalPoints % 4];
    currentRatioElement.textContent = `Current Ratio: ${currentRatio}`;
}

function resetScoreLines() {
    lineOCount = 0;
    lineOCountElement.textContent = lineOCount;
    lineDCount = 0;
    lineDCountElement.textContent = lineDCount;
    lineXCount = 0;
    lineXCountElement.textContent = lineXCount;
    lineKCount = 0;
    lineKCountElement.textContent = lineKCount;
}

// Initial call to set the current ratio on page load
// updateCurrentRatio();
