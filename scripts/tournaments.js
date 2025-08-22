// scripts/tournaments.js

// Global variable to track if the modal is initialized
let isModalInitialized = false;

/**
 * Initialize the tournaments page
 */
async function initTournaments() {
    try {
        await loadStarfireData(); // Ensure data is loaded from data-manager.js
        
        // Initialize the modal if it hasn't been already
        if (!isModalInitialized) {
            if (typeof window.initTournamentModal === 'function') {
                window.initTournamentModal();
                isModalInitialized = true;
            } else {
                console.error('Tournament modal initialization function not found');
                return;
            }
        }
        
        renderTournaments();
        setupEventListeners();
    } catch (error) {
        console.error('Error initializing tournaments:', error);
    }
}

/**
 * Set up event listeners for the tournaments page
 */
function setupEventListeners() {
    const addTournamentBtn = document.getElementById('addTournamentBtn');
    if (addTournamentBtn) {
        addTournamentBtn.addEventListener('click', () => {
            // Open the modal for a new tournament
            if (typeof openTournamentModal === 'function') {
                openTournamentModal();
            } else {
                console.error('Tournament modal not initialized');
            }
        });
    }
}

/**
 * Render the list of tournaments
 */
function renderTournaments() {
    const tournamentsListDiv = document.getElementById('tournamentsList');
    if (!tournamentsListDiv) return;
    
    tournamentsListDiv.innerHTML = ''; // Clear existing list
    const tournaments = getTournaments();

    if (tournaments.length === 0) {
        tournamentsListDiv.innerHTML = '<p>No tournaments yet. Add one using the button above!</p>';
        return;
    }

    // Create a container for the tournament list
    const listContainer = document.createElement('div');
    listContainer.className = 'tournament-list';

    tournaments.forEach((tournament, index) => {
        const tournamentElement = document.createElement('div');
        tournamentElement.className = 'gameItem';
        
        // Format dates if they exist
        let dateInfo = '';
        if (tournament.startDate || tournament.endDate) {
            const startDate = tournament.startDate ? new Date(tournament.startDate).toLocaleDateString() : 'TBD';
            const endDate = tournament.endDate ? new Date(tournament.endDate).toLocaleDateString() : 'TBD';
            const dateRange = startDate === endDate ? startDate : `${startDate} - ${endDate}`;
            dateInfo = `<p class="tournament-dates">${dateRange}</p>`;
        }
        
        // Location info if available
        const locationInfo = tournament.location ? `<p class="tournament-location">${tournament.location}</p>` : '';
        
        // Game count
        const gameCount = tournament.games?.length || 0;
        
        // Tournament settings summary
        const settingsInfo = `
            <div class="tournament-settings">
                <span>Point Cap: ${tournament.defaultPointCap || 13}</span>
                ${tournament.hardCap ? `<span>Hard Cap: ${tournament.hardCap}m</span>` : ''}
                ${tournament.softCap ? `<span>Soft Cap: ${tournament.softCap}m</span>` : ''}
                ${tournament.halfCap ? `<span>Half Cap: ${tournament.halfCap}m</span>` : ''}
            </div>
        `;
        
        tournamentElement.innerHTML = `
            <div class="tournament-header">
                <h3>${tournament.name || 'Unnamed Tournament'}</h3>
                <button class="edit-tournament" data-id="${tournament.id}">Edit</button>
            </div>
            ${dateInfo}
            ${locationInfo}
            <p>Games: ${gameCount}</p>
            ${settingsInfo}
            <div class="tournament-actions">
                <a href="games-list.html?tournamentId=${tournament.id}" class="btn btn-primary">View Games</a>
                <a href="game-control.html?tournamentId=${tournament.id}" class="btn btn-secondary">New Game</a>
            </div>
        `;
        
        // Add edit button event listener
        const editButton = tournamentElement.querySelector('.edit-tournament');
        if (editButton) {
            editButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (typeof openTournamentModal === 'function') {
                    openTournamentModal(tournament.id);
                }
            });
        }
        
        listContainer.appendChild(tournamentElement);
    });
    
    tournamentsListDiv.appendChild(listContainer);
}

// Initialize the tournaments page when the DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTournaments);
} else {
    initTournaments();
}