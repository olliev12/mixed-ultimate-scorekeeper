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
let lineForCurrentPoint = null; // Stores the line (O,D,X,K) selected for the current point being set up
let isGameStarted = false; // New state variable

// DOM Element References
let homeScoreElement, awayScoreElement, homePlusButton, awayPlusButton,
    currentRatioElement, nextRatioElement, currentPossessionElement,
    opponentNameInput, awayTeamNameElement, startingRatioInputs, gameToInput,
    startOnInputs, undoLastButton, lineOCountElement, // currentLineInputs (old radio buttons) removed from global
    lineDCountElement, lineXCountElement, lineKCountElement,
    selectedPlayersListElement, // For displaying selected players on main page
    playerSelectionModal, closePlayerModalBtn,
    modalLineSelectionContainer, modalPlayerSelectionArea, modalCurrentLineInputs,
    modalSelectedLineDisplayElement,
    modalRequiredRatioInfoElement, modalPlayerCountElement,
    modalSelectedMCountElement, modalSelectedWCountElement,
    playerListContainerElement, confirmPlayersBtn,
    lastPointEventElement, lastEventLineElement, lastEventRatioElement,
    lastEventPossessionElement, lastEventScoreElement,
    currentPossessionInputs, saveGameButton, gameTitleElement, backButton,
    selectLinePlayersBtn, displaySelectedLineForPointElement;

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
    // Initially hide game sections
    document.getElementById('gameStatusPanel').style.display = 'none';
    document.querySelector('main').style.display = 'none'; // Main score display
    document.getElementById('eventsSection').style.display = 'none';


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
    const startGameButton = document.getElementById('startGame');
    const toggleSettingsButton = document.getElementById('toggleSettingsButton');
    const settingsContent = document.getElementById('settingsContent');
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
    selectLinePlayersBtn = document.getElementById('selectLinePlayersBtn');
    displaySelectedLineForPointElement = document.getElementById('displaySelectedLineForPoint');
    closePlayerModalBtn = document.getElementById('closePlayerModalBtn');
    modalLineSelectionContainer = document.getElementById('modalLineSelectionContainer');
    modalPlayerSelectionArea = document.getElementById('modalPlayerSelectionArea');
    modalCurrentLineInputs = document.querySelectorAll('input[name="modalCurrentLine"]');
    modalSelectedLineDisplayElement = document.getElementById('modalSelectedLineDisplay');
    modalRequiredRatioInfoElement = document.getElementById('modalRequiredRatioInfo');
    modalPlayerCountElement = document.getElementById('modalPlayerCount');
    modalSelectedMCountElement = document.getElementById('modalSelectedMCount');
    modalSelectedWCountElement = document.getElementById('modalSelectedWCount');
    playerListContainerElement = document.getElementById('playerListContainer');
    confirmPlayersBtn = document.getElementById('confirmPlayersBtn');
    backButton = document.getElementById('backButton');

    // Hide toggle button initially
    if (toggleSettingsButton) toggleSettingsButton.style.display = 'none';


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
        const gameData = getGameById(tournamentId, currentGameId);
        if (gameData) {
            loadGameData(gameData);
            gameTitleElement.textContent = `Starfire vs ${opponentName || 'Opponent'}`;
            startGameSetup(startGameButton, toggleSettingsButton, settingsContent); // A loaded game is considered started
        } else {
            alert("Game data not found. Starting a new game setup in this tournament.");
            setupNewGameDefaults(); // Setup for a new game if specific gameId not found
            gameTitleElement.textContent = `New Game Setup`;
        }
    } else {
        // New game
        setupNewGameDefaults();
        gameTitleElement.textContent = `New Game`;
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
    lineForCurrentPoint = null;
    isGameStarted = false; // Reset for new game setup
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
    // lineForCurrentPoint and currentPointPlayers will be empty on load, user must set them for the next point.
    isGameStarted = true; // A loaded game is considered started
}

/**
 * Updates the UI elements with the current game state.
 */
function updateUI() {
    if (!homeScoreElement) return; // Elements might not be ready on initial script parse

    homeScoreElement.textContent = homeScore;
    awayScoreElement.textContent = awayScore;
    opponentNameInput.value = opponentName;
    awayTeamNameElement.textContent = opponentName || 'Away Team';

    document.querySelector(`input[name="startingRatio"][value="${startingRatio}"]`).checked = true;
    gameToInput.value = gameTo;
    document.querySelector(`input[name="startOn"][value="${startOn}"]`).checked = true;

    if (isGameStarted) {
        disableSettings();
    }

    // Update line counts in modal labels as well
    document.getElementById('lineOCount').textContent = lineOCount;
    document.getElementById('lineDCount').textContent = lineDCount;
    document.getElementById('lineXCount').textContent = lineXCount;
    document.getElementById('lineKCount').textContent = lineKCount;

    displaySelectedLineForPointElement.textContent = lineForCurrentPoint || 'None';
    updateSelectedPlayersDisplay();
    updateEventsDisplay();
}

/**
 * Disables settings input fields.
 */
function disableSettings() {
    startingRatioInputs.forEach(input => input.disabled = true);
    gameToInput.disabled = true;
    startOnInputs.forEach(input => input.disabled = true);
    opponentNameInput.disabled = true;
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
    const startGameButton = document.getElementById('startGame');
    const toggleSettingsButton = document.getElementById('toggleSettingsButton');
    const settingsContent = document.getElementById('settingsContent');

    homePlusButton.addEventListener('click', () => handleScore('home'));
    awayPlusButton.addEventListener('click', () => handleScore('away'));

    startingRatioInputs.forEach(input => {
        input.addEventListener('change', () => {
            if (isGameStarted) return;
            startingRatio = document.querySelector('input[name="startingRatio"]:checked').value;
            updateAllCalculatedStatus();
        });
    });

    gameToInput.addEventListener('input', () => {
        if (isGameStarted) return;
        gameTo = parseInt(gameToInput.value) || 15;
        updateAllCalculatedStatus();
    });

    startOnInputs.forEach(input => {
        input.addEventListener('change', () => {
            if (isGameStarted) return;
            startOn = document.querySelector('input[name="startOn"]:checked').value;
            updateAllCalculatedStatus();
        });
    });

    opponentNameInput.addEventListener('input', () => {
        if (isGameStarted) return;
        opponentName = opponentNameInput.value || "Away Team";
        awayTeamNameElement.textContent = opponentName || 'Away Team';
        gameTitleElement.textContent = `Starfire vs ${opponentName}`;
    });

    undoLastButton.addEventListener('click', handleUndoLast);
    saveGameButton.addEventListener('click', handleSaveGame);
    backButton.addEventListener('click', handleBack);

    if (startGameButton) {
        startGameButton.addEventListener('click', () => {
            if (confirm("Are you sure you want to start the game? Settings will be locked.")) {
                startGameSetup(startGameButton, toggleSettingsButton, settingsContent);
            }
        });
    }

    if (toggleSettingsButton) {
        toggleSettingsButton.addEventListener('click', () => {
            const isCollapsed = settingsContent.classList.toggle('collapsed');
            toggleSettingsButton.textContent = isCollapsed ? '▶' : '▼';
        });
    }

    if (selectLinePlayersBtn) {
        selectLinePlayersBtn.addEventListener('click', () => {
            if (!isGameStarted) {
                alert("Please start the game before setting up a line.");
                return;
            }
            openPlayerSelectionPopup();
        });
    }

    modalCurrentLineInputs.forEach(input => {
        input.addEventListener('change', (event) => {
            const selectedLineInModal = event.target.value;
            modalSelectedLineDisplayElement.textContent = selectedLineInModal;
            modalPlayerSelectionArea.style.display = 'block'; // Show player selection area
            populatePlayerCheckboxes(selectedLineInModal); // Populate players for this line
        });
    });

    if (closePlayerModalBtn) {
        closePlayerModalBtn.addEventListener('click', () => playerSelectionModal.style.display = 'none');
    }
    if (confirmPlayersBtn) {
        confirmPlayersBtn.addEventListener('click', handlePlayerSelectionConfirm);
    }
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
 * Sets up the UI and state when the game starts or is loaded.
 * Disables settings, shows game sections, and hides the start button.
 * @param {HTMLElement} startGameButton - The start game button element.
 * @param {HTMLElement} toggleSettingsButton - The toggle settings button element.
 * @param {HTMLElement} settingsContent - The settings content div element.
 */
function startGameSetup(startGameButton, toggleSettingsButton, settingsContent) {
    isGameStarted = true;
    disableSettings();
    if (startGameButton) startGameButton.style.display = 'none';
    if (toggleSettingsButton) toggleSettingsButton.style.display = 'inline-block';
    if (settingsContent) settingsContent.classList.add('collapsed'); // Collapse settings
    if (toggleSettingsButton) toggleSettingsButton.textContent = '▶'; // Set to expand icon


    document.getElementById('gameStatusPanel').style.display = 'block';
    document.querySelector('main').style.display = 'flex'; // Or 'block' depending on your main layout
    document.getElementById('eventsSection').style.display = 'block';
    updateAllCalculatedStatus(); // Ensure ratio/possession is correct based on locked settings
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

    let lastEventBeforeThisPoint = events.length > 0 ? events[events.length - 1] : null;
    let scoreBeforeThisPoint = { home: homeScore, away: awayScore };

    if (lastEventBeforeThisPoint) {
        if (lastEventBeforeThisPoint.score === 'home') scoreBeforeThisPoint.home--;
        else scoreBeforeThisPoint.away--;
    }

    const homeReachedHalftime = scoreBeforeThisPoint.home === halftimePoint && scoreBeforeThisPoint.away < halftimePoint;
    const awayReachedHalftime = scoreBeforeThisPoint.away === halftimePoint && scoreBeforeThisPoint.home < halftimePoint;
    const isAfterHalftimePoint = homeReachedHalftime || awayReachedHalftime;

    if (events.length > 0) {
        if (isAfterHalftimePoint && events.length === (scoreBeforeThisPoint.home + scoreBeforeThisPoint.away)) {
            nextPossessionCalc = startOn === POSSESSION_TYPES.OFFENSE ? POSSESSION_TYPES.DEFENSE : POSSESSION_TYPES.OFFENSE;
        } else {
            nextPossessionCalc = lastEventBeforeThisPoint.score === 'home' ? POSSESSION_TYPES.DEFENSE : POSSESSION_TYPES.OFFENSE;
        }
    }

    possession = nextPossessionCalc;
    currentPossessionElement.textContent = `We Are On: ${possession}`;
    document.querySelector(`input[name="currentPossession"][value="${possession}"]`).checked = true;
}

/**
 * Gets the value of the currently selected line (O, D, X, K).
 * @returns {string|null} The selected line value, or null if no line is selected.
 */
function getSelectedLine() {
    // This now refers to the line confirmed for the current point
    return lineForCurrentPoint;
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
    if (!isGameStarted) {
        alert("Please start the game before scoring.");
        return;
    }
    const selectedLine = getSelectedLine();
    if (!selectedLine) {
        alert("Please set up the line and players before scoring.");
        return;
    }

    if (currentPointPlayers.length !== 7) {
        alert("Please select 7 players for the line before scoring.");
        return;
    }

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
    clearPointSetup(); // Clear line and players after point is scored
}

/**
 * Handles the "Undo Last" action, reverting the last recorded event.
 */
function handleUndoLast() {
    if (!isGameStarted) {
        alert("Game has not started. Nothing to undo.");
        return;
    }
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
    clearPointSetup(); // Clear line and players as context has changed
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
    if (!isGameStarted && events.length === 0 && homeScore === 0 && awayScore === 0) {
        if (!confirm("Game has not been started and no points scored. Save this game setup?")) {
            return;
        }
    } else if (isGameStarted) {
        const highestScore = Math.max(homeScore, awayScore);
        if (highestScore < gameTo) {
            if (!confirm(`Game is in progress (Game To: ${gameTo} not reached). Save current state?`)) {
                return;
            }
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
        timestamp: new Date().toISOString(), // last modified timestamp
    };

    const success = saveGame(tournamentId, gameData); // From data-manager.js

    if (success) {
        alert('Game saved successfully!');
        window.location.href = `games-list.html?tournamentId=${tournamentId}`;
    } else {
        alert('Failed to save game. Tournament ID might be invalid or data not loaded.');
    }
}

/**
 * Handles the "Back" button click, prompting the user before leaving.
 */
function handleBack() {
    if (!isGameStarted && events.length === 0 && homeScore === 0 && awayScore === 0) {
        window.location.href = `games-list.html?tournamentId=${tournamentId}`;
        return;
    }
    if (confirm("Leave the current game? Any unsaved changes will be lost.")) {
        window.location.href = `games-list.html?tournamentId=${tournamentId}`;
    }
}

// --- Player Selection Logic ---

/**
 * Opens the player selection popup, populates it with available players.
 */
function openPlayerSelectionPopup() {
    // Reset modal state
    modalPlayerSelectionArea.style.display = 'none'; // Hide player area until line is chosen
    playerListContainerElement.innerHTML = ''; // Clear old player checkboxes
    modalCurrentLineInputs.forEach(input => input.checked = false); // Uncheck line radios
    updateModalPlayerCounts(); // Reset counts in modal display

    // If a line is already set for the current point (e.g., user is editing), pre-select it.
    if (lineForCurrentPoint) {
        const lineRadioToSelect = document.getElementById(`modalLine${lineForCurrentPoint}`);
        if (lineRadioToSelect) {
            lineRadioToSelect.checked = true;
            modalSelectedLineDisplayElement.textContent = lineForCurrentPoint;
            modalPlayerSelectionArea.style.display = 'block';
            populatePlayerCheckboxes(lineForCurrentPoint); // Also pre-populate and check players
        }
    } else if (events.length > 0) { // Otherwise, if not the first point, try to default the line
        const lineRotation = [LINE_TYPES.OFFENSE, LINE_TYPES.DEFENSE, LINE_TYPES.EXTRA]; // O, D, X
        let lastRealLine = null;

        // Find the last non-'K' line from previous events
        for (let i = events.length - 1; i >= 0; i--) {
            if (events[i].line !== LINE_TYPES.KILL) {
                lastRealLine = events[i].line;
                break;
            }
        }

        if (lastRealLine) {
            const lastLineIndex = lineRotation.indexOf(lastRealLine);
            const nextLineIndex = (lastLineIndex + 1) % lineRotation.length;
            const defaultLine = lineRotation[nextLineIndex];
            if (defaultLine) {
                lineForCurrentPoint = defaultLine;

                const lineRadioToSelect = document.getElementById(`modalLine${defaultLine}`);
                if (lineRadioToSelect) {
                    lineRadioToSelect.checked = true;
                    modalSelectedLineDisplayElement.textContent = defaultLine;
                    modalPlayerSelectionArea.style.display = 'block';
                    populatePlayerCheckboxes(lineForCurrentPoint); // Also pre-populate and check players
                }
            }
        }
    }
    playerSelectionModal.style.display = 'block';
}

/**
 * Populates the player checkboxes in the modal based on the selected line.
 * @param {string} lineSelectedInModal - The line (O,D,X,K) selected within the modal.
 */
function populatePlayerCheckboxes(lineSelectedInModal) {
    const requiredM = currentRatio === RATIO_TYPES.MALE ? 4 : 3;
    const requiredW = currentRatio === RATIO_TYPES.FEMALE ? 4 : 3;
    modalRequiredRatioInfoElement.textContent = `Need ${requiredM} M-match, ${requiredW} W-match`;
    const gamePlayerPoints = calculatePlayerPointsInCurrentGame();

    const allPlayers = getPlayers(); // From data-manager.js
    if (!allPlayers || allPlayers.length === 0) {
        playerListContainerElement.innerHTML = "<p>No players available in the team roster.</p>";
        playerSelectionModal.style.display = 'block';
        return;
    }

    // Sort players: those matching the line type first, then by name
    const sortedPlayers = [...allPlayers].sort((a, b) => {
        const aMatchesLine = a.line === lineSelectedInModal;
        const bMatchesLine = b.line === lineSelectedInModal;
        if (aMatchesLine && !bMatchesLine) return -1;
        if (!aMatchesLine && bMatchesLine) return 1;
        return (a.nickname || (a.lastName + a.firstName)).localeCompare(b.nickname || (b.lastName + b.firstName));
    });

    playerListContainerElement.innerHTML = '';
    sortedPlayers.forEach(player => {
        const div = document.createElement('div');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `player-${player.id}`;
        checkbox.value = player.id;
        checkbox.dataset.gender = player.genderMatch; // Store gender for validation
        // Pre-check if this player was part of currentPointPlayers
        if (currentPointPlayers.some(p => p.id === player.id)) {
            checkbox.checked = true;
        }
        checkbox.addEventListener('change', updateModalPlayerCounts);

        const pointsPlayedInGame = gamePlayerPoints.get(player.id) || 0;
        const label = document.createElement('label');
        label.htmlFor = `player-${player.id}`;
        label.textContent = `${player.nickname} - ${player.genderMatch} (Line: ${player.line}, Pos: ${player.position}) (Played: ${pointsPlayedInGame})`;

        div.appendChild(checkbox);
        div.appendChild(label);
        playerListContainerElement.appendChild(div);
    });
    updateModalPlayerCounts(); // Update counts after populating/checking
}

/**
 * Calculates the number of points each player has played in the current game.
 * @returns {Map<string, number>} A map where keys are player IDs and values are their point counts.
 */
function calculatePlayerPointsInCurrentGame() {
    const playerPoints = new Map();
    events.forEach(event => {
        if (event.players && Array.isArray(event.players)) {
            event.players.forEach(playerId => {
                playerPoints.set(playerId, (playerPoints.get(playerId) || 0) + 1);
            });
        }
    });
    return playerPoints;
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
    const selectedLineInModalRadio = document.querySelector('input[name="modalCurrentLine"]:checked');
    if (!selectedLineInModalRadio) {
        alert("Please select a line (O, D, X, K).");
        return;
    }
    const confirmedLine = selectedLineInModalRadio.value;

    const selectedCheckboxes = Array.from(playerListContainerElement.querySelectorAll('input[type="checkbox"]:checked'));
    if (selectedCheckboxes.length !== 7) {
        alert("Please select exactly 7 players.");
        return;
    }

    let mCount = 0;
    let wCount = 0;
    let handlersOrFlex = 0;
    currentPointPlayers = [];
    const allPlayers = getPlayers();

    selectedCheckboxes.forEach(cb => {
        const player = allPlayers.find(p => p.id === cb.value);
        if (player) {
            currentPointPlayers.push(player);
            if (player.genderMatch === RATIO_TYPES.MALE) mCount++;
            if (player.genderMatch === RATIO_TYPES.FEMALE) wCount++;
            if (['H', 'F'].includes(player.position)) handlersOrFlex++;
        }
    });

    const requiredM = currentRatio === RATIO_TYPES.MALE ? 4 : 3;
    const requiredW = currentRatio === RATIO_TYPES.FEMALE ? 4 : 3;

    if (mCount !== requiredM || wCount !== requiredW) {
        alert(`Gender ratio incorrect. Need ${requiredM} M-match and ${requiredW} W-match for ratio ${currentRatio}. You selected ${mCount}M, ${wCount}W.`);
        currentPointPlayers = []; // Clear if invalid
        return;
    }

    if (handlersOrFlex < 3) {
        if (!confirm("You are low on handlers (less than 3 H/F players selected). Proceed anyway?")) {
            currentPointPlayers = []; // Clear if user cancels
            return;
        }
    }

    lineForCurrentPoint = confirmedLine; // Set the game's current line for the point
    updateSelectedPlayersDisplay();
    displaySelectedLineForPointElement.textContent = lineForCurrentPoint || 'None';
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
        li.textContent = `${player.nickname || (player.firstName + " " + player.lastName)} (${player.genderMatch})`;
        selectedPlayersListElement.appendChild(li);
    });
}

/**
 * Clears the currently selected line and players for the point and updates their display.
 */
function clearPointSetup() {
    currentPointPlayers = [];
    lineForCurrentPoint = null;
    displaySelectedLineForPointElement.textContent = 'None';
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
