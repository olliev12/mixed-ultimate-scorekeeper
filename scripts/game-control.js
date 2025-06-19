// scripts/game-control.js

// Global state variables for the current game
let tournamentId = null;
let currentGameId = null; // To identify if we are editing an existing game

let homeScore = 0;
let awayScore = 0;
let startingRatio = 'M';
let opponentName = 'Away Team';
let gameTo = 15;
let startOn = 'O';
let events = [];

let lineOCount = 0;
let lineDCount = 0;
let lineXCount = 0;
let lineKCount = 0;

let currentRatio; // Calculated
let nextRatio;    // Calculated
let possession;   // Calculated

let currentPointPlayers = []; // Array to store player objects selected for the current point

// DOM Element References
let homeScoreElement, awayScoreElement, homePlusButton, awayPlusButton,
    currentRatioElement, nextRatioElement, currentPossessionElement,
    opponentNameInput, awayTeamNameElement, startingRatioInputs, gameToInput,
    startOnInputs, undoLastButton, currentLineInputs, lineOCountElement,
    lineDCountElement, lineXCountElement, lineKCountElement,
    selectedPlayersListElement, // For displaying selected players on main page
    playerSelectionModal, closePlayerModalBtn, modalSelectedLineElement,
    modalRequiredRatioInfoElement, modalPlayerCountElement,
    modalSelectedMCountElement, modalSelectedWCountElement,
    playerListContainerElement, confirmPlayersBtn,
    lastPointEventElement, lastEventLineElement, lastEventRatioElement,
    lastEventPossessionElement, lastEventScoreElement,
    currentPossessionInputs, saveGameButton, gameTitleElement;

// Constants
const LINE_TYPES = { OFFENSE: 'O', DEFENSE: 'D', EXTRA: 'X', KILL: 'K' };
const RATIO_TYPES = { MALE: 'M', FEMALE: 'W' };
const POSSESSION_TYPES = { OFFENSE: 'O', DEFENSE: 'D' };

/**
 * Initializes the game control page.
 * Fetches DOM elements, parses URL parameters, loads game data or sets up a new game,
 * updates the UI, and attaches event listeners.
 */
document.addEventListener('DOMContentLoaded', async () => {
    // Get DOM elements
    homeScoreElement = document.getElementById('homeScore');
    awayScoreElement = document.getElementById('awayScore');
    homePlusButton = document.getElementById('homePlus');
    awayPlusButton = document.getElementById('awayPlus');
    currentRatioElement = document.getElementById('currentRatio');
    nextRatioElement = document.getElementById('nextRatio');
    currentPossessionElement = document.getElementById('currentPossession');
    opponentNameInput = document.getElementById('opponentName');
    awayTeamNameElement = document.getElementById('awayTeamName');
    startingRatioInputs = document.querySelectorAll('input[name="startingRatio"]');
    gameToInput = document.getElementById('gameTo');
    startOnInputs = document.querySelectorAll('input[name="startOn"]');
    undoLastButton = document.getElementById('undoLast');
    currentLineInputs = document.querySelectorAll('input[name="currentLine"]');
    lineOCountElement = document.getElementById('lineOCount');
    lineDCountElement = document.getElementById('lineDCount');
    lineXCountElement = document.getElementById('lineXCount');
    lineKCountElement = document.getElementById('lineKCount');
    lastPointEventElement = document.getElementById('lastEventPoint');
    lastEventLineElement = document.getElementById('lastEventLine');
    lastEventRatioElement = document.getElementById('lastEventRatio');
    lastEventPossessionElement = document.getElementById('lastEventPossession');
    lastEventScoreElement = document.getElementById('lastEventScore');
    currentPossessionInputs = document.querySelectorAll('input[name="currentPossession"]');
    saveGameButton = document.getElementById('saveGameButton');
    gameTitleElement = document.getElementById('gameTitle');
    selectedPlayersListElement = document.getElementById('selectedPlayersList');
    playerSelectionModal = document.getElementById('playerSelectionModal');
    closePlayerModalBtn = document.getElementById('closePlayerModalBtn');
    modalSelectedLineElement = document.getElementById('modalSelectedLine');
    modalRequiredRatioInfoElement = document.getElementById('modalRequiredRatioInfo');
    modalPlayerCountElement = document.getElementById('modalPlayerCount');
    modalSelectedMCountElement = document.getElementById('modalSelectedMCount');
    modalSelectedWCountElement = document.getElementById('modalSelectedWCount');
    playerListContainerElement = document.getElementById('playerListContainer');
    confirmPlayersBtn = document.getElementById('confirmPlayersBtn');
    backButton = document.getElementById('backButton');

    // Parse URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    tournamentId = urlParams.get('tournamentId');
    currentGameId = urlParams.get('gameId');

    if (tournamentId === null) {
        alert("Tournament ID is missing. Redirecting...");
        window.location.href = 'tournaments.html';
        return;
    }
    tournamentId = parseInt(tournamentId); // Ensure it's a number if it's an index

    await loadStarfireData(); // From data-manager.js

    if (currentGameId) {
        // Load existing game
        const gameData = getGameById(tournamentId, currentGameId); // Use new function
        if (gameData) {
            loadGameData(gameData);
            gameTitleElement.textContent = `Game: Starfire vs ${opponentName}`;
        } else {
            alert("Game data not found. Starting a new game in this tournament.");
            setupNewGameDefaults();
            gameTitleElement.textContent = `New Game: Starfire vs ${opponentName}`;
        }
    } else {
        // New game
        setupNewGameDefaults();
        gameTitleElement.textContent = `New Game: Starfire vs ${opponentName}`;
    }

    updateUI();
    updateAllCalculatedStatus();
    attachEventListeners();
});

/**
 * Sets up the default state for a new game.
 */
function setupNewGameDefaults() {
    homeScore = 0;
    awayScore = 0;
    startingRatio = 'M';
    opponentName = "Away Team";
    gameTo = 15;
    startOn = 'O';
    events = [];
    lineOCount = 0;
    lineDCount = 0;
    lineXCount = 0;
    lineKCount = 0;
    currentGameId = null; // Ensure it's null for a new game
}

/**
 * Loads data from a saved game object into the current game state.
 * @param {object} gameData - The game data object to load.
 */
function loadGameData(gameData) {
    homeScore = gameData.homeScore;
    awayScore = gameData.awayScore;
    startingRatio = gameData.startingRatio;
    opponentName = gameData.opponentName;
    gameTo = parseInt(gameData.gameTo) || 15; // Ensure gameTo is a number
    startOn = gameData.startOn;
    events = gameData.events ? [...gameData.events] : []; // Deep copy events
    lineOCount = gameData.lineOCount || 0;
    lineDCount = gameData.lineDCount || 0;
    lineXCount = gameData.lineXCount || 0;
    lineKCount = gameData.lineKCount || 0;
    currentGameId = gameData.id; // Store the game's ID
    // gameData.timestamp is still useful for display/sorting, but not for primary key
}

/**
 * Updates the UI elements with the current game state.
 */
function updateUI() {
    if (!homeScoreElement) return; // Elements might not be ready on initial script parse

    homeScoreElement.textContent = homeScore;
    awayScoreElement.textContent = awayScore;
    opponentNameInput.value = opponentName;
    awayTeamNameElement.textContent = opponentName;

    document.querySelector(`input[name="startingRatio"][value="${startingRatio}"]`).checked = true;
    gameToInput.value = gameTo;
    document.querySelector(`input[name="startOn"][value="${startOn}"]`).checked = true;

    lineOCountElement.textContent = lineOCount;
    lineDCountElement.textContent = lineDCount;
    lineXCountElement.textContent = lineXCount;
    lineKCountElement.textContent = lineKCount;

    updateSelectedPlayersDisplay();
    updateEventsDisplay();
}

/**
 * Updates all calculated status fields, like current ratio and possession.
 */
function updateAllCalculatedStatus() {
    updateCurrentRatioAndPossession(); // This will also call updateCurrentPossession
}

/**
 * Attaches event listeners to the various UI elements.
 */
function attachEventListeners() {
    homePlusButton.addEventListener('click', () => handleScore('home'));
    awayPlusButton.addEventListener('click', () => handleScore('away'));

    startingRatioInputs.forEach(input => {
        input.addEventListener('change', () => {
            startingRatio = document.querySelector('input[name="startingRatio"]:checked').value;
            updateAllCalculatedStatus();
        });
    });

    gameToInput.addEventListener('input', () => {
        gameTo = parseInt(gameToInput.value) || 15;
        updateAllCalculatedStatus();
    });

    startOnInputs.forEach(input => {
        input.addEventListener('change', () => {
            startOn = document.querySelector('input[name="startOn"]:checked').value;
            updateAllCalculatedStatus();
        });
    });

    opponentNameInput.addEventListener('input', () => {
        opponentName = opponentNameInput.value || "Away Team";
        awayTeamNameElement.textContent = opponentName;
        gameTitleElement.textContent = `Game: Starfire vs ${opponentName}`;
    });

    undoLastButton.addEventListener('click', handleUndoLast);

    saveGameButton.addEventListener('click', handleSaveGame);
    backButton.addEventListener('click', handleBack);

    currentLineInputs.forEach(input => {
        input.addEventListener('change', (event) => {
            const selectedGameLine = event.target.value;
            clearSelectedPlayers(); // Clear previous players if line changes
            openPlayerSelectionPopup(selectedGameLine);
        });
    });

    closePlayerModalBtn.addEventListener('click', () => playerSelectionModal.style.display = 'none');
    confirmPlayersBtn.addEventListener('click', handlePlayerSelectionConfirm);
    window.addEventListener('click', (event) => { // Close modal if clicked outside
        if (event.target === playerSelectionModal) playerSelectionModal.style.display = 'none';
    });

    // Optional: Update possession manually (though it's mostly automatic)
    currentPossessionInputs.forEach(input => {
        input.addEventListener('change', () => {
            possession = document.querySelector('input[name="currentPossession"]:checked').value;
            currentPossessionElement.textContent = `We Are On: ${possession}`;
        });
    });
}

/**
 * Calculates and updates the current and next gender ratios based on the total points scored and starting ratio.
 */
function updateCurrentRatioAndPossession() {
    const totalPoints = homeScore + awayScore;
    const ratioPattern = startingRatio === RATIO_TYPES.MALE ?
        [RATIO_TYPES.MALE, RATIO_TYPES.FEMALE, RATIO_TYPES.FEMALE, RATIO_TYPES.MALE] :
        [RATIO_TYPES.FEMALE, RATIO_TYPES.MALE, RATIO_TYPES.MALE, RATIO_TYPES.FEMALE];

    currentRatio = ratioPattern[totalPoints % 4];
    nextRatio = ratioPattern[(totalPoints + 1) % 4];

    currentRatioElement.textContent = `Current Ratio: ${currentRatio}`;
    nextRatioElement.textContent = `Next Ratio: ${nextRatio}`;

    updateCurrentPossession();
}

/**
 * Calculates and updates the current possession based on game start settings,
 * scores, and halftime rules.
 */
function updateCurrentPossession() {
    let nextPossessionCalc = startOn; // Default to initial setting
    const halftimePoint = Math.ceil(gameTo / 2);

    // Determine if halftime has just occurred
    // Halftime occurs when a team reaches halftimePoint AND the other team has not.
    // The possession flips for the point AFTER halftime is reached.
    let lastEventBeforeThisPoint = events.length > 0 ? events[events.length - 1] : null;
    let scoreBeforeThisPoint = { home: homeScore, away: awayScore };

    if (lastEventBeforeThisPoint) { // If a point was just scored
        if (lastEventBeforeThisPoint.score === 'home') scoreBeforeThisPoint.home--;
        else scoreBeforeThisPoint.away--;
    }

    const homeReachedHalftime = scoreBeforeThisPoint.home === halftimePoint && scoreBeforeThisPoint.away < halftimePoint;
    const awayReachedHalftime = scoreBeforeThisPoint.away === halftimePoint && scoreBeforeThisPoint.home < halftimePoint;
    const isAfterHalftimePoint = homeReachedHalftime || awayReachedHalftime;

    if (events.length > 0) { // If at least one point has been played
        if (isAfterHalftimePoint && events.length === (scoreBeforeThisPoint.home + scoreBeforeThisPoint.away)) {
            // This logic means possession flips for the point *after* halftime is scored.
            nextPossessionCalc = startOn === POSSESSION_TYPES.OFFENSE ? POSSESSION_TYPES.DEFENSE : POSSESSION_TYPES.OFFENSE;
        } else {
            // Standard possession flip after a score
            nextPossessionCalc = lastEventBeforeThisPoint.score === 'home' ? POSSESSION_TYPES.DEFENSE : POSSESSION_TYPES.OFFENSE;
        }
    }
    // If it's the very first point (events.length === 0), nextPossessionCalc remains startOn.

    possession = nextPossessionCalc;
    currentPossessionElement.textContent = `We Are On: ${possession}`;
    document.querySelector(`input[name="currentPossession"][value="${possession}"]`).checked = true;
}

/**
 * Gets the value of the currently selected line (O, D, X, K).
 * @returns {string|null} The selected line value, or null if no line is selected.
 */
function getSelectedLine() {
    const selected = document.querySelector('input[name="currentLine"]:checked');
    if (!selected) {
        alert('Please select a line before scoring.');
        return null;
    }
    return selected.value;
}

/**
 * Clears the selection of the current line radio buttons.
 */
function clearLineSelection() {
    currentLineInputs.forEach(input => input.checked = false);
}

/**
 * Increments the counter for the specified line and updates its display.
 * @param {string} line - The line type (O, D, X, K) whose counter is to be incremented.
 */
function incrementLineCounter(line) {
    switch (line) {
        case LINE_TYPES.OFFENSE: lineOCount++; lineOCountElement.textContent = lineOCount; break;
        case LINE_TYPES.DEFENSE: lineDCount++; lineDCountElement.textContent = lineDCount; break;
        case LINE_TYPES.EXTRA: lineXCount++; lineXCountElement.textContent = lineXCount; break;
        case LINE_TYPES.KILL: lineKCount++; lineKCountElement.textContent = lineKCount; break;
    }
}

/**
 * Decrements the counter for the specified line and updates its display.
 * @param {string} line - The line type (O, D, X, K) whose counter is to be decremented.
 */
function decrementLineCounter(line) {
    switch (line) {
        case LINE_TYPES.OFFENSE: if (lineOCount > 0) lineOCount--; lineOCountElement.textContent = lineOCount; break;
        case LINE_TYPES.DEFENSE: if (lineDCount > 0) lineDCount--; lineDCountElement.textContent = lineDCount; break;
        case LINE_TYPES.EXTRA: if (lineXCount > 0) lineXCount--; lineXCountElement.textContent = lineXCount; break;
        case LINE_TYPES.KILL: if (lineKCount > 0) lineKCount--; lineKCountElement.textContent = lineKCount; break;
    }
}

/**
 * Resets all line counters to zero and updates their display.
 */
function resetLineCounters() {
    lineOCount = 0; lineDCount = 0; lineXCount = 0; lineKCount = 0;
    lineOCountElement.textContent = lineOCount;
    lineDCountElement.textContent = lineDCount;
    lineXCountElement.textContent = lineXCount;
    lineKCountElement.textContent = lineKCount;
}

/**
 * Handles a score event for either the home or away team.
 * @param {string} team - The team that scored ('home' or 'away').
 */
function handleScore(team) {
    const selectedLine = getSelectedLine();
    if (!selectedLine) return;

    const event = {
        line: selectedLine,
        ratio: currentRatio,
        possession: possession, // Possession at the START of the point
        score: team, // 'home' or 'away'
        players: [...currentPointPlayers.map(p => p.id)] // Store IDs of players on the line
    };
    events.push(event);

    if (team === 'home') {
        homeScore++;
        homeScoreElement.textContent = homeScore;
    } else {
        awayScore++;
        awayScoreElement.textContent = awayScore;
    }

    incrementLineCounter(selectedLine);
    updateAllCalculatedStatus(); // Recalculate ratio and next possession
    updateEventsDisplay();
    clearSelectedPlayers(); // Clear players after point is scored
    clearLineSelection();
}

/**
 * Handles the "Undo Last" action, reverting the last recorded event.
 */
function handleUndoLast() {
    if (events.length === 0) return;

    const lastEvent = events.pop();

    if (lastEvent.score === 'home') {
        if (homeScore > 0) homeScore--;
        homeScoreElement.textContent = homeScore;
    } else {
        if (awayScore > 0) awayScore--;
        awayScoreElement.textContent = awayScore;
    }

    decrementLineCounter(lastEvent.line);
    updateAllCalculatedStatus(); // Recalculate based on new score
    updateEventsDisplay();
    // currentPointPlayers are not restored from the event on undo, as per current design.
    // Note: Line selection is not restored, user needs to re-select if needed.
}

/**
 * Updates the display of game events in the UI.
 */
function updateEventsDisplay() {
    let pointsHTML = ``;
    let linesHTML = ``;
    let ratioHTML = ``;
    let possessionHTML = ``;
    let scoreHTML = ``;

    for (let i = events.length - 1; i >= 0; i--) {
        const event = events[i];
        pointsHTML += ` ${(i + 1)} <br>`;
        linesHTML += ` ${event.line} <br>`;
        ratioHTML += ` ${event.ratio} <br>`;
        possessionHTML += ` ${event.possession} <br>`;
        scoreHTML += ` ${event.score === 'home' ? 'Star' : 'Bad'} <br>`;
    }
    lastPointEventElement.innerHTML = pointsHTML;
    lastEventLineElement.innerHTML = linesHTML;
    lastEventRatioElement.innerHTML = ratioHTML;
    lastEventPossessionElement.innerHTML = possessionHTML;
    lastEventScoreElement.innerHTML = scoreHTML;
}

/**
 * Handles the "Save Game" action, packaging the current game state and saving it.
 */
function handleSaveGame() {
    if (homeScore === 0 && awayScore === 0 && events.length === 0) {
        if (!confirm("No points scored. Save this empty game setup?")) {
            return;
        }
    }
    const highestScore = Math.max(homeScore, awayScore);
    if (highestScore < gameTo) {
        if (!confirm(`${gameTo} points not yet reached. Save this game setup?`)) {
            return;
        }
    }

    const gameData = {
        id: currentGameId, // Will be null for a new game, data-manager will assign one
        opponentName,
        homeScore,
        awayScore,
        lineOCount,
        lineDCount,
        lineXCount,
        lineKCount,
        events: [...events], // Save a copy
        startingRatio,
        gameTo,
        startOn,
        timestamp: new Date().toISOString(), // @todo - fix if desired Use existing timestamp if editing (gameData.timestamp || ), else new 
        // stats: getMatches(events) // Optionally pre-calculate and store full stats
    };

    const success = saveGame(tournamentId, gameData); // From data-manager.js

    if (success) {
        alert('Game saved successfully!');
        window.location.href = `games-list.html?tournamentId=${tournamentId}`;
    } else {
        alert('Failed to save game. Tournament ID might be invalid or data not loaded.');
    }
}

function handleBack() {
    if ((homeScore === 0 && awayScore === 0 && events.length === 0) || confirm("Leave the current game without saving?")) {
        window.location.href = `games-list.html?tournamentId=${tournamentId}`;
    }
    return;
}

// --- Player Selection Logic ---

/**
 * Opens the player selection popup, populates it with available players.
 * @param {string} selectedGameLine - The line selected (O, D, X, K).
 */
function openPlayerSelectionPopup(selectedGameLine) {
    modalSelectedLineElement.textContent = selectedGameLine;
    const requiredM = currentRatio === RATIO_TYPES.MALE ? 4 : 3;
    const requiredW = currentRatio === RATIO_TYPES.FEMALE ? 4 : 3;
    modalRequiredRatioInfoElement.textContent = `Need ${requiredM} M-match, ${requiredW} W-match`;

    updateModalPlayerCounts(); // Reset counts

    const allPlayers = getPlayers(); // From data-manager.js
    if (!allPlayers || allPlayers.length === 0) {
        playerListContainerElement.innerHTML = "<p>No players available in the team roster.</p>";
        playerSelectionModal.style.display = 'block';
        return;
    }

    // Sort players: those matching the line type first, then by name
    const sortedPlayers = [...allPlayers].sort((a, b) => {
        const aMatchesLine = a.line === selectedGameLine;
        const bMatchesLine = b.line === selectedGameLine;
        if (aMatchesLine && !bMatchesLine) return -1;
        if (!aMatchesLine && bMatchesLine) return 1;
        return (a.lastName + a.firstName).localeCompare(b.lastName + b.firstName);
    });

    playerListContainerElement.innerHTML = '';
    sortedPlayers.forEach(player => {
        const div = document.createElement('div');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `player-${player.id}`;
        checkbox.value = player.id;
        checkbox.dataset.gender = player.genderMatch; // Store gender for validation
        checkbox.addEventListener('change', updateModalPlayerCounts);

        const label = document.createElement('label');
        label.htmlFor = `player-${player.id}`;
        label.textContent = `${player.firstName} ${player.lastName} (${player.nickname || 'N/A'}) - ${player.genderMatch} - Line: ${player.line} - Pos: ${player.position}`;
        
        div.appendChild(checkbox);
        div.appendChild(label);
        playerListContainerElement.appendChild(div);
    });

    playerSelectionModal.style.display = 'block';
}

/**
 * Updates the player counts displayed in the modal during selection.
 */
function updateModalPlayerCounts() {
    const selectedCheckboxes = Array.from(playerListContainerElement.querySelectorAll('input[type="checkbox"]:checked'));
    let mCount = 0;
    let wCount = 0;
    selectedCheckboxes.forEach(cb => {
        if (cb.dataset.gender === RATIO_TYPES.MALE) mCount++;
        if (cb.dataset.gender === RATIO_TYPES.FEMALE) wCount++;
    });
    modalPlayerCountElement.textContent = `${selectedCheckboxes.length}`;
    modalSelectedMCountElement.textContent = mCount;
    modalSelectedWCountElement.textContent = wCount;
}

/**
 * Handles the confirmation of selected players from the popup.
 */
function handlePlayerSelectionConfirm() {
    const selectedCheckboxes = Array.from(playerListContainerElement.querySelectorAll('input[type="checkbox"]:checked'));
    if (selectedCheckboxes.length !== 7) {
        alert("Please select exactly 7 players.");
        return;
    }

    let mCount = 0;
    let wCount = 0;
    currentPointPlayers = [];
    const allPlayers = getPlayers();

    selectedCheckboxes.forEach(cb => {
        const player = allPlayers.find(p => p.id === cb.value);
        if (player) {
            currentPointPlayers.push(player);
            if (player.genderMatch === RATIO_TYPES.MALE) mCount++;
            if (player.genderMatch === RATIO_TYPES.FEMALE) wCount++;
        }
    });

    const requiredM = currentRatio === RATIO_TYPES.MALE ? 4 : 3;
    const requiredW = currentRatio === RATIO_TYPES.FEMALE ? 4 : 3;

    if (mCount !== requiredM || wCount !== requiredW) {
        alert(`Gender ratio incorrect. Need ${requiredM} M-match and ${requiredW} W-match for ratio ${currentRatio}. You selected ${mCount}M, ${wCount}W.`);
        currentPointPlayers = []; // Clear if invalid
        return;
    }

    updateSelectedPlayersDisplay();
    playerSelectionModal.style.display = 'none';
}

/**
 * Updates the display of selected players on the main game control page.
 */
function updateSelectedPlayersDisplay() {
    selectedPlayersListElement.innerHTML = '';
    if (currentPointPlayers.length === 0) {
        selectedPlayersListElement.innerHTML = '<li>No players selected for this point.</li>';
        return;
    }
    currentPointPlayers.forEach(player => {
        const li = document.createElement('li');
        li.textContent = `${player.firstName} ${player.lastName} (${player.genderMatch})`;
        selectedPlayersListElement.appendChild(li);
    });
}

/**
 * Clears the currently selected players for the point and updates their display.
 */
function clearSelectedPlayers() {
    currentPointPlayers = [];
    updateSelectedPlayersDisplay();
}

// --- Utility functions for stats (can be used by games-list.js or if storing stats with game) ---
/**
 * Creates and returns a new statistics object initialized to zeros.
 * @returns {object} An initialized statistics object.
 */
function makeStatsObj() {
    const lines = [LINE_TYPES.OFFENSE, LINE_TYPES.DEFENSE, LINE_TYPES.EXTRA, LINE_TYPES.KILL];
    const stats = {};
    lines.forEach(line => {
        stats[line] = {
            points: 0, scores: 0, // Home team scores
            W: 0, M: 0,            // Points played under W/M ratio
            WO: 0, WD: 0, MO: 0, MD: 0, // Points played under W/M ratio starting O/D
            WOS: 0, WDS: 0, MOS: 0, MDS: 0 // Points scored by home team under W/M ratio starting O/D
        };
    });
    return stats;
}

/**
 * Calculates statistics based on a list of game events.
 * @param {Array<object>} gameEvents - An array of game event objects.
 * @returns {object} A statistics object populated with data from the events.
 */
function getMatches(gameEvents) {
    const matches = makeStatsObj();
    if (!gameEvents) return matches;

    gameEvents.forEach((event) => {
        if (!matches[event.line]) {
            console.warn(`Unknown line type in event: ${event.line}. Skipping.`);
            return; // Skip if line type is not recognized
        }

        matches[event.line].points++;
        matches[event.line][event.ratio]++; // W or M count

        const ratioPossessionKey = event.ratio + event.possession; // e.g., "WO", "MD"
        if (matches[event.line].hasOwnProperty(ratioPossessionKey)) {
            matches[event.line][ratioPossessionKey]++;
        }

        if (event.score === 'home') {
            matches[event.line].scores++;
            const ratioPossessionScoreKey = ratioPossessionKey + 'S'; // e.g., "WOS", "MDS"
            if (matches[event.line].hasOwnProperty(ratioPossessionScoreKey)) {
                matches[event.line][ratioPossessionScoreKey]++;
            }
        }
    });
    return matches;
}

// ```

// @todo - eval
// A quick note on the `updateCurrentPossession` logic:
// I've refined it slightly to better handle the halftime possession switch. The possession should flip for the point *after* halftime is reached by one team. The logic now considers the score *before* the current point was scored (if applicable) to determine if halftime was just crossed.

// **Next Steps:**

// 1.  **Create `scripts/game-control.js`** with the content above.
// 2.  **Thoroughly Test:**
//    *   Navigate from `tournaments.html` -> `games-list.html` -> `game-control.html` (for a new game).
//    *   Score points, change settings, use "Undo".
//    *   Save the game. You should be redirected to `games-list.html`, and the new game should appear.
//    *   Open the saved game from `games-list.html`. Its data should load correctly into `game-control.html`.
//    *   Make changes to the loaded game and save it again (it should update the existing game entry based on the timestamp).
//    *   Test the initial data loading from `starfire.json` if `localStorage` is empty.
//    *   Test the ratio and possession logic carefully, especially around halftime.

// This is a big piece, so take your time testing all the flows! Let me know how it goes or if you hit any snags.
