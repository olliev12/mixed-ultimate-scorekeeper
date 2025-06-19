const STARFIRE_DATA_KEY = 'starfireAppData';
let appData = null;

/**
 * Generates a simple universally unique identifier (UUID v4).
 * @returns {string} A new UUID.
 */
function generateUUID() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}


async function loadStarfireData() {
    if (appData) return appData; // Return cached data if already loaded

    const localData = localStorage.getItem(STARFIRE_DATA_KEY);
    if (localData) {
        console.log("Loading data from localStorage");
        appData = JSON.parse(localData);
        return appData;
    } else {
        try {
            console.log("Fetching initial data from data/starfire.json");
            const response = await fetch('starfire.json'); // Adjusted path
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            appData = await response.json();
            saveStarfireData(appData); // Save initial data to localStorage
            return appData;
        } catch (error) {
            console.error("Could not load initial data from starfire.json:", error);
            // Initialize with a default structure if fetch fails
            appData = { name: "Starfire", players: [], tournaments: [] };
            saveStarfireData(appData);
            return appData;
        }
    }
}

function saveStarfireData(dataToSave = appData) {
    if (!dataToSave) {
        console.error("No data provided to saveStarfireData");
        return;
    }
    localStorage.setItem(STARFIRE_DATA_KEY, JSON.stringify(dataToSave));
    appData = dataToSave; // Update in-memory cache
    console.log("Data saved to localStorage");
}

function getTournaments() {
    return appData?.tournaments || [];
}

/**
 * Retrieves a specific player by their ID.
 * @param {string} playerId - The ID of the player to retrieve.
 * @returns {object|undefined} The player object if found, otherwise undefined.
 */
function getPlayerById(playerId) {
    const players = getPlayers();
    return players.find(player => player.id === playerId);
}

function getTournamentById(tournamentId) {
    // Assuming tournamentId is the index for now
    return appData?.tournaments?.[tournamentId];
}

function getPlayers() {
    return appData?.players || [];
}

function addPlayer(playerData) {
    if (!appData) {
        console.error("App data not loaded. Cannot add player.");
        return null;
    }
    const newPlayer = { id: generateUUID(), ...playerData };
    appData.players.push(newPlayer);
    saveStarfireData();
    return newPlayer;
}

function deletePlayer(playerId) {
    // Assuming tournamentId is the index for now
    return appData?.tournaments?.[tournamentId];
}

function addTournament(tournamentName) {
    if (!appData) {
        console.error("App data not loaded. Cannot add tournament.");
        return null;
    }
    const newTournament = {
        name: tournamentName,
        location: "", // Or prompt for more details
        id: generateUUID(), // Give tournaments IDs too for future robustness
        games: [],
        // id: generateUUID() // Consider adding unique IDs later
    };
    appData.tournaments.push(newTournament);
    saveStarfireData();
    return newTournament;
}

function getGames(tournamentId) {
    const tournament = getTournamentById(tournamentId);
    return tournament?.games || [];
}

/**
 * Retrieves a specific game by its ID from a given tournament.
 * @param {number|string} tournamentId - The ID or index of the tournament.
 * @param {string} gameId - The ID of the game to retrieve.
 * @returns {object|undefined} The game object if found, otherwise undefined.
 */
function getGameById(tournamentId, gameId) {
    const games = getGames(tournamentId);
    return games.find(game => game.id === gameId);
}

function saveGame(tournamentId, gameData) {
    if (!appData || !appData.tournaments || !appData.tournaments[tournamentId]) {
        console.error("Tournament not found or data not loaded. Cannot save game.");
        return false;
    }

    if (!gameData.id) {
        gameData.id = generateUUID(); // Assign a new ID if it's a new game
    }

    const tournament = appData.tournaments[tournamentId];
    const gameIndex = tournament.games.findIndex(g => g.id === gameData.id);

    if (gameIndex > -1) {
        // Update existing game
        tournament.games[gameIndex] = gameData;
    } else {
        // Add new game
        tournament.games.push(gameData);
    }
    saveStarfireData();
    return true;
}

function exportData() {
    if (!appData) {
        alert("No data loaded to export.");
        return;
    }
    const jsonData = JSON.stringify(appData, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'starfire_data.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Placeholder for import - will need file reader logic
async function importDataFromFile(file) {
    // This will be similar to your existing importGames logic
    // but will replace the entire appData structure.
    console.log("Import functionality to be implemented.", file);
    alert("Import functionality is under development.");
}