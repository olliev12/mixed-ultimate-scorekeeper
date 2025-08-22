// scripts/game-control.js

// Global state variables for the current game
let tournamentId = null;
let currentGameId = null; // To identify if we are editing an existing game
let tournamentLineNames = { // Default names
    O: { full: 'Offense', abbr: 'O' },
    D: { full: 'Defense', abbr: 'D' },
    X: { full: 'Xtras', abbr: 'X' },
    K: { full: 'Kill', abbr: 'K' }
};

/**
 * Formats an ISO string or Date to HH:MM for display
 */
function formatTimeForDisplay(value) {
    if (!value) return '--:--';
    const d = (value instanceof Date) ? value : new Date(value);
    if (isNaN(d.getTime())) return '--:--';
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
}

/**
 * Formats a Date into value acceptable by <input type="time"> (HH:MM)
 */
function formatInputTime(date) {
    const d = (date instanceof Date) ? date : new Date(date);
    if (isNaN(d.getTime())) return '';
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
}


let homeScore = 0;
let awayScore = 0;
let startingRatio = 'M';
let opponentName = 'Away Team';
let gameTo = 13;
let startOn = 'O';
let events = [];

// Time and status tracking
let gameStartTime = null; // used internally for cap timer base (will mirror scheduledStartTime)
let scheduledStartTime = null; // ISO or Date in memory
let actualStartTime = null; // Date when game actually started
let gameStatus = 'scheduled'; // 'scheduled' | 'inProgress' | 'final'
let caps = {
    hard: {
        duration: 0, // minutes, 0 means disabled
        time: null,  // calculated as gameStartTime + duration
        reached: false
    },
    soft: {
        duration: 0, // minutes, 0 means disabled
        time: null,  // calculated as gameStartTime + duration
        reached: false
    },
    half: {
        duration: 0, // minutes, 0 means disabled
        time: null,  // calculated as gameStartTime + duration
        reached: false
    }
};

// Notification tracking
let notifications = {
    hard: {
        fiveMinWarning: false,
        capReached: false
    },
    soft: {
        fiveMinWarning: false,
        capReached: false
    },
    half: {
        fiveMinWarning: false,
        capReached: false
    }
};

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
    selectLinePlayersBtn, displaySelectedLineForPointElement, eventsContainerElement,
    scheduledStartTimeInput, scheduledStartDateInput, gameStatusBadge, scheduledStartTimeDisplay, actualStartTimeDisplay;
let autosaveTimeoutId = null; // For debouncing autosave

// Constants
const LINE_TYPES = { OFFENSE: 'O', DEFENSE: 'D', EXTRA: 'X', KILL: 'K' };
const RATIO_TYPES = { MALE: 'M', FEMALE: 'W' };
const POSSESSION_TYPES = { OFFENSE: 'O', DEFENSE: 'D' };

let capTimeElements = {};
let capStatusElements = {};

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
    const toggleStatusButton = document.getElementById('toggleStatusButton');
    const gameStatusContent = document.getElementById('gameStatusContent');
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
    scheduledStartTimeInput = document.getElementById('scheduledStartTime');
    scheduledStartDateInput = document.getElementById('scheduledStartDate');
    gameStatusBadge = document.getElementById('gameStatusBadge');
    scheduledStartTimeDisplay = document.getElementById('scheduledStartTimeDisplay');
    actualStartTimeDisplay = document.getElementById('actualStartTimeDisplay');

    // Hide toggle button initially
    // if (toggleSettingsButton) toggleSettingsButton.style.display = 'none';


    // Parse URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    tournamentId = urlParams.get('tournamentId');
    currentGameId = urlParams.get('gameId');

    if (tournamentId === null) {
        alert("Tournament ID is missing. Redirecting...");
        window.location.href = 'tournaments.html';
        return;
    }
    tournamentId = tournamentId;

    await loadStarfireData(); // From data-manager.js
    // Try to load current tournament to apply defaults and bounds
    const currentTournament = getTournamentById(tournamentId);
    if (currentTournament && currentTournament.lineNames) {
        // Merge loaded line names, keeping defaults if specific ones are missing
        tournamentLineNames = { ...tournamentLineNames, ...currentTournament.lineNames };
    }
    // Set optional date bounds if tournament has start/end
    if (currentTournament && scheduledStartDateInput) {
        if (currentTournament.startDate) scheduledStartDateInput.min = currentTournament.startDate;
        if (currentTournament.endDate) scheduledStartDateInput.max = currentTournament.endDate;
    }

    let gameLoadedSuccessfully = false;
    if (currentGameId) {
        const autosavedGameJSON = localStorage.getItem(`autosave_game_${currentGameId}`);
        if (autosavedGameJSON) {
            console.log("Loading from autosave for game:", currentGameId);
            loadGameData(JSON.parse(autosavedGameJSON));
            gameTitleElement.textContent = `Starfire vs ${opponentName || 'Opponent'}`;
            if (gameStatus === 'inProgress') {
                startGameSetup(startGameButton, toggleSettingsButton, settingsContent);
            } else {
                // Show settings when scheduled
                document.getElementById('gameStatusPanel').style.display = 'none';
                document.querySelector('main').style.display = 'none';
                document.getElementById('eventsSection').style.display = 'none';
            }
            gameLoadedSuccessfully = true;
        } else {
            // No autosave, try loading from main data
            const mainGameData = getGameById(tournamentId, currentGameId);
            if (mainGameData) {
                console.log("Loading from main data for game:", currentGameId);
                loadGameData(mainGameData);
                gameTitleElement.textContent = `Starfire vs ${opponentName || 'Opponent'}`;
                if (gameStatus === 'inProgress') {
                    startGameSetup(startGameButton, toggleSettingsButton, settingsContent);
                }
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

    // Get all cap timer elements
    capTimeElements = {
        hard: document.getElementById('hardCapTime'),
        soft: document.getElementById('softCapTime'),
        half: document.getElementById('halfCapTime')
    };
    
    capStatusElements = {
        hard: document.getElementById('hardCapStatus'),
        soft: document.getElementById('softCapStatus'),
        half: document.getElementById('halfCapStatus')
    };

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
    // Seed from tournament defaults if present
    const currentTournament = getTournamentById(tournamentId);
    console.log(currentTournament)
    if (currentTournament) {
        gameTo = parseInt(currentTournament.defaultPointCap) || 13;
        // Cap durations defaulting
        const defHard = parseInt(currentTournament.hardCap) || 0;
        const defSoft = parseInt(currentTournament.softCap) || 0;
        const defHalf = parseInt(currentTournament.halfCap) || 0;
        // Reflect into inputs if present so UI shows seeded values
        const hardEl = document.getElementById('hardCapDuration');
        const softEl = document.getElementById('softCapDuration');
        const halfEl = document.getElementById('halfCapDuration');
        if (hardEl) hardEl.value = defHard;
        if (softEl) softEl.value = defSoft;
        if (halfEl) halfEl.value = defHalf;
    } else {
        gameTo = 13;
    }
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
    gameStatus = 'scheduled';
    scheduledStartTime = null;
    actualStartTime = null;
    
    // Get cap durations from settings or use defaults if not set yet
    const hardCapDuration = document.getElementById('hardCapDuration') ? 
        parseInt(document.getElementById('hardCapDuration').value) || 0 : 0;
    const softCapDuration = document.getElementById('softCapDuration') ? 
        parseInt(document.getElementById('softCapDuration').value) || 0 : 0;
    const halfCapDuration = document.getElementById('halfCapDuration') ? 
        parseInt(document.getElementById('halfCapDuration').value) || 0 : 0;
    
    // Initialize cap timer base from scheduledStartTime (or leave null until set)
    gameStartTime = scheduledStartTime ? new Date(scheduledStartTime) : null;
    
    // Reset cap timers with new durations
    caps.hard = {
        duration: hardCapDuration,
        time: (hardCapDuration > 0 && gameStartTime) ? new Date(gameStartTime.getTime() + hardCapDuration * 60000) : null,
        reached: false
    };
    
    caps.soft = {
        duration: softCapDuration,
        time: (softCapDuration > 0 && gameStartTime) ? new Date(gameStartTime.getTime() + softCapDuration * 60000) : null,
        reached: false
    };
    
    caps.half = {
        duration: halfCapDuration,
        time: (halfCapDuration > 0 && gameStartTime) ? new Date(gameStartTime.getTime() + halfCapDuration * 60000) : null,
        reached: false
    };
    
    // Reset notification states
    Object.keys(notifications).forEach(capType => {
        notifications[capType] = {
            fiveMinWarning: false,
            capReached: false
        };
    });
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
    
    // Backward-compat and new time/status fields
    gameStatus = gameData.gameStatus || (gameData.isGameStarted ? 'inProgress' : 'scheduled');
    scheduledStartTime = gameData.scheduledStartTime || gameData.gameStartTime || null;
    actualStartTime = gameData.actualStartTime || (gameData.isGameStarted && gameData.gameStartTime ? gameData.gameStartTime : null);

    // Load cap settings if they exist
    if (gameData.caps) {
        // Use scheduled start time for cap time calculations
        const originalStartTime = scheduledStartTime ? new Date(scheduledStartTime) : (gameData.gameStartTime ? new Date(gameData.gameStartTime) : null);
        
        Object.keys(gameData.caps).forEach(capType => {
            if (caps[capType]) {
                const capData = gameData.caps[capType];
                const duration = capData.duration || 0;
                
                // Update cap with duration, calculated time, and reached status
                caps[capType] = {
                    duration: duration,
                    time: (duration > 0 && originalStartTime) ? new Date(originalStartTime.getTime() + duration * 60000) : null,
                    reached: !!capData.reached
                };
                
                // Update the UI elements if they exist
                const durationInput = document.getElementById(`${capType}CapDuration`);
                if (durationInput) {
                    durationInput.value = duration;
                }
                // Don't overwrite the time property as it will be recalculated
            }
        });
    }
    
    // Load notification state if it exists
    if (gameData.notifications) {
        Object.keys(gameData.notifications).forEach(capType => {
            if (notifications[capType]) {
                notifications[capType] = {
                    ...notifications[capType],
                    ...gameData.notifications[capType]
                };
            }
        });
    }
    
    // Set timer base to scheduled start time
    gameStartTime = scheduledStartTime ? new Date(scheduledStartTime) : null;
    
    // Set game started state and status
    isGameStarted = gameStatus === 'inProgress';

    // Determine if halftime was already reached in the loaded game
    const actualHalftimeTriggerPoint = effectiveHalftimePoint !== null ? effectiveHalftimePoint : Math.ceil(gameTo / 2);
    if (homeScore > actualHalftimeTriggerPoint || awayScore > actualHalftimeTriggerPoint) {
        hasHalftimeBeenReachedAndAlerted = true;
    } else {
        hasHalftimeBeenReachedAndAlerted = false;
    }
    
    // lineForCurrentPoint and currentPointPlayers will be empty on load, user must set them for the next point.
    
    // Set up cap timers if the game is in progress and caps are enabled
    if (Object.values(caps).some(cap => cap.duration > 0)) {
        setupCapTimers();
    }
    
    // Request notification permission if not already granted/denied
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
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

    // Status badge and times
    if (gameStatusBadge) gameStatusBadge.textContent = gameStatus;
    if (scheduledStartTimeDisplay) scheduledStartTimeDisplay.textContent = formatTimeForDisplay(scheduledStartTime);
    if (actualStartTimeDisplay) actualStartTimeDisplay.textContent = formatTimeForDisplay(actualStartTime);
    if (scheduledStartTimeInput) {
        if (scheduledStartTime) {
            const d = new Date(scheduledStartTime);
            scheduledStartTimeInput.value = formatInputTime(d);
            if (scheduledStartDateInput) {
                const yyyy = d.getFullYear();
                const mm = String(d.getMonth() + 1).padStart(2, '0');
                const dd = String(d.getDate()).padStart(2, '0');
                scheduledStartDateInput.value = `${yyyy}-${mm}-${dd}`;
            }
        } else {
            scheduledStartTimeInput.value = '';
            if (scheduledStartDateInput) scheduledStartDateInput.value = '';
        }
    }

    // Reflect Start button visibility
    const startGameButton = document.getElementById('startGame');
    if (startGameButton) startGameButton.style.display = gameStatus === 'scheduled' ? 'inline-block' : 'none';
    if (scheduledStartTimeInput) scheduledStartTimeInput.disabled = gameStatus !== 'scheduled';
    if (scheduledStartDateInput) scheduledStartDateInput.disabled = gameStatus !== 'scheduled';
    // Cap inputs enabled only while scheduled (before game starts)
    const hardEl = document.getElementById('hardCapDuration');
    const softEl = document.getElementById('softCapDuration');
    const halfEl = document.getElementById('halfCapDuration');
    if (hardEl) hardEl.disabled = gameStatus !== 'scheduled';
    if (softEl) softEl.disabled = gameStatus !== 'scheduled';
    if (halfEl) halfEl.disabled = gameStatus !== 'scheduled';

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

    displaySelectedLineForPointElement.textContent = tournamentLineNames[lineForCurrentPoint]?.full || 'None';
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
    // Disable cap duration inputs as part of settings
    const hardEl = document.getElementById('hardCapDuration');
    const softEl = document.getElementById('softCapDuration');
    const halfEl = document.getElementById('halfCapDuration');
    if (hardEl) hardEl.disabled = true;
    if (softEl) softEl.disabled = true;
    if (halfEl) halfEl.disabled = true;
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
    const toggleStatusButton = document.getElementById('toggleStatusButton');
    const gameStatusContent = document.getElementById('gameStatusContent');

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
            // Warn if scheduled time is in the future
            const now = new Date();
            const sched = scheduledStartTime ? new Date(scheduledStartTime) : null;
            let proceed = true;
            if (sched && sched > now) {
                proceed = confirm("Scheduled start time is in the future. Start now anyway?");
            }
            if (!sched) {
                // If none set, default to now as scheduled
                scheduledStartTime = now.toISOString();
                if (scheduledStartTimeInput) scheduledStartTimeInput.value = formatInputTime(now);
            }
            if (proceed && confirm("Start the game? Settings will lock (except halftime target).")) {
                startGameSetup(startGameButton, toggleSettingsButton, settingsContent);
            }
        });
    }

    if (toggleSettingsButton) {
        toggleSettingsButton.addEventListener('click', () => {
            const isCollapsed = settingsContent.classList.toggle('collapsed');
            toggleSettingsButton.textContent = isCollapsed ? 'v' : '>';
        });
    }

    if (toggleStatusButton) {
        toggleStatusButton.addEventListener('click', () => {
            const isCollapsed = gameStatusContent.classList.toggle('collapsed');
            toggleStatusButton.textContent = isCollapsed ? 'v' : '>';
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
            modalSelectedLineDisplayElement.textContent = tournamentLineNames[selectedLineInModal]?.full || selectedLineInModal;
            modalPlayerSelectionArea.style.display = 'block'; // Show player selection area
            populatePlayerCheckboxes(selectedLineInModal); // Populate players for this line
        });
    });

    if (closePlayerModalBtn) {
        closePlayerModalBtn.addEventListener('click', closePlayerSelectionModal);
    }
    if (resetModalSelectionsBtn) {
        resetModalSelectionsBtn.addEventListener('click', handleResetModalSelections);
    }

    if (confirmPlayersBtn) {
        confirmPlayersBtn.addEventListener('click', handlePlayerSelectionConfirm);
    }
    window.addEventListener('click', (event) => { // Close modal if clicked outside
        if (event.target === playerSelectionModal) closePlayerSelectionModal();
    });

    if (updateHalftimeTargetBtn) {
        updateHalftimeTargetBtn.addEventListener('click', handleUpdateHalftimeTarget);
    }

    if (closeHalftimeModalBtn) {
        closeHalftimeModalBtn.addEventListener('click', () => halftimeModal.style.display = 'none');
    }

    // Cap configuration inputs
    const capDurationInputs = [
        'hardCapDuration',
        'softCapDuration',
        'halfCapDuration'
    ];
    
    capDurationInputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            input.addEventListener('change', () => {
                // Map input IDs to caps keys: hard, soft, half
                let capKey = null;
                if (inputId.startsWith('hardCap')) capKey = 'hard';
                else if (inputId.startsWith('softCap')) capKey = 'soft';
                else if (inputId.startsWith('halfCap')) capKey = 'half';

                const duration = parseInt(input.value) || 0;

                if (capKey && caps[capKey]) {
                    caps[capKey].duration = duration;

                    // Recalculate the cap time based on current scheduled/game start
                    if (gameStartTime && duration > 0) {
                        caps[capKey].time = new Date(gameStartTime.getTime() + duration * 60000);
                        caps[capKey].reached = false;

                        // Reset notification states
                        if (notifications[capKey]) {
                            notifications[capKey].fiveMinWarning = false;
                            notifications[capKey].capReached = false;
                        }

                        // Ensure cap timers are running
                        if (!window['capInterval']) {
                            setupCapTimers();
                        }
                    } else {
                        caps[capKey].time = null;
                        caps[capKey].reached = false;
                    }

                    // Update the UI
                    updateCapStatusUI();
                }
            });
        }
    });

    // Scheduled start time input
    const recomputeCapsAfterScheduleChange = () => {
        // Recompute cap times based on new schedule
        Object.keys(caps).forEach(capType => {
            const d = caps[capType].duration || 0;
            caps[capType].time = (d > 0 && gameStartTime) ? new Date(gameStartTime.getTime() + d * 60000) : null;
            caps[capType].reached = false;
            if (notifications[capType]) {
                notifications[capType].fiveMinWarning = false;
                notifications[capType].capReached = false;
            }
        });
        if (Object.values(caps).some(c => c.duration > 0)) setupCapTimers();
        updateUI();
    };

    const getSelectedDateParts = () => {
        // Returns {year, monthIndex, day} from date input or today if missing
        if (scheduledStartDateInput && scheduledStartDateInput.value) {
            const [y, m, d] = scheduledStartDateInput.value.split('-').map(v => parseInt(v));
            return { year: y, monthIndex: m - 1, day: d };
        }
        const today = new Date();
        return { year: today.getFullYear(), monthIndex: today.getMonth(), day: today.getDate() };
    };

    const updateScheduledStartFromInputs = () => {
        if (gameStatus !== 'scheduled') return;
        const timeVal = scheduledStartTimeInput ? scheduledStartTimeInput.value : '';
        if (!timeVal) {
            scheduledStartTime = null;
            gameStartTime = null;
            recomputeCapsAfterScheduleChange();
            return;
        }
        const [hh, mm] = timeVal.split(':').map(n => parseInt(n));
        const { year, monthIndex, day } = getSelectedDateParts();
        // Enforce bounds if date input has min/max
        if (scheduledStartDateInput && scheduledStartDateInput.value) {
            const picked = scheduledStartDateInput.value;
            const min = scheduledStartDateInput.min || null;
            const max = scheduledStartDateInput.max || null;
            if ((min && picked < min) || (max && picked > max)) {
                alert('Selected date is outside tournament dates. Adjusting to allowed range.');
                if (min && picked < min) scheduledStartDateInput.value = min;
                if (max && picked > max) scheduledStartDateInput.value = max;
            }
        }
        const adj = getSelectedDateParts();
        const sched = new Date(year, monthIndex, day, hh, mm, 0, 0);
        scheduledStartTime = sched.toISOString();
        gameStartTime = new Date(sched);
        recomputeCapsAfterScheduleChange();
    };

    if (scheduledStartTimeInput) {
        scheduledStartTimeInput.addEventListener('change', updateScheduledStartFromInputs);
    }
    if (scheduledStartDateInput) {
        scheduledStartDateInput.addEventListener('change', updateScheduledStartFromInputs);
    }
}

/**
 * Sets up the UI and state when the game starts or is loaded.
 * Disables settings, shows game sections, and hides the start button.
 * @param {HTMLElement} startGameButton - The start game button element.
 * @param {HTMLElement} toggleSettingsButton - The toggle settings button element.
 * @param {HTMLElement} settingsContent - The settings content div element.
 */
async function startGameSetup(startGameButton, toggleSettingsButton, settingsContent) {
    console.log('startGameSetup called');
    // Disable settings
    disableSettings();

    // Show game sections
    document.getElementById('gameStatusPanel').style.display = 'block';
    document.querySelector('main').style.display = 'block';
    document.getElementById('eventsSection').style.display = 'block';
    
    // Mark game as started and set status/times
    isGameStarted = true;
    gameStatus = 'inProgress';
    const now = new Date();
    if (!scheduledStartTime) {
        scheduledStartTime = now.toISOString();
    }
    if (!actualStartTime) {
        actualStartTime = now.toISOString();
    }
    // Cap timers base from scheduled start
    gameStartTime = new Date(scheduledStartTime);
    
    // Request notification permission when game starts
    if ('Notification' in window && Notification.permission === 'default') {
        await Notification.requestPermission();
    }
    
    // Set up cap timers if any caps are enabled
    if (Object.values(caps).some(cap => cap.duration > 0)) {
        setupCapTimers();
    }
    // Ensure ratio/possession are initialized for in-progress state
    updateAllCalculatedStatus();
    updateUI();
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
            <div class="event-col">${tournamentLineNames[event.line]?.abbr || event.line}</div>
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


    // Prepare cap timers data for saving
    const capsToSave = {};
    Object.keys(caps).forEach(capType => {
        // Only save duration and reached status, not the actual timers
        capsToSave[capType] = {
            duration: caps[capType].duration,
            reached: caps[capType].reached || false
        };
    });

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
        
        // Cap-related state
        // Keep legacy field for backward compat
        gameStartTime: gameStartTime ? gameStartTime.toISOString() : (scheduledStartTime || null),
        caps: capsToSave, // Only save necessary cap data
        notifications: JSON.parse(JSON.stringify(notifications)), // Save notification state
        
        // Game state flags
        isGameStarted: isGameStarted,
        // New status/time fields
        gameStatus: gameStatus,
        scheduledStartTime: scheduledStartTime,
        actualStartTime: actualStartTime,
        
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
    console.log('handleBack called');
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
            gameStatus,
            scheduledStartTime,
            actualStartTime,
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


// // Initialize cap timer DOM elements
// document.addEventListener('DOMContentLoaded', () => {
    
    
//     attachEventListeners();
// });

// function attachEventListeners() {
//     // Existing event listeners...
    
    
// }


/**
 * Sets up the cap timers when the game starts
 */
function setupCapTimers() {
    if (!gameStartTime) {
        gameStartTime = new Date();
    }
    
    // Clear any existing intervals to prevent duplicates
    if (window['capInterval']) {
        clearInterval(window.capInterval);
    }
    
    // Set up the interval to update cap timers every second
    window['capInterval'] = setInterval(updateCapTimers, 1000);
    
    // Initial update
    updateCapTimers();
}

/**
 * Updates the cap timers
 */
function updateCapTimers() {
    if (!gameStartTime) return;
    
    Object.keys(caps).forEach(capType => {
        const cap = caps[capType];
        const capTime = cap.time;
        const capElement = document.getElementById(`${capType}CapTimer`);
        
        if (!capTime || cap.reached) {
            // capTimeElements[capType].textContent = '--:--';
            capStatusElements[capType].textContent = cap.reached ? 'Reached' : 'Not Set';
            if (capElement) {
                capElement.classList.toggle('reached', cap.reached);
            }
            return;
        }
        
        const now = new Date();
        const timeUntilCap = capTime - now;
        const fiveMinutesInMs = 5 * 60 * 1000;
        
        // Update timer display
        if (timeUntilCap > 0) {
            const minutes = Math.floor(timeUntilCap / (60 * 1000));
            const seconds = Math.floor((timeUntilCap % (60 * 1000)) / 1000);
            capTimeElements[capType].textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            
            // Check for 5-minute warning
            if (timeUntilCap <= fiveMinutesInMs && !notifications[capType].fiveMinWarning) {
                showCapWarning(capType);

            }
            
            // Update UI classes
            if (capElement) {
                capElement.classList.toggle('warning', timeUntilCap <= fiveMinutesInMs);
                capElement.classList.remove('reached');
            }
            
            // Update status text
            if (timeUntilCap <= fiveMinutesInMs) {
                capStatusElements[capType].textContent = 'Ending Soon';
            } else {
                capStatusElements[capType].textContent = 'In Progress';
            }
        } else {
            // Cap has been reached
            capTimeElements[capType].textContent = '00:00';
            capStatusElements[capType].textContent = 'Reached';
            cap.reached = true;
            
            if (capElement) {
                capElement.classList.add('reached');
                capElement.classList.remove('warning');
            }
            
            // Show notification if not already done
            if (!notifications[capType].capReached) {
                handleCapReached(capType);
            }
        }
        });
    }


/**
 * Shows a warning notification before a cap is reached
 * @param {string} capType - The type of cap ('hard', 'soft', or 'half')
 */
function showCapWarning(capType) {
    if (notifications[capType]?.fiveMinWarning) return; // Already shown
    notifications[capType].fiveMinWarning = true;
    const capName = capType.charAt(0).toUpperCase() + capType.slice(1) + ' Cap';
    const notificationMessage = `${capName} will be reached in 5 minutes!`;
    
    // Show browser notification if enabled
    if (Notification.permission === 'granted') {
        new Notification(`${capName} Warning`, {
            body: notificationMessage,
            icon: 'favicon.ico',
            requireInteraction: true
        });
    }
    
    // Show in-app notification with sound
    showNotification(notificationMessage, 'warning');
    // playSound('warning');

    // Flash the cap timer
    // const capElement = document.getElementById(`${capType}CapTimer`);
    // if (capElement) {
    //     capElement.classList.add('flash-warning');
    // }
}

/**
 * Handles when a cap is reached
 * @param {string} capType - The type of cap ('hard', 'soft', or 'half')
 */
function handleCapReached(capType) {
    if (notifications[capType]?.capReached) return; // Already handled
    notifications[capType].capReached = true;
    const capName = capType.charAt(0).toUpperCase() + capType.slice(1) + ' Cap';
    const notificationMessage = `${capName} has been reached!`;
    
    // Show browser notification if enabled
    if (Notification.permission === 'granted') {
        new Notification(`${capName} Reached`, {
            body: notificationMessage,
            icon: 'favicon.ico',
            requireInteraction: true
        });
    }
    
    // Show in-app notification with sound
    showNotification(notificationMessage, 'error');
    // playSound('alert');
    
    // Remove flash alert if still present
    // capElement.classList.remove('flash-alert');
    
    // TODO Handle different cap types
    switch (capType) {
        case 'hard':
            // Game ends at the end of the current point, unless there is a tie
            showNotification('Game will end after this point!', 'error');
            break;
        case 'soft':
            // Finish the current point, then add one more point to the higher score and update the gameTo
            showNotification('Soft cap in effect - finish current point, then play one more point', 'warning');
            break;
        case 'half':
            // Finish the current point, then add one more point to the higher score and update the halftimeTarget
            showNotification('Half time!', 'info');
            // You might want to add logic to handle halftime here
            break;
    }
}

/**
 * Shows a notification to the user
 * @param {string} message - The message to display
 * @param {string} type - The type of notification ('info', 'warning', 'error')
 */
function showNotification(message, type = 'info') {
    // Check if notifications are supported
    if (!('Notification' in window)) {
        // Fallback to alert if notifications aren't supported
        alert(message);
        return;
    }
    
    // Request permission if needed
    if (Notification.permission === 'granted') {
        new Notification(message);
    } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                new Notification(message);
            } else {
                alert(message); // Fallback to alert if permission denied
            }
        });
    } else {
        alert(message); // Fallback to alert if permission denied
    }
    
    // Also update the UI with the notification
    updateCapStatusUI();
}

/**
 * Updates the UI to reflect the current cap status
 */
function updateCapStatusUI() {
    // This will be implemented when we add the UI elements
    // For now, we'll just log to console
    console.log('Cap status updated:', { caps, notifications });
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
 * Closes the player selection modal and resets the scroll position of the player list.
 */
function closePlayerSelectionModal() {
    // Reset scroll position of the player list container
    if (playerListContainerElement) {
        playerListContainerElement.scrollTop = 0;
    }
    if (playerSelectionModal) {
        // Remove show class to trigger fade-out, then hide after transition
        playerSelectionModal.classList.remove('show');
        setTimeout(() => {
            playerSelectionModal.style.display = 'none';
        }, 300); // match CSS transition duration
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
            modalSelectedLineDisplayElement.textContent = tournamentLineNames[lineForCurrentPoint]?.full || lineForCurrentPoint;
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
                    modalSelectedLineDisplayElement.textContent = tournamentLineNames[defaultLine]?.full || defaultLine;
                    modalPlayerSelectionArea.style.display = 'block';
                    populatePlayerCheckboxes(defaultLine); // Populate for the defaulted line
                }
            }
        }
    }
    // Show modal with transition similar to tournament modal
    playerSelectionModal.style.display = 'block';
    void playerSelectionModal.offsetWidth; // force reflow
    playerSelectionModal.classList.add('show');
}

/**
 * Populates the player checkboxes in the modal based on the selected line.
 * @param {string} lineSelectedInModal - The line (O,D,X,K) selected within the modal.
 */
function populatePlayerCheckboxes(lineSelectedInModal) {
    const requiredM = currentRatio === RATIO_TYPES.MALE ? 4 : 3;
    const requiredW = currentRatio === RATIO_TYPES.FEMALE ? 4 : 3;
    modalRequiredRatioInfoElement.textContent = `${requiredM} DoM, ${requiredW} DoW`;

    playerListContainerElement.innerHTML = '';
    const gamePlayerPoints = calculatePlayerPointsInCurrentGame();

    const allPlayers = getAllTournamentPlayers(); // From data-manager.js
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
    linePlayersSection.innerHTML = `<h4>${tournamentLineNames[lineSelectedInModal]?.full || lineSelectedInModal} Line Players (Available)</h4><ul id="modalLineSpecificPlayers"></ul>`;
    playerListContainerElement.appendChild(linePlayersSection);
    const lineSpecificPlayersUl = document.getElementById('modalLineSpecificPlayers');

    const otherPlayersSection = document.createElement('div');
    otherPlayersSection.classList.add('other-players-section');
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

function getAllTournamentPlayers() {
    const allPlayers = getPlayers(); // From data-manager.js
    const currentTournament = getTournamentById(tournamentId);
    const tournamentPlayers = currentTournament.players || allPlayers;
    return tournamentPlayers;
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
        validationError = `Cannot select more than ${requiredM} DoM players for ratio ${currentRatio}.`;
    } else if (wCount > requiredW) {
        validationError = `Cannot select more than ${requiredW} DoW players for ratio ${currentRatio}.`;
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

    // Scroll to the confirm button when exactly 7 players are selected
    if (selectedCheckboxes.length === 7) {
        if (confirmPlayersBtn) {
            confirmPlayersBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            confirmPlayersBtn.focus({ preventScroll: true }); // Focus for accessibility without a second scroll
        }
    }
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
        alert("Please select a line.");
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
        alert(`Gender ratio incorrect. Need ${requiredM} DoM and ${requiredW} DoW for ratio ${currentRatio}. You selected ${mCount}DoM, ${wCount}DoW.`);
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
    displaySelectedLineForPointElement.textContent = tournamentLineNames[lineForCurrentPoint]?.full || 'None';
    closePlayerSelectionModal();
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
