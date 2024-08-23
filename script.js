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
const nextRatioElement = document.getElementById('nextRatio');
const currentPossessionElement = document.getElementById('currentPossession');

const opponentNameInput = document.getElementById('opponentName');
const awayTeamNameElement = document.getElementById('awayTeamName');


const startingRatioInputs = document.querySelectorAll('input[name="startingRatio"]');
const gameToInput = document.getElementById('gameTo');
const startOnInputs = document.querySelectorAll('input[name="startOn"]');

const undoLastButton = document.getElementById('undoLast');

const currentLineInputs = document.querySelectorAll('input[name="currentLine"]');
const lineOCountElement = document.getElementById('lineOCount');
const lineDCountElement = document.getElementById('lineDCount');
const lineXCountElement = document.getElementById('lineXCount');
const lineKCountElement = document.getElementById('lineKCount');

const lastEventLineElement = document.getElementById('lastEventLine');
const lastEventRatioElement = document.getElementById('lastEventRatio');
const lastEventPossessionElement = document.getElementById('lastEventPossession');
const lastEventScoreElement = document.getElementById('lastEventScore');

const currentPossessionInputs = document.querySelectorAll('input[name="currentPossession"]');

// Initialize scores from local storage or set to 0 if not present
let homeScore = localStorage.getItem('homeScore') ? parseInt(localStorage.getItem('homeScore')) : 0;
let awayScore = localStorage.getItem('awayScore') ? parseInt(localStorage.getItem('awayScore')) : 0;

// Initialize settings from local storage or set default values
let startingRatio = localStorage.getItem('startingRatio') || 'M';
let opponentName = localStorage.getItem('opponentName') || 'Away Team';
let gameTo = localStorage.getItem('gameTo') || 13;
let startOn = localStorage.getItem('startOn') || 'O';


// Set initial values for settings inputs
document.querySelector(`input[name="startingRatio"][value="${startingRatio}"]`).checked = true;
gameToInput.value = gameTo;
document.querySelector(`input[name="startOn"][value="${startOn}"]`).checked = true;

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
let events = JSON.parse(localStorage.getItem('events')) || [];
let gameIndex;
let ratio;
let possession;

updateCurrentStatus();

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

// document.getElementById('loadGame').addEventListener('click', () => {
//     if (games.length === 0) {
//         alert("No saved games to load.");
//         return;
//     }
//     if (!gameIndex) {
//         alert("Select a game to load.");
//     }
//     else {
//         // const gameIndex = prompt("Enter the index of the game to load (starting from 1):");
//         const selectedGame = games[gameIndex - 1];

//         if (selectedGame) {
//             // Load the game state
//             loadGame(selectedGame)
//         } else {
//             alert("Invalid game selection.");
//         }
//     }
// });

document.getElementById('importGames').addEventListener('change', (event) => {
    const file = event.target.files[0];
    console.log(file.type)
    if (file && file.type === 'application/json') {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const importedGames = JSON.parse(e.target.result);
                if (Array.isArray(importedGames)) {
                    games = importedGames; // Update the games array
                    localStorage.setItem('games', JSON.stringify(games)); // Sync with localStorage
                    renderGamesList(); // Update the UI with the imported games
                    alert('Games imported successfully!');
                } else {
                    alert('Invalid file format.');
                }
            } catch (error) {
                alert('Error parsing the file.');
            }
        };
        reader.readAsText(file);
    } else {
        alert('Please upload a valid JSON file.');
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

gameToInput.addEventListener('input', () => {
    gameTo = gameToInput.value;
    updateLocalStorage();
});

startOnInputs.forEach(input => {
    input.addEventListener('change', () => {
        startOn = document.querySelector('input[name="startOn"]:checked').value;
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

    minusScore(lastEvent);
});

// Event listeners for score buttons
homePlusButton.addEventListener('click', () => {
    increaseScore('home');
});

awayPlusButton.addEventListener('click', () => {
    increaseScore('away');
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

document.getElementById('exportGames').addEventListener('click', () => {
    const gamesData = JSON.stringify(games, null, 2); // Convert games array to JSON
    const blob = new Blob([gamesData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'games.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});


// Function to update local storage
function updateLocalStorage() {
    localStorage.setItem('homeScore', homeScore);
    localStorage.setItem('awayScore', awayScore);
    localStorage.setItem('startingRatio', startingRatio);
    localStorage.setItem('gameTo', gameTo);
    localStorage.setItem('startOn', startOn);
    localStorage.setItem('opponentName', opponentName);
    localStorage.setItem('lineOCount', lineOCount);
    localStorage.setItem('lineDCount', lineDCount);
    localStorage.setItem('lineXCount', lineXCount);
    localStorage.setItem('lineKCount', lineKCount);
    localStorage.setItem('scoreLines', JSON.stringify(scoreLines));
    localStorage.setItem('scoreEvents', JSON.stringify(scoreEvents));
    localStorage.setItem('events', JSON.stringify(events));
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
        startingRatio,
        gameTo, 
        startOn
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

function updateCurrentStatus() {
    updateCurrentRatio();
    // updateCurrentPossession();
    renderGamesList();
    updateLastEvent(getLastEvent());
}

// Function to calculate and update current ratio
function updateCurrentRatio() {
    const totalPoints = homeScore + awayScore;
    const ratioPattern = startingRatio === 'M' ? ['M', 'W', 'W', 'M'] : ['W', 'M', 'M', 'W'];
    const currentRatio = ratioPattern[totalPoints % 4];
    const nextRatio = ratioPattern[(totalPoints + 1) % 4];
    currentRatioElement.textContent = `Current Ratio: ${currentRatio}`;
    nextRatioElement.textContent = `Next Ratio: ${nextRatio}`;
    ratio = currentRatio;
    updateCurrentPossession();
    return currentRatio;
}

function updateCurrentPossession() {
    let nextPossession = startOn;
    
    const halftime = (gameTo+1)/2;
    const isHalftime = ((homeScore === halftime) && awayScore < halftime) || ((awayScore === halftime) && homeScore < halftime);
    currentPossessionInputs.forEach(input => input.checked = false);
    if (scoreEvents.length > 0) {
        if (isHalftime) {
            nextPossession = nextPossession === 'O' ? 'D' : 'O';
        }
        else {
            const lastEvent = scoreEvents[scoreEvents.length-1];
            nextPossession = lastEvent === 'home' ? 'D' : 'O'
        }
    }
    currentPossessionElement.textContent = `We Are On: ${nextPossession}`
    let possessionId = `possession${nextPossession}`;
    document.querySelector(`input[name="currentPossession"][id="${possessionId}"]`).checked = true;
    possession = nextPossession;
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

function increaseScore(team) {
    const selectedLine = getSelectedLine();
    if (!selectedLine) return;

    const event = {
        line: selectedLine,
        ratio: ratio,
        possession: possession,
        score: team
    }
    events.push(event)
    updateLastEvent(event)

    switch (team) {
        case 'home':
            homeScore++;
            homeScoreElement.textContent = homeScore;
            scoreEvents.push('home');
            updateCurrentRatio();
            incrementLineCounter(selectedLine);
            updateLocalStorage();
            clearLineSelection();
            break;
        case 'away':
            awayScore++;
            awayScoreElement.textContent = awayScore;
            scoreEvents.push('away');
            updateCurrentRatio();
            incrementLineCounter(selectedLine);
            updateLocalStorage();
            clearLineSelection();
            break;
        default:
            break;
    }

}

function minusScore(team) {
    let event = events.pop();
    switch (team) {
        case 'home':
            if (homeScore > 0) {
                homeScore--;
                homeScoreElement.textContent = homeScore;
                updateCurrentRatio();
                decrementLastLineCounter();
                updateLocalStorage();
            }
            break;
        case 'away':
            if (awayScore > 0) {
                awayScore--;
                awayScoreElement.textContent = awayScore;
                updateCurrentRatio();
                decrementLastLineCounter();
                updateLocalStorage();
            }
            break;
        default:
            break;
    }
    updateLastEvent(getLastEvent());
}

function updateLastEvent(event) {
    lastEventLineElement.textContent = event.line;
    lastEventRatioElement.textContent = event.ratio;
    lastEventPossessionElement.textContent = event.possession;
    lastEventScoreElement.textContent = event.score === 'home' ? 'Star' : 'Bad';
}

function getLastEvent() {
    return events.length > 0 ?
        events[events.length-1] :
        {
            line: 'X',
            ratio: 'X',
            possession: 'X',
            score: 'X'
        }
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
        gameTo, 
        startOn,
        timestamp: new Date().toISOString(),
        ratioHistory: calculateRatioHistory()
    };
    games.push(game)
    localStorage.setItem('games', JSON.stringify(games));
}

function calculateRatioHistory() {
    let ratioHistory = [];
    const ratioPattern = startingRatio === 'M' ? ['M', 'W', 'W', 'M'] : ['W', 'M', 'M', 'W'];
    for (let i = 0; i < (homeScore+awayScore); i++) {
        // Determine the ratio for the current point based on the ratioPattern and index
        ratioHistory.push(ratioPattern[i % 4]);
    }
    // ratioHistory.push(startingRatio)
    return ratioHistory;
}

function renderGamesList() {
    const gamesList = document.getElementById('gamesList');
    gamesList.innerHTML = ''; // Clear existing list
    const totals = makeStatsObj();

    const gamesSummary = document.createElement('div');
    gamesSummary.className = 'gameItem';
    gamesSummary.textContent = 'Totals';
    gamesList.appendChild(gamesSummary);

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

        let stats = getMatches(game.scoreLines, game.scoreEvents, game.ratioHistory)
        // game['stats'] = stats;
        Object.keys(totals).forEach((key) => {
            Object.keys(totals[key]).forEach((stat) => {
                totals[key][stat] += stats[key][stat];
            });
        });

        const lineCountItems = `
            <p>Line <br> Points <br> Scored <br> W <br> M </p>
            <p>O <br> ${stats.O.points} <br> ${stats.O.scores} <br> ${stats.O.W} <br> ${stats.O.M}</p>
            <p>D <br> ${stats.D.points} <br> ${stats.D.scores} <br> ${stats.D.W} <br> ${stats.D.M}</p>
            <p>X <br> ${stats.X.points} <br> ${stats.X.scores} <br> ${stats.X.W} <br> ${stats.X.M}</p>
            <p>K <br> ${stats.K.points} <br> ${stats.K.scores} <br> ${stats.K.W} <br> ${stats.K.M}</p>
        `;
        lineCounts.innerHTML = lineCountItems;
        gameItem.appendChild(lineCounts)


        const events = document.createElement('div');
        const eventStuff = `
            <p>Lines: <span>${game.scoreLines.toString()}</span></p>
            <p>Scores: <span>${(game.scoreEvents.map((event) => event === 'home' ? 'W' : 'L')).toString()}</span></p>
            <p>Ratio: <span>${game.ratioHistory.toString()}</span></p>`;
        events.innerHTML = eventStuff;
        gameItem.appendChild(events)
        gamesList.appendChild(gameItem);
    });
    
    const lineCounts = document.createElement('div');
    lineCounts.className = 'lineCounters';
    const lineCountItems = `
        <p>Line <br> Points <br> Scored <br> W <br> M </p>
        <p>O <br> ${totals.O.points} <br> ${totals.O.scores} <br> ${totals.O.W} <br> ${totals.O.M}</p>
        <p>D <br> ${totals.D.points} <br> ${totals.D.scores} <br> ${totals.D.W} <br> ${totals.D.M}</p>
        <p>X <br> ${totals.X.points} <br> ${totals.X.scores} <br> ${totals.X.W} <br> ${totals.X.M}</p>
        <p>K <br> ${totals.K.points} <br> ${totals.K.scores} <br> ${totals.K.W} <br> ${totals.K.M}</p>
    `;
    lineCounts.innerHTML = lineCountItems;

    gamesList.childNodes[0].appendChild(lineCounts);

    // const gamesJson = document.getElementById('gamesJson');
    // gamesJson.innerHTML = JSON.stringify(games) + '<br><br>' + JSON.stringify(totals);
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

function getMatches(lines, events, history) {
    const matches = makeStatsObj();

    for (let x=0; x < lines.length; x++) {
        let line = lines[x];
        let score = events[x] === 'home' ? 1 : 0;
        let W = history[x] === 'W' ? 1 : 0;
        let M = history[x] === 'M' ? 1 : 0;
        matches[line].points ++;
        matches[line].scores += score;
        matches[line].W += W;
        matches[line].M += M;
    }

    return matches;
}

function makeStatsObj() {
    return  {
        O: {
            points: 0,
            scores: 0,
            W: 0,
            M: 0
        },
        D: {
            points: 0,
            scores: 0,
            W: 0,
            M: 0
        },
        X: {
            points: 0,
            scores: 0,
            W: 0,
            M: 0
        },
        K: {
            points: 0,
            scores: 0,
            W: 0,
            M: 0
        }
    };
}