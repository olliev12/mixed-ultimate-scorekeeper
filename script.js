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
let opponentName = localStorage.getItem('opponentName') || 'Away Team';


// Set initial values for settings inputs
document.querySelector(`input[name="startingRatio"][value="${startingRatio}"]`).checked = true;

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
let games = JSON.parse(localStorage.getItem('games')) || [];
let gameIndex;

updateCurrentRatio();
renderGamesList();

// Event listener for new game button
newGameButton.addEventListener('click', () => {
    if (homeScore + awayScore > 0) {
        let confirmation = confirm('Start new game without saving?')
        if (!confirmation) {
            return;
        }
    }
    startNewGame();
});

document.getElementById('loadGame').addEventListener('click', () => {
    if (games.length === 0) {
        alert("No saved games to load.");
        return;
    }
    if (!gameIndex) {
        alert("Select a game to load.");
    }
    else {
        // const gameIndex = prompt("Enter the index of the game to load (starting from 1):");
        const selectedGame = games[gameIndex - 1];

        if (selectedGame) {
            // Load the game state
            loadGame(selectedGame)
        } else {
            alert("Invalid game selection.");
        }
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

opponentNameInput.addEventListener('input', () => {
    opponentName = opponentNameInput.value;
    awayTeamNameElement.textContent = opponentName;
    localStorage.setItem('opponentName', opponentName);
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

document.getElementById('saveGame').addEventListener('click', () => {
    if (homeScore + awayScore > 0) {
        let confirmation = confirm('Save game?')
        if (confirmation) {
            saveGame();
            renderGamesList();
            startNewGame();
        }
    }
    else {
        alert('Nothing to save tbh')
    }
});

// Function to update local storage
function updateLocalStorage() {
    localStorage.setItem('homeScore', homeScore);
    localStorage.setItem('awayScore', awayScore);
    localStorage.setItem('startingRatio', startingRatio);
    localStorage.setItem('opponentName', opponentName);
    localStorage.setItem('lineOCount', lineOCount);
    localStorage.setItem('lineDCount', lineDCount);
    localStorage.setItem('lineXCount', lineXCount);
    localStorage.setItem('lineKCount', lineKCount);
    localStorage.setItem('scoreLines', JSON.stringify(scoreLines));
    localStorage.setItem('scoreEvents', JSON.stringify(scoreEvents));
}

function startNewGame() {
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
    scoreEvents = [];
    resetScoreLines();
    updateCurrentRatio();
    updateLocalStorage();
    clearLineSelection();
}

function loadGame(selectedGame) {
    ({
        opponentName,
        homeScore,
        awayScore,
        lineOCount,
        lineDCount,
        lineXCount,
        lineKCount,
        scoreLines,
        scoreEvents,
        startingRatio
    } = selectedGame);

    // Update UI and localStorage
    updateLocalStorage();
    updateUI();
    updateCurrentRatio();
    games.splice(gameIndex - 1, 1); // Remove the loaded game
    localStorage.setItem('games', JSON.stringify(games));
    renderGamesList();
    gameIndex = undefined;
    alert(`Game vs ${selectedGame.opponentName} loaded!`)
}

// Function to calculate and update current ratio
function updateCurrentRatio() {
    const totalPoints = homeScore + awayScore;
    const ratioPattern = startingRatio === 'M' ? ['M', 'W', 'W', 'M'] : ['W', 'M', 'M', 'W'];
    const currentRatio = ratioPattern[totalPoints % 4];
    currentRatioElement.textContent = `Current Ratio: ${currentRatio}`;
    return currentRatio;
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

function saveGame() {
    let game = {
        opponentName,
        homeScore,
        awayScore,
        lineOCount,
        lineDCount,
        lineXCount,
        lineKCount,
        scoreLines,
        scoreEvents,
        startingRatio,
        timestamp: new Date().toISOString(),
        ratioHistory: calculateRatioHistory()
    };
    games.push(game)
    localStorage.setItem('games', JSON.stringify(games));
}

function calculateRatioHistory() {
    let ratioHistory = [];
    const ratioPattern = startingRatio === 'M' ? ['M', 'W', 'W', 'M'] : ['W', 'M', 'M', 'W'];
    console.log(scoreEvents)
    for (let i = 0; i < (homeScore+awayScore); i++) {
        // Determine the ratio for the current point based on the ratioPattern and index
        ratioHistory.push(ratioPattern[i % 4]);
        console.log(ratioHistory)
    }
    // ratioHistory.push(startingRatio)
    return ratioHistory;
}

function renderGamesList() {
    const gamesList = document.getElementById('gamesList');
    gamesList.innerHTML = ''; // Clear existing list

    games.forEach((game, index) => {
        const gameItem = document.createElement('div');
        gameItem.className = 'gameItem';
        gameItem.textContent = `Game ${index + 1} - Starfire: ${game.homeScore}, ${game.opponentName}: ${game.awayScore} (Saved on: ${new Date(game.timestamp).toLocaleString()})`;
        gameItem.addEventListener('click', () => {
            // Optionally handle game item clicks
            if (homeScore+awayScore > 0) {
                alert('Please save current game before selecting a completed game.')
            }
            else {
                gameIndex = (index+1);
                const confirmation = confirm(`Game ${index + 1} vs ${game.opponentName} selected. Load?`);
                if(confirmation) {
                    loadGame(game)
                }
                // gameItem.classList.add('gameItemSelected')
            }
        });
        const lineCounts = document.createElement('div');
        
        lineCounts.className = 'lineCounters';
        const lineCountItems = `
            <p>O: <span>${game.lineOCount}</span></p>
            <p>D: <span>${game.lineDCount}</span></p>
            <p>X: <span>${game.lineXCount}</span></p>
            <p>K: <span>${game.lineKCount}</span></p>
        `;
        lineCounts.innerHTML = lineCountItems;
        gameItem.appendChild(lineCounts)


        const events = document.createElement('div');
        const eventStuff = `
            <p>Lines: <span>${game.scoreLines.toString()}</span></p>
            <br>
            <p>Scores: <span>${game.scoreEvents.toString()}</span></p>
            <br>
            <p>Ratio: <span>${game.ratioHistory.toString()}</span></p>`;
        events.innerHTML = eventStuff;
        gameItem.appendChild(events)
        gamesList.appendChild(gameItem);
    });
}

function updateUI() {
    // Update UI elements like scores, ratios, etc.
    homeScoreElement.textContent = homeScore;
    awayScoreElement.textContent = awayScore;

    lineOCountElement.textContent = lineOCount;
    lineDCountElement.textContent = lineDCount;
    lineXCountElement.textContent = lineXCount;
    lineKCountElement.textContent = lineKCount;

    opponentNameInput.value = opponentName;
    awayTeamNameElement.textContent = opponentName;

    document.querySelector(`input[name="startingRatio"][value="${startingRatio}"]`).checked = true;
}
