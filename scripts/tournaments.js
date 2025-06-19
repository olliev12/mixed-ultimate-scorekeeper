// scripts/tournaments.js
document.addEventListener('DOMContentLoaded', async () => {
    await loadStarfireData(); // Ensure data is loaded from data-manager.js
    renderTournaments();

    const addTournamentBtn = document.getElementById('addTournamentBtn');
    if (addTournamentBtn) {
        addTournamentBtn.addEventListener('click', () => {
            const tournamentName = prompt("Enter new tournament name:");
            if (tournamentName && tournamentName.trim() !== "") {
                addTournament(tournamentName.trim());
                renderTournaments(); // Re-render the list
            }
        });
    }

    const exportBtn = document.getElementById('exportData');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportData);
    }

    const importInput = document.getElementById('importData');
    if (importInput) {
        importInput.addEventListener('change', async (event) => {
            const file = event.target.files[0];
            if (file) {
                // Placeholder for actual import logic from data-manager.js
                // For now, just log and alert.
                // await importDataFromFile(file);
                // renderTournaments();
                alert("Import functionality is being refined. Data will be loaded from starfire.json on first load or if localStorage is empty.");
                console.log("File selected for import:", file.name);
            }
        });
    }
});

function renderTournaments() {
    const tournamentsListDiv = document.getElementById('tournamentsList');
    tournamentsListDiv.innerHTML = ''; // Clear existing list
    const tournaments = getTournaments();

    tournaments.forEach((tournament, index) => {
        const tournamentElement = document.createElement('div');
        tournamentElement.className = 'gameItem'; // Re-use existing style
        tournamentElement.innerHTML = `<h3>${tournament.name || 'Unnamed Tournament'}</h3>
                                       <p>Games: ${tournament.games?.length || 0}</p>
                                       <a href="games-list.html?tournamentId=${index}"><button>View Games</button></a>`;
        tournamentsListDiv.appendChild(tournamentElement);
    });

    if (tournaments.length === 0) {
        tournamentsListDiv.innerHTML = '<p>No tournaments yet. Add one!</p>';
    }
}