// scripts/tournament-modal.js

// Global variable to track current tournament being edited
let currentEditingTournamentId = null;

// Tournament settings modal elements
let modal, modalTitle, tournamentForm, closeBtn, cancelBtn, saveBtn;

// Default tournament settings
const DEFAULT_TOURNAMENT_SETTINGS = {
    name: '',
    startDate: '',
    endDate: '',
    location: '',
    defaultPointCap: 13,
    hardCap: 0,
    softCap: 0,
    halfCap: 0,
    timeoutsPerHalf: 2,
    floaterTimeout: false,
    lineRotation: 'none',
    games: [],
    players: []
};

// Track selected player IDs for the tournament modal
let selectedTournamentPlayerIds = new Set();

/**
 * Initialize the tournament settings modal
 */
function initTournamentModal() {
    // Get modal elements
    modal = document.getElementById('tournamentModal');
    modalTitle = document.getElementById('modalTitle');
    tournamentForm = document.getElementById('tournamentForm');
    closeBtn = document.querySelector('.close');
    cancelBtn = document.getElementById('cancelBtn');
    saveBtn = document.getElementById('saveBtn');

    // Set up event listeners for closing the modal
    if (closeBtn) closeBtn.onclick = closeModal;
    if (cancelBtn) cancelBtn.onclick = closeModal;
    
    // Close modal when clicking outside of it
    window.onclick = (event) => {
        if (event.target === modal) {
            closeModal();
        }
    };

    // Handle form submission
    if (saveBtn) {
        saveBtn.onclick = (e) => {
            e.preventDefault();
            saveTournament();
        };
    }
    
    // Allow form submission with Enter key
    if (tournamentForm) {
        tournamentForm.onsubmit = (e) => {
            e.preventDefault();
            saveTournament();
        };
    }
    
    // Set default end date to start date if empty
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    
    if (startDateInput && endDateInput) {
        startDateInput.addEventListener('change', (e) => {
            if (!endDateInput.value) {
                endDateInput.value = e.target.value;
            }
        });
    }
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
        });

        item.appendChild(input);
        item.appendChild(label);
        listEl.appendChild(item);
    });
}

/**
 * Open the tournament settings modal
 * @param {string} tournamentId - ID of the tournament to edit, or null for new tournament
 */
function openTournamentModal(tournamentId = null) {
    // Make sure the modal is initialized
    if (!modal) {
        console.error('Modal not initialized');
        return;
    }
    
    currentEditingTournamentId = tournamentId;
    
    // Set modal title
    modalTitle.textContent = tournamentId ? 'Edit Tournament' : 'New Tournament';
    
    // Get form elements
    const nameInput = document.getElementById('tournamentName');
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    const locationInput = document.getElementById('location');
    const defaultPointCapInput = document.getElementById('defaultPointCap');
    const hardCapInput = document.getElementById('hardCap');
    const softCapInput = document.getElementById('softCap');
    const halfCapInput = document.getElementById('halfCap');
    const timeoutsPerHalfInput = document.getElementById('timeoutsPerHalf');
    const floaterTimeoutInput = document.getElementById('floaterTimeout');
    const lineRotationSelect = document.getElementById('lineRotation');
    
    // Set today's date as default for new tournaments
    const today = new Date().toISOString().split('T')[0];
    
    // If editing, load tournament data
    if (tournamentId) {
        const tournament = getTournamentById(tournamentId);
        if (tournament) {
            nameInput.value = tournament.name || '';
            startDateInput.value = tournament.startDate || '';
            endDateInput.value = tournament.endDate || '';
            locationInput.value = tournament.location || '';
            defaultPointCapInput.value = tournament.defaultPointCap || 13;
            hardCapInput.value = tournament.hardCap || 0;
            softCapInput.value = tournament.softCap || 0;
            halfCapInput.value = tournament.halfCap || 0;
            timeoutsPerHalfInput.value = tournament.timeoutsPerHalf || 1;
            floaterTimeoutInput.checked = !!tournament.floaterTimeout;
            lineRotationSelect.value = tournament.lineRotation || 'none';
            // Build player selection set based on existing players (preselect those in the tournament)
            const allPlayers = getPlayers();
            const preselectedIds = new Set((tournament.players || allPlayers).map(p => p.id));
            selectedTournamentPlayerIds = preselectedIds;
            renderTournamentPlayersChecklist(allPlayers, preselectedIds);
        }
    } else {
        // Reset form for new tournament with default values
        nameInput.value = '';
        startDateInput.value = today;
        endDateInput.value = today;
        locationInput.value = '';
        defaultPointCapInput.value = 13;
        hardCapInput.value = 0;
        softCapInput.value = 0;
        halfCapInput.value = 0;
        timeoutsPerHalfInput.value = 1;
        floaterTimeoutInput.checked = false;
        lineRotationSelect.value = 'none';
        // Render all players, checked by default for a new tournament
        const allPlayers = getPlayers();
        const preselectedIds = new Set(allPlayers.map(p => p.id));
        selectedTournamentPlayerIds = preselectedIds;
        renderTournamentPlayersChecklist(allPlayers, preselectedIds);
    }
    
    // Show the modal
    modal.style.display = 'block';
    // Trigger reflow to ensure the initial styles are applied before adding 'show' class
    void modal.offsetWidth;
    // Add show class to trigger the animation
    modal.classList.add('show');
    // Set focus on the first form element for better accessibility
    const firstInput = modal.querySelector('input, select, textarea');
    if (firstInput) {
        firstInput.focus();
    }
}

/**
 * Close the tournament settings modal
 */
function closeModal() {
    if (!modal) return;
    
    // Remove show class to trigger the fade-out animation
    modal.classList.remove('show');
    
    // Hide the modal after the animation completes
    setTimeout(() => {
        modal.style.display = 'none';
        currentEditingTournamentId = null;
        
        // Reset the form to clear any validation errors
        if (tournamentForm) {
            tournamentForm.reset();
        }
    }, 300); // Match this duration with the CSS transition duration
}

/**
 * Save tournament data from the form
 */
async function saveTournament() {
    if (!tournamentForm) return;
    
    // Get all form values
    const nameInput = document.getElementById('tournamentName');
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    const locationInput = document.getElementById('location');
    const defaultPointCapInput = document.getElementById('defaultPointCap');
    const hardCapInput = document.getElementById('hardCap');
    const softCapInput = document.getElementById('softCap');
    const halfCapInput = document.getElementById('halfCap');
    const timeoutsPerHalfInput = document.getElementById('timeoutsPerHalf');
    const floaterTimeoutInput = document.getElementById('floaterTimeout');
    const lineRotationSelect = document.getElementById('lineRotation');
    
    // Validate required fields
    if (!nameInput.value.trim()) {
        showFormError('Please enter a tournament name');
        nameInput.focus();
        return;
    }
    
    // Validate date range if both dates are provided
    if (startDateInput.value && endDateInput.value && startDateInput.value > endDateInput.value) {
        showFormError('End date cannot be before start date');
        endDateInput.focus();
        return;
    }
    
    // Prepare tournament data
    const tournamentData = {
        id: currentEditingTournamentId || generateId(),
        name: nameInput.value.trim(),
        startDate: startDateInput.value || null,
        endDate: endDateInput.value || null,
        location: locationInput.value.trim(),
        defaultPointCap: Math.min(25, Math.max(1, parseInt(defaultPointCapInput.value) || 13)),
        hardCap: Math.min(300, Math.max(0, parseInt(hardCapInput.value) || 0)),
        softCap: Math.min(300, Math.max(0, parseInt(softCapInput.value) || 0)),
        halfCap: Math.min(300, Math.max(0, parseInt(halfCapInput.value) || 0)),
        timeoutsPerHalf: Math.min(5, Math.max(0, parseInt(timeoutsPerHalfInput.value) || 1)),
        floaterTimeout: floaterTimeoutInput.checked,
        lineRotation: lineRotationSelect.value || 'none',
        updatedAt: new Date().toISOString(),
        // Persist only the checked players
        players: getPlayers().filter(p => selectedTournamentPlayerIds.has(p.id))
    };
    
    // If this is a new tournament, add created timestamp
    if (!currentEditingTournamentId) {
        tournamentData.createdAt = new Date().toISOString();
        tournamentData.games = [];
    }
    
    try {
        // Show loading state
        const saveButton = document.getElementById('saveBtn');
        const originalButtonText = saveButton.textContent;
        saveButton.disabled = true;
        saveButton.textContent = 'Saving...';
        
        // Update or add the tournament
        if (currentEditingTournamentId) {
            updateTournament(currentEditingTournamentId, tournamentData);
            showNotification('Tournament updated successfully', 'success');
        } else {
            addTournament(tournamentData);
            showNotification('Tournament created successfully', 'success');
        }
        
        // Save to storage
        await saveStarfireData();
        
        // Refresh the tournaments list
        if (typeof renderTournaments === 'function') {
            renderTournaments();
        }
        
        // Close the modal
        closeModal();
        
    } catch (error) {
        console.error('Error saving tournament:', error);
        showFormError('An error occurred while saving the tournament. Please try again.');
    } 
    // finally {
    //     // Reset button state
    //     if (saveButton) {
    //         saveButton.disabled = false;
    //         saveButton.textContent = originalButtonText;
    //     }
    // }
}

/**
 * Show a form error message
 * @param {string} message - The error message to display
 */
function showFormError(message) {
    // Remove any existing error messages
    const existingError = document.querySelector('.form-error');
    if (existingError) {
        existingError.remove();
    }
    
    // Create and show the error message
    const errorElement = document.createElement('div');
    errorElement.className = 'form-error';
    errorElement.style.color = '#ff6b6b';
    errorElement.style.marginTop = '10px';
    errorElement.style.padding = '8px 12px';
    errorElement.style.backgroundColor = 'rgba(255, 107, 107, 0.1)';
    errorElement.style.borderRadius = '4px';
    errorElement.style.borderLeft = '3px solid #ff6b6b';
    errorElement.textContent = message;
    
    // Insert the error message after the form
    if (tournamentForm) {
        tournamentForm.appendChild(errorElement);
        
        // Scroll to the error
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
        // Fallback to alert if form not found
        alert(message);
    }
}

/**
 * Generate a unique ID for new tournaments
 * @returns {string} A unique ID
 */
function generateId() {
    return 'tourn_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Update an existing tournament
 * @param {string} tournamentId - ID of the tournament to update
 * @param {Object} updatedData - New tournament data
 */
function updateTournament(tournamentId, updatedData) {
    if (!appData || !appData.tournaments) {
        console.error('No tournaments data found');
        return false;
    }
    
    const index = appData.tournaments.findIndex(t => t.id === tournamentId);
    if (index !== -1) {
        // Preserve the existing games array and creation date
        const games = appData.tournaments[index].games || [];
        const createdAt = appData.tournaments[index].createdAt || new Date().toISOString();
        
        appData.tournaments[index] = {
            ...appData.tournaments[index],
            ...updatedData,
            games,
            createdAt,
            updatedAt: new Date().toISOString()
        };
        return true;
    }
    
    console.error(`Tournament with ID ${tournamentId} not found`);
    return false;
}

/**
 * Add a new tournament
 * @param {Object} tournamentData - The tournament data to add
 */
function addTournament(tournamentData) {
    
    // Ensure the tournament has an ID
    if (!tournamentData.id) {
        tournamentData.id = generateId();
    }
    
    // Set timestamps if not provided
    if (!tournamentData.createdAt) {
        tournamentData.createdAt = new Date().toISOString();
    }
    if (!tournamentData.updatedAt) {
        tournamentData.updatedAt = new Date().toISOString();
    }
    
    // Initialize games array if not provided
    if (!Array.isArray(tournamentData.games)) {
        tournamentData.games = [];
    }
    
    // Add the tournament to the array
    appData.tournaments.push(tournamentData);
    
    return tournamentData.id;
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
    
}

// Export the init function to be called from tournaments.js
window.initTournamentModal = initTournamentModal;
