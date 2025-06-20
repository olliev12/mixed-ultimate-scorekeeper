// scripts/game-control.js

// Global state variables for the current game
let tournamentId = null;
let currentGameId = null; // To identify if we are editing an existing game

let homeScore = 0;
let awayScore = 0;
let startingRatio = 'M';
let opponentName = 'Away Team';
let gameTo = 13;
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
let effectiveHalftimePoint = null; // Stores the point at which halftime was actually declared
// @todo - we might not need this
let hasHalftimeBeenReachedAndAlerted = false; // Tracks if halftime popup has been shown

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
    resetModalSelectionsBtn, lastPointEventElement, lastEventLineElement, lastEventRatioElement,
    lastEventPossessionElement, lastEventScoreElement, saveGameButton, gameTitleElement, backButton, halfTimeAtElement,
    halftimeModal, closeHalftimeModalBtn, modalSelectedPlayersElement,
    updateHalftimeTargetBtn,
    selectLinePlayersBtn, displaySelectedLineForPointElement, eventsContainerElement;
let autosaveTimeoutId = null; // For debouncing autosave

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
    resetModalSelectionsBtn = document.getElementById('resetModalSelectionsBtn');
    confirmPlayersBtn = document.getElementById('confirmPlayersBtn');
    modalSelectedPlayersElement = document.getElementById('modalSelectedPlayers');
    halfTimeAtElement = document.getElementById('halfTimeAt');
    halftimeModal = document.getElementById('halftimeModal');
    closeHalftimeModalBtn = document.getElementById('closeHalftimeModalBtn');
    updateHalftimeTargetBtn = document.getElementById('updateHalftimeTargetBtn');
    eventsContainerElement = document.getElementById('eventsContainer'); // Get the new container
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

    let gameLoadedSuccessfully = false;
    if (currentGameId) {
        const autosavedGameJSON = localStorage.getItem(`autosave_game_${currentGameId}`);
        if (autosavedGameJSON) {
            console.log("Loading from autosave for game:", currentGameId);
            loadGameData(JSON.parse(autosavedGameJSON));
            gameTitleElement.textContent = `Starfire vs ${opponentName || 'Opponent'}`;
            startGameSetup(startGameButton, toggleSettingsButton, settingsContent); // A loaded game is considered started
            gameLoadedSuccessfully = true;
        } else {
            // No autosave, try loading from main data
            const mainGameData = getGameById(tournamentId, currentGameId);
            if (mainGameData) {
                console.log("Loading from main data for game:", currentGameId);
                loadGameData(mainGameData);
                gameTitleElement.textContent = `Starfire vs ${opponentName || 'Opponent'}`;
                startGameSetup(startGameButton, toggleSettingsButton, settingsContent);
                // Create an initial temporary autosave from this loaded main data
                triggerAutosave(); 
                gameLoadedSuccessfully = true;
            } else {
                alert(`Game with ID ${currentGameId} not found. Setting up for a new game.`);
                currentGameId = null; // Clear invalid ID
            }
        }
    }
    
    if (!gameLoadedSuccessfully) { // Handles both no currentGameId from URL and failed load by ID
        // New game
        setupNewGameDefaults();
        gameTitleElement.textContent = `New Game`;
        updateAllCalculatedStatus();
    }

    updateUI();
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
    gameTo = 13;
    startOn = 'O';
    events = [];
    lineOCount = 0;
    lineDCount = 0;
    lineXCount = 0;
    lineKCount = 0;
    currentGameId = null; // Ensure it's null for a new game
    lineForCurrentPoint = null;
    isGameStarted = false; // Reset for new game setup
    effectiveHalftimePoint = null;
    hasHalftimeBeenReachedAndAlerted = false;
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
    gameTo = parseInt(gameData.gameTo) || 13; // Ensure gameTo is a number
    startOn = gameData.startOn;
    events = gameData.events ? [...gameData.events] : []; // Deep copy events
    lineOCount = gameData.lineOCount || 0;
    lineDCount = gameData.lineDCount || 0;
    lineXCount = gameData.lineXCount || 0;
    lineKCount = gameData.lineKCount || 0;
    currentGameId = gameData.id; // Store the game's ID
    effectiveHalftimePoint = gameData.effectiveHalftimePoint || null;

    // Determine if halftime was already reached in the loaded game
    const actualHalftimeTriggerPoint = effectiveHalftimePoint !== null ? effectiveHalftimePoint : Math.ceil(gameTo / 2);
    if (homeScore > actualHalftimeTriggerPoint || awayScore > actualHalftimeTriggerPoint) {
        hasHalftimeBeenReachedAndAlerted = true;
    } else {
        hasHalftimeBeenReachedAndAlerted = false;
    }
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
        if (effectiveHalftimePoint !== null) {
            // Check if halftime has been reached to disable button
            const actualHalftimeTriggerPoint = effectiveHalftimePoint !== null ? effectiveHalftimePoint : Math.ceil(gameTo / 2);
            if (homeScore >= actualHalftimeTriggerPoint || awayScore >= actualHalftimeTriggerPoint) {
                updateHalftimeTargetBtn.disabled = true;
            } else {
                updateHalftimeTargetBtn.disabled = false;
            }
        }
    }

    // Update line counts in modal labels as well
    document.getElementById('lineOCount').textContent = lineOCount;
    document.getElementById('lineDCount').textContent = lineDCount;
    document.getElementById('lineXCount').textContent = lineXCount;
    document.getElementById('lineKCount').textContent = lineKCount;

    displaySelectedLineForPointElement.textContent = lineForCurrentPoint || 'None';
    updateSelectedPlayersDisplay();
    updateHalftimeAtDisplay(); // Update halftime display
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
    updateHalftimeAtDisplay(); // Ensure halftime display is updated with gameTo changes
}

/**
 * Updates the "Halftime at" display based on gameTo or effectiveHalftimePoint.
 */
function updateHalftimeAtDisplay() {
    halfTimeAtElement.textContent = effectiveHalftimePoint !== null ? effectiveHalftimePoint : Math.ceil(gameTo / 2);
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

    let gameToDebounceTimeout = null;
    gameToInput.addEventListener('input', () => {
        if (isGameStarted) return;
        gameTo = parseInt(gameToInput.value) || 13;
        // Debounce the updateAllCalculatedStatus call for gameTo input
        clearTimeout(gameToDebounceTimeout);
        gameToDebounceTimeout = setTimeout(() => {
            updateAllCalculatedStatus(); 
            // No need to call triggerAutosave here as settings changes aren't autosaved until game starts
            // and initial save captures these.
        }, 500); // 500ms debounce
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
            if (confirm("Are you sure you want to start the game? Settings will be locked. (Halftime target can be changed later)")) {
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
    if (resetModalSelectionsBtn) {
        resetModalSelectionsBtn.addEventListener('click', handleResetModalSelections);
    }

    if (confirmPlayersBtn) {
        confirmPlayersBtn.addEventListener('click', handlePlayerSelectionConfirm);
    }
    window.addEventListener('click', (event) => { // Close modal if clicked outside
        if (event.target === playerSelectionModal) playerSelectionModal.style.display = 'none';
    });

    if (updateHalftimeTargetBtn) {
        updateHalftimeTargetBtn.addEventListener('click', handleUpdateHalftimeTarget);
    }

    if (closeHalftimeModalBtn) {
        closeHalftimeModalBtn.addEventListener('click', () => halftimeModal.style.display = 'none');
    }
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
    // Trigger initial save for brand new games (where currentGameId was initially null)
    if (!currentGameId) triggerInitialSave();
    
}

/**
 * Triggers an initial minimal save when starting a new game to establish a game ID and an autosave point.
 */
async function triggerInitialSave() {
    if (currentGameId) return; // Only trigger if there is no currentGameId yet

    // Create a minimal game data object with settings only
    const initialGameData = {
        opponentName,
        gameTo,
        startingRatio,
        startOn,
        homeScore: 0,
        awayScore: 0,
        events: [],
        lineOCount: 0,
        lineDCount: 0,
        lineXCount: 0,
        lineKCount: 0,
        effectiveHalftimePoint: null,
        timestamp: new Date().toISOString(),
    };

    const success = await saveGame(tournamentId, initialGameData);

    if (success && initialGameData.id) { // Ensure an ID was assigned by saveGame
        // If the initial save was successful, update currentGameId and create the temp autosave.
        // Since saveGame might modify the data (e.g. assigning an ID), we get the latest data.
        const savedGame = getGameById(tournamentId, initialGameData.id); // Use the potential ID.
        if (savedGame) {
            currentGameId = savedGame.id;
            console.log(`New game started with ID: ${currentGameId}. Initial save complete.`);
            // Update URL to include the new gameId for refresh/autosave robustness
            const currentUrl = new URL(window.location.href);
            currentUrl.searchParams.set('gameId', currentGameId);
            history.replaceState(null, '', currentUrl.toString());
            console.log(`URL updated to: ${currentUrl.toString()}`);
            // Now, immediately create a temporary autosave reflecting this initial state:
            triggerAutosave();
        }
    } else {
        alert("Error during initial game setup/save. Game might not be properly saved.");
    }
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

    let lastEventBeforeThisPoint = events.length > 0 ? events[events.length - 1] : null;
    let scoreBeforeThisPoint = { home: homeScore, away: awayScore };

    // events.length > 0
    if (lastEventBeforeThisPoint) {
        if (lastEventBeforeThisPoint.score === 'home') scoreBeforeThisPoint.home--;
        else scoreBeforeThisPoint.away--;

        const halftimeNow = checkForHalftime();

        nextPossessionCalc = halftimeNow 
            ? startOn === POSSESSION_TYPES.OFFENSE ? POSSESSION_TYPES.DEFENSE : POSSESSION_TYPES.OFFENSE
            : lastEventBeforeThisPoint.score === 'home' ? POSSESSION_TYPES.DEFENSE : POSSESSION_TYPES.OFFENSE;
    }

    possession = nextPossessionCalc;
    currentPossessionElement.textContent = `We Are On: ${possession}`;
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
    triggerAutosave(); // Autosave after scoring
}

function checkForHalftime() {
    const actualHalftimeTriggerPoint = effectiveHalftimePoint !== null ? effectiveHalftimePoint : Math.ceil(gameTo / 2);
    const lastEventScore = events.length > 0 ? events[events.length - 1].score : null;

    const justReachedHalftimeHome = (homeScore === actualHalftimeTriggerPoint) && (awayScore < actualHalftimeTriggerPoint) && (lastEventScore === 'home');
    const justReachedHalftimeAway = (awayScore === actualHalftimeTriggerPoint) && (homeScore < actualHalftimeTriggerPoint) && (lastEventScore === 'away');
    

    if ((justReachedHalftimeHome || justReachedHalftimeAway) && !hasHalftimeBeenReachedAndAlerted) {
        halftimeModal.style.display = 'block';
        hasHalftimeBeenReachedAndAlerted = true;
        if (updateHalftimeTargetBtn) updateHalftimeTargetBtn.disabled = true; // Disable after halftime is hit
        return true;
    } else {
        return false;
    }
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

    // If undoing brings score below a declared early halftime, reset that declaration
    if (effectiveHalftimePoint !== null && (homeScore + awayScore) < effectiveHalftimePoint) {
        // Only reset if the new score is also below the default halftime,
        // otherwise, the effective halftime might still be relevant if it was set higher than default.
        // For simplicity now, let's just re-enable the button if we are no longer past the effective halftime.
        if (updateHalftimeTargetBtn) updateHalftimeTargetBtn.disabled = false;
        // We might not want to nullify effectiveHalftimePoint automatically,
        // as the user might have set it for a reason. Let them change it again if needed.
        // effectiveHalftimePoint = null; // Optional: uncomment to fully reset
    }
    // If undoing means halftime is no longer reached
    const actualHalftimeTriggerPoint = effectiveHalftimePoint !== null ? effectiveHalftimePoint : Math.ceil(gameTo / 2);
    if (homeScore < actualHalftimeTriggerPoint && awayScore < actualHalftimeTriggerPoint && hasHalftimeBeenReachedAndAlerted) {
        hasHalftimeBeenReachedAndAlerted = false;
        if (updateHalftimeTargetBtn) updateHalftimeTargetBtn.disabled = false; // Re-enable if not past halftime
    }
    triggerAutosave(); // Autosave after undo
    clearPointSetup(); // Clear line and players as context has changed
}

/**
 * Updates the display of game events in the UI.
 */
function updateEventsDisplay() {
    // Clear previous event rows, but keep the header
    const eventRows = eventsContainerElement.querySelectorAll('.event-row:not(.event-header)');
    eventRows.forEach(row => row.remove());

    // Iterate through events and create a row for each
    // Iterate backwards to display newest events at the top
    for (let i = events.length - 1; i >= 0; i--) { 
        const event = events[i];
        const eventRow = document.createElement('div');
        eventRow.classList.add('event-row');
        eventRow.classList.add(event.score === 'home' ? 'home-score' : 'away-score'); // Add score class for styling

        eventRow.innerHTML = `
            <div class="event-col">${i + 1}</div>
            <div class="event-col">${event.line}</div>
            <div class="event-col">${event.ratio}</div>
            <div class="event-col">${event.possession}</div>
            <div class="event-col">${event.score === 'home' ? 'Star' : opponentName || 'Away'}</div>
        `;

        // Insert the new row after the header row
        eventsContainerElement.insertBefore(eventRow, eventsContainerElement.children[1]);
    }
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
        effectiveHalftimePoint: effectiveHalftimePoint,
        // hasHalftimeBeenReachedAndAlerted is a UI state, not typically saved with game core data
    };

    const success = saveGame(tournamentId, gameData); // From data-manager.js

    if (success) {
        alert('Game saved successfully!');
        if (currentGameId) { // Clear autosave only if there was a game ID
            localStorage.removeItem(`autosave_game_${currentGameId}`);
        }
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
        if (currentGameId) localStorage.removeItem(`autosave_game_${currentGameId}`); // Clean up if navigating back from a new game setup
        window.location.href = `games-list.html?tournamentId=${tournamentId}`;
        return;
    }
    if (confirm("Leave the current game? Any unsaved changes will be lost.")) {
        // User confirmed to leave, so clear the temporary autosave for this game
        if (currentGameId) {
            localStorage.removeItem(`autosave_game_${currentGameId}`);
            console.log(`Autosave for game ${currentGameId} cleared on back navigation.`);
        }
        window.location.href = `games-list.html?tournamentId=${tournamentId}`;
    }
}

/**
 * Handles the "Update Halftime Target" button click.
 */
function handleUpdateHalftimeTarget() {
    if (!isGameStarted) {
        alert("Please start the game first.");
        return;
    }
    const defaultHalftime = Math.ceil(gameTo / 2);
    const currentTargetDisplay = effectiveHalftimePoint !== null ? effectiveHalftimePoint : defaultHalftime;
    const highestScore = Math.max(homeScore, awayScore);
    const minHalftime = Math.max(highestScore, 1);

    const newTargetStr = prompt(
        `The current halftime trigger point is ${currentTargetDisplay} (default based on 'Game To' is ${defaultHalftime}).\n` +
        `Enter new halftime target point (must be between ${minHalftime} and ${defaultHalftime}).\n` +
        "Caution: This should only be done for time-capped games where halftime occurs earlier than normal."
    );
    

    if (newTargetStr !== null) { // User didn't cancel
        const newTarget = parseInt(newTargetStr);
        if (!isNaN(newTarget) && (newTarget > 0) && (newTarget <= defaultHalftime) && (newTarget >= minHalftime)) {
            effectiveHalftimePoint = newTarget;
            alert(`Halftime target updated to ${effectiveHalftimePoint} points.`);
            updateUI(); // To potentially re-enable/disable the button based on new target
            updateAllCalculatedStatus(); // Re-evaluate possession and other statuses
            triggerAutosave(); // Autosave after updating halftime target
        } else {
            alert(`Invalid input. Please enter a valid number between ${minHalftime} and ${defaultHalftime}.`);
        }
    }
}

// --- Autosave Logic ---
/**
 * Triggers a debounced autosave to a temporary localStorage item.
 */
function triggerAutosave() {
    if (!isGameStarted || !currentGameId) {
        // console.log("Autosave skipped: Game not started or no currentGameId.");
        return; 
    }

    if (autosaveTimeoutId) {
        clearTimeout(autosaveTimeoutId);
    }
    autosaveTimeoutId = setTimeout(() => {
        const gameDataForAutosave = {
            id: currentGameId,
            opponentName,
            homeScore,
            awayScore,
            lineOCount,
            lineDCount,
            lineXCount,
            lineKCount,
            events: [...events],
            startingRatio, // Game setting
            gameTo,        // Game setting
            startOn,       // Game setting
            effectiveHalftimePoint,
            // Note: hasHalftimeBeenReachedAndAlerted is UI state, not part of core game data for autosave
            // currentPointPlayers and lineForCurrentPoint are transient for point setup, not part of game state to save
            lastAutosaveTimestamp: new Date().toISOString() // For potential future comparison
        };
        try {
            localStorage.setItem(`autosave_game_${currentGameId}`, JSON.stringify(gameDataForAutosave));
            console.log(`Game ${currentGameId} autosaved to temporary storage.`);
        } catch (e) {
            console.error("Error during autosave:", e);
            // Potentially alert user if localStorage is full
        }
    }, 1500); // Autosave 1.5 seconds after the last relevant action
}

// --- Player Selection Logic ---

/**
 * Updates the visual state of the 'Select Line & Players' button
 * based on whether a line is currently set for the point.
 */
function updateSelectLinePlayersButtonState() {
    if (!selectLinePlayersBtn) return; // Guard clause

    if (lineForCurrentPoint) {
        // Line is selected and confirmed
        selectLinePlayersBtn.classList.add('select-line-confirmed');
        selectLinePlayersBtn.classList.remove('select-line-attention');
    } else {
        // No line selected, needs attention
        selectLinePlayersBtn.classList.add('select-line-attention');
        selectLinePlayersBtn.classList.remove('select-line-confirmed');
    }
}

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
                // lineForCurrentPoint = defaultLine; // Don't set lineForCurrentPoint yet, just default in modal

                const lineRadioToSelect = document.getElementById(`modalLine${defaultLine}`);
                if (lineRadioToSelect) {
                    lineRadioToSelect.checked = true;
                    modalSelectedLineDisplayElement.textContent = defaultLine;
                    modalPlayerSelectionArea.style.display = 'block';
                    populatePlayerCheckboxes(defaultLine); // Populate for the defaulted line
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
    modalRequiredRatioInfoElement.textContent = `${requiredM} M-match, ${requiredW} W-match`;

    playerListContainerElement.innerHTML = '';
    const gamePlayerPoints = calculatePlayerPointsInCurrentGame();

    const allPlayers = getPlayers(); // From data-manager.js
    if (!allPlayers || allPlayers.length === 0) {
        playerListContainerElement.innerHTML = "<p>No players available in the team roster.</p>";
        return;
    }

    // Sort players: those matching the line type first, then by name
    const sortedPlayers = [...allPlayers].sort((a, b) => {
        const pointsA = gamePlayerPoints.get(a.id) || 0;
        const pointsB = gamePlayerPoints.get(b.id) || 0;
        if (pointsA !== pointsB) return pointsA - pointsB;
        return (a.nickname || (a.lastName + a.firstName)).localeCompare(b.nickname || (b.lastName + b.firstName));
    });

    const linePlayersSection = document.createElement('div');
    linePlayersSection.innerHTML = `<h4>${lineSelectedInModal} Line Players (Available)</h4><ul id="modalLineSpecificPlayers"></ul>`;
    playerListContainerElement.appendChild(linePlayersSection);
    const lineSpecificPlayersUl = document.getElementById('modalLineSpecificPlayers');

    const otherPlayersSection = document.createElement('div');
    otherPlayersSection.innerHTML = `<h4>Other Players (Available)</h4><div id="modalOtherPlayers"></div>`;
    playerListContainerElement.appendChild(otherPlayersSection);
    const otherPlayersUl = document.getElementById('modalOtherPlayers');

    
    sortedPlayers.forEach(player => {
        const div = document.createElement('div');
        div.classList.add('player-item-container'); // Add a class for styling
        div.classList.add('player-item-container-hide');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `player-${player.id}`;
        checkbox.value = player.id;
        checkbox.dataset.gender = player.genderMatch; // Store gender for validation
        // Pre-check if this player was part of currentPointPlayers AND if the modal is being opened for the current line
        if (lineForCurrentPoint === lineSelectedInModal && currentPointPlayers.some(p => p.id === player.id)) {
            checkbox.checked = true;
        }
        checkbox.addEventListener('change', (event) => updateModalPlayerCounts(event.target)); // Pass the triggering checkbox

        const pointsPlayedInGame = gamePlayerPoints.get(player.id) || 0;
        const isDesignatedLinePlayer = player.line === lineSelectedInModal;

        const label = document.createElement('label');
        label.htmlFor = `player-${player.id}`;
        label.textContent = `${player.nickname} (${pointsPlayedInGame})`;

        div.appendChild(checkbox);
        div.appendChild(label);
        if (isDesignatedLinePlayer) {
            lineSpecificPlayersUl.appendChild(div);
        } else {
            otherPlayersUl.appendChild(div);
        }
    });

    if (lineSpecificPlayersUl.children.length === 0) lineSpecificPlayersUl.innerHTML = "<li>No players specifically designated for this line.</li>";
    if (otherPlayersUl.children.length === 0) otherPlayersUl.innerHTML = "<li>No other players available.</li>";
    updateModalPlayerCounts(); // Update counts after populating/checking
}

/**
 * Handles the click of the "Reset Selections" button within the player selection modal.
 * Clears selected line in modal, hides player selection area, and clears player checkboxes.
 */
function handleResetModalSelections() {
    // Uncheck all line radio buttons in the modal
    modalCurrentLineInputs.forEach(input => input.checked = false);
    // Clear the display of the selected line in the modal
    modalSelectedLineDisplayElement.textContent = '';
    // Hide the player selection area
    modalPlayerSelectionArea.style.display = 'none';
    // Clear any player checkboxes that might have been populated
    playerListContainerElement.innerHTML = '';
    // Reset the player counts in the modal
    updateModalPlayerCounts(); // This will set counts to 0 as no checkboxes are present/checked
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
function updateModalPlayerCounts(triggeringCheckbox = null) {
    const selectedCheckboxes = Array.from(playerListContainerElement.querySelectorAll('input[type="checkbox"]:checked'));
    const gamePlayerPoints = calculatePlayerPointsInCurrentGame();
    let mCount = 0;
    let wCount = 0;
    modalSelectedPlayersElement.innerHTML = ''; // Clear and rebuild the "Selected for this Point" list
    selectedCheckboxes.forEach(cb => {
        const player = getPlayerById(cb.value)
        if (cb.dataset.gender === RATIO_TYPES.MALE) mCount++;
        if (cb.dataset.gender === RATIO_TYPES.FEMALE) wCount++;

        const div = document.createElement('div');
        div.classList.add('player-item-container'); // Add a class for styling
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `${cb.id}-selected`;
        checkbox.value = player.id;
        checkbox.dataset.gender = player.genderMatch;
        checkbox.checked = true;
        checkbox.addEventListener('change', unselectPlayer)

        const pointsPlayedInGame = gamePlayerPoints.get(player.id) || 0;
        const label = document.createElement('label');
        label.htmlFor = `${cb.id}-selected`;
        label.textContent = `${player.nickname} (${pointsPlayedInGame})`;

        div.appendChild(checkbox)
        div.appendChild(label)
        modalSelectedPlayersElement.appendChild(div);
    });

    // --- Real-time Validation ---
    const requiredM = currentRatio === RATIO_TYPES.MALE ? 4 : 3;
    const requiredW = currentRatio === RATIO_TYPES.FEMALE ? 4 : 3;

    let validationError = null;
    if (selectedCheckboxes.length > 7) {
        validationError = "Cannot select more than 7 players.";
    } else if (mCount > requiredM) {
        validationError = `Cannot select more than ${requiredM} M-match players for ratio ${currentRatio}.`;
    } else if (wCount > requiredW) {
        validationError = `Cannot select more than ${requiredW} W-match players for ratio ${currentRatio}.`;
    }

    if (validationError && triggeringCheckbox) {
        // If there's a validation error and we know which checkbox triggered it,
        // uncheck the triggering checkbox and alert the user.
        triggeringCheckbox.checked = false;
        alert(validationError);

        // Recursively call updateModalPlayerCounts to update the display
        // based on the corrected set of checked boxes.
        // Pass null for triggeringCheckbox to avoid infinite loop if validation
        // somehow still fails after unchecking.
        updateModalPlayerCounts(null);
        return; // Stop further updates in this call
    }
    // --- End Real-time Validation ---

    // Update counts display if no validation error occurred
    modalPlayerCountElement.textContent = `${selectedCheckboxes.length}`;


    modalSelectedMCountElement.textContent = mCount;
    modalSelectedWCountElement.textContent = wCount;
    if (selectedCheckboxes.length === 0) modalSelectedPlayersElement.innerHTML = "<li>No players selected yet.</li>";
 }

 /**
  * when a selected player is unselected within modalSelectedPlayersElement, 
  * this unchecks the related checkbox from the other sections and triggers updateModalPlayerCounts
  */
 function unselectPlayer() {
    const id = this.value;
    const checkbox = document.getElementById(`player-${id}`);
    // should always be true
    if (checkbox) {
        checkbox.checked = false;
        checkbox.dispatchEvent(new Event('change'));
    }
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
    updateSelectLinePlayersButtonState();
    displaySelectedLineForPointElement.textContent = lineForCurrentPoint || 'None';
    playerSelectionModal.style.display = 'none';
}

/**
 * Updates the display of selected players on the main game control page.
 */
function updateSelectedPlayersDisplay() {
    // selectedPlayersListElement.innerHTML = '';
    // if (currentPointPlayers.length === 0) {
    //     selectedPlayersListElement.innerHTML = '<div>No players selected for this point.</div>';
    //     return;
    // }
    // currentPointPlayers.forEach(player => {
    //     const li = document.createElement('div');
    //     li.textContent = `${player.nickname || (player.nickname)} (${player.genderMatch})`;
    //     selectedPlayersListElement.appendChild(li);
    // });
}

/**
 * Clears the currently selected line and players for the point and updates their display.
 */
function clearPointSetup() {
    currentPointPlayers = [];
    lineForCurrentPoint = null;
    displaySelectedLineForPointElement.textContent = 'None';
    updateSelectedPlayersDisplay();
    updateSelectLinePlayersButtonState();
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
