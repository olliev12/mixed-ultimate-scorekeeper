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
updateCurrentRatio();

// Function to update local storage
function updateLocalStorage() {
    localStorage.setItem('homeScore', homeScore);
    localStorage.setItem('awayScore', awayScore);
    localStorage.setItem('startingRatio', startingRatio);
    localStorage.setItem('opponentName', opponentName)
    // localStorage.setItem('gameTo', gameTo);
    // localStorage.setItem('startOn', startOn);
}

opponentNameInput.addEventListener('input', () => {
    opponentName = opponentNameInput.value;
    awayTeamNameElement.textContent = opponentName;
    localStorage.setItem('opponentName', opponentName);
});


// Event listeners for score buttons
homePlusButton.addEventListener('click', () => {
    homeScore++;
    homeScoreElement.textContent = homeScore;
    updateCurrentRatio();
    updateLocalStorage();
});

homeMinusButton.addEventListener('click', () => {
    if (homeScore > 0) {
        homeScore--;
        homeScoreElement.textContent = homeScore;
        updateCurrentRatio();
        updateLocalStorage();
    }
});

awayPlusButton.addEventListener('click', () => {
    awayScore++;
    awayScoreElement.textContent = awayScore;
    updateCurrentRatio();
    updateLocalStorage();
});

awayMinusButton.addEventListener('click', () => {
    if (awayScore > 0) {
        awayScore--;
        awayScoreElement.textContent = awayScore;
        updateCurrentRatio();
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
    updateCurrentRatio();
    updateLocalStorage();
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

// Initial call to set the current ratio on page load
// updateCurrentRatio();
