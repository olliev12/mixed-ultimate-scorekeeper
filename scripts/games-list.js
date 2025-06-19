// scripts/games-list.js
document.addEventListener('DOMContentLoaded', async () => {
    await loadStarfireData(); // From data-manager.js

    const urlParams = new URLSearchParams(window.location.search);
    const tournamentId = urlParams.get('tournamentId');

    if (tournamentId === null || tournamentId === undefined) {
        alert("Tournament ID is missing. Redirecting to tournaments page.");
        window.location.href = 'tournaments.html';
        return;
    }

    const tournament = getTournamentById(parseInt(tournamentId)); // Assuming ID is index

    if (!tournament) {
        alert("Tournament not found. Redirecting to tournaments page.");
        window.location.href = 'tournaments.html';
        return;
    }

    document.getElementById('tournamentNameHeader').textContent = `${tournament.name || 'Tournament'} - Games`;

    renderGamesList(tournamentId, tournament.games);
    renderTournamentPlayerStats(tournament.games);

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
    const playerPointsMap = new Map();
    const allPlayers = getPlayers(); // Fetch all player details once

    games.forEach(game => {
        if (game.events && Array.isArray(game.events)) {
            game.events.forEach(event => {
                if (event.players && Array.isArray(event.players)) {
                    event.players.forEach(playerId => {
                        playerPointsMap.set(playerId, (playerPointsMap.get(playerId) || 0) + 1);
                    });
                }
            });
        }
    });

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
        listItem.textContent = `${stat.player.nickname || (stat.player.firstName + ' ' + stat.player.lastName)}: ${stat.points} points`;
        statsListElement.appendChild(listItem);
    });
}