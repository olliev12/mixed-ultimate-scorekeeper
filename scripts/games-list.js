// scripts/games-list.js

let selectedTournamentPlayerIds = new Set();
let tournament;

document.addEventListener('DOMContentLoaded', async () => {
    await loadStarfireData(); // From data-manager.js

    const urlParams = new URLSearchParams(window.location.search);
    const tournamentId = urlParams.get('tournamentId');

    if (tournamentId === null || tournamentId === undefined) {
        alert("Tournament ID is missing. Redirecting to tournaments page.");
        window.location.href = 'tournaments.html';
        return;
    }

    tournament = getTournamentById(tournamentId); // Assuming ID is index
    const playerIds = new Set(tournament?.players?.map(player => player.id) || getPlayers().map(player => player.id));
    selectedTournamentPlayerIds = playerIds;

    if (!tournament) {
        alert("Tournament not found. Redirecting to tournaments page.");
        window.location.href = 'tournaments.html';
        return;
    }

    document.getElementById('tournamentNameHeader').textContent = `${tournament.name || 'Tournament'} - Games`;

    renderGamesList(tournamentId, tournament.games);
    renderTournamentPlayerStats(tournament.games);
    renderTournamentPlayersChecklist(getPlayers(), playerIds);

    const addNewGameBtn = document.getElementById('addNewGameBtn');
    if (addNewGameBtn) {
        addNewGameBtn.addEventListener('click', () => {
            window.location.href = `game-control.html?tournamentId=${tournamentId}`;
        });
    }
});

function renderGamesList(tournamentId, games) {
    const gamesListSection = document.getElementById('gamesListSection');
    gamesListSection.innerHTML = ''; // Clear existing list

    if (!games || games.length === 0) {
        gamesListSection.innerHTML = '<p>No games in this tournament yet. Add one!</p>';
        return;
    }

    // This part will be very similar to your existing renderGamesList in script.js
    // but adapted to show games for the current tournament and link to game-control.html
    games.forEach((game) => {
        const gameItem = document.createElement('div');
        gameItem.className = 'gameItem'; // Re-use styles
        // Display game summary (e.g., opponent, score, date).
        // game.id is now the unique identifier.
        gameItem.innerHTML = `
            <h4>Starfire vs ${game.opponentName || 'Opponent'}</h4>
            <p>Score: ${game.homeScore} - ${game.awayScore}</p>
            <p>Date: ${new Date(game.timestamp).toLocaleString()}</p>
            <a href="game-control.html?tournamentId=${tournamentId}&gameId=${game.id}"><button>Open Game</button></a>
        `;
        // TODO: Add detailed stats display here like in your original renderGamesList
        // You'll need to adapt the getMatches and makeStatsObj functions or similar logic.
        // For now, keeping it simple.
        gamesListSection.appendChild(gameItem);
    });
}

/**
 * Calculates and renders player statistics (points played) for the entire tournament.
 * @param {Array<object>} games - An array of game objects for the current tournament.
 */
function renderTournamentPlayerStats(games) {
    const allPlayers = tournament.players || getPlayers(); // Fetch all player details once
    const playerPointsMap = new Map(allPlayers.map(({ id }) => [id, 0]));
    const linePointsMap = new Map([['O', 0], ['D', 0], ['X', 0], ['K', 0]]);

    games.forEach(game => {
        if (game.events && Array.isArray(game.events)) {
            game.events.forEach(event => {
                if (event.players && Array.isArray(event.players)) {
                    event.players.forEach(playerId => {
                        playerPointsMap.set(playerId, (playerPointsMap.get(playerId) || 0) + 1);
                    });
                }
                if (event.line) {
                    linePointsMap.set(event.line, (linePointsMap.get(event.line) || 0) + 1);
                }
            });
        }
    });

    document.getElementById('lineOCount').textContent = linePointsMap.get('O');
    document.getElementById('lineDCount').textContent = linePointsMap.get('D');
    document.getElementById('lineXCount').textContent = linePointsMap.get('X');
    document.getElementById('lineKCount').textContent = linePointsMap.get('K');

    const statsListElement = document.getElementById('tournamentPlayerStatsList');
    statsListElement.innerHTML = ''; // Clear existing stats

    if (playerPointsMap.size === 0) {
        statsListElement.innerHTML = '<li>No player stats available for this tournament yet.</li>';
        return;
    }

    // Create an array from the map, include player details, then sort
    const sortedStats = Array.from(playerPointsMap.entries())
        .map(([playerId, points]) => ({ player: allPlayers.find(p => p.id === playerId), points }))
        .filter(stat => stat.player) // Ensure player exists
        .sort((a, b) => b.points - a.points || (a.player.nickname || a.player.lastName).localeCompare(b.player.nickname || b.player.lastName)); // Sort by points desc, then name

    sortedStats.forEach(stat => {
        const listItem = document.createElement('li');
        listItem.innerHTML = `${stat.player.nickname || (stat.player.firstName + ' ' + stat.player.lastName)}: <span>${stat.points} points</span>`;
        statsListElement.appendChild(listItem);
    });

    const averagePlayerCount = Math.round(sortedStats.map(stat => stat.points)
        .reduce((a, b) => a + b, 0) / sortedStats.length);
    const medianPlayerCount = Math.round(sortedStats.map(stat => stat.points)
        .sort((a, b) => a - b)[Math.floor(sortedStats.length / 2)]);

    document.getElementById('averagePlayerCount').textContent = averagePlayerCount;
    document.getElementById('medianPlayerCount').textContent = medianPlayerCount;
}

/**
 * Render the tournament players checklist with all players checked by default
 * or respecting a provided preselected set.
 * @param {Array} allPlayers - Array of player objects from getPlayers()
 * @param {Set<string>} preselectedIds - Set of player IDs that should be checked
 */
function renderTournamentPlayersChecklist(allPlayers = [], preselectedIds = new Set()) {
    const listEl = document.getElementById('tournamentPlayersList');
    if (!listEl) return;

    listEl.innerHTML = '';

    if (!allPlayers || allPlayers.length === 0) {
        const li = document.createElement('li');
        li.textContent = 'No players available.';
        listEl.appendChild(li);
        return;
    }

    const toggleSettingsButton = document.getElementById('toggleSettingsButton');
    const tournamentPlayersContainer = document.getElementById('tournamentPlayersContainer');
    if (toggleSettingsButton) {
        toggleSettingsButton.addEventListener('click', () => {
            const isCollapsed = tournamentPlayersContainer.classList.toggle('collapsed');
            toggleSettingsButton.textContent = isCollapsed ? 'v' : '^';
        });
    }

    allPlayers.forEach(player => {
        const item = document.createElement('li');
        item.className = 'form-group checkbox-group';

        const input = document.createElement('input');
        input.type = 'checkbox';
        input.id = `tourn_player_${player.id}`;
        input.checked = preselectedIds.has(player.id);
        input.dataset.playerId = player.id;

        const label = document.createElement('label');
        label.htmlFor = input.id;
        const nickname = player.nickname || player.id;
        label.textContent = `${nickname}`;

        input.addEventListener('change', (e) => {
            const pid = e.target.dataset.playerId;
            if (e.target.checked) {
                selectedTournamentPlayerIds.add(pid);
            } else {
                selectedTournamentPlayerIds.delete(pid);
            }
            const players = getPlayers().filter(p => selectedTournamentPlayerIds.has(p.id));
            updateTournamentPlayers(tournament.id, players);
        });

        item.appendChild(input);
        item.appendChild(label);
        listEl.appendChild(item);
    });
}

/**
 * Update an existing tournament
 * @param {string} tournamentId - ID of the tournament to update
 * @param {Object} updatedData - New tournament data
 */
function updateTournamentPlayers(tournamentId, players) {
    if (!appData || !appData.tournaments) {
        console.error('No tournaments data found');
        return false;
    }

    const index = appData.tournaments.findIndex(t => t.id === tournamentId);
    if (index !== -1) {
        appData.tournaments[index].players = players;
        saveStarfireData();
        renderTournamentPlayerStats(tournament.games);
        return true;
    }

    console.error(`Tournament with ID ${tournamentId} not found`);
    return false;
}