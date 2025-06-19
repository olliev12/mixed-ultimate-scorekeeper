// scripts/manage-team.js

document.addEventListener('DOMContentLoaded', async () => {
    await loadStarfireData(); // Ensure data is loaded
    renderPlayerList();

    const addPlayerBtn = document.getElementById('addPlayerBtn');
    const addPlayerPopup = document.getElementById('addPlayerPopup');
    const closeButton = document.querySelector('.close-button');
    const savePlayerBtn = document.getElementById('savePlayerBtn');

    addPlayerBtn.addEventListener('click', () => {
        addPlayerPopup.style.display = 'block';
    });

    closeButton.addEventListener('click', () => {
        addPlayerPopup.style.display = 'none';
        clearPlayerForm();
    });

    savePlayerBtn.addEventListener('click', () => {
        const firstName = document.getElementById('firstName').value;
        const lastName = document.getElementById('lastName').value;
        const nickname = document.getElementById('nickname').value.trim(); // Trim whitespace
        const genderMatch = document.getElementById('genderMatch').value;
        const position = document.getElementById('position').value;
        const line = document.getElementById('playerLine').value;

        if (!nickname) { // Nickname is now required
            alert("Nickname is required.");
            return;
        }

        if (firstName && lastName && genderMatch && position && line) { // Nickname already checked
            const newPlayer = addPlayer({ firstName, lastName, nickname, genderMatch, position, line });
            if (newPlayer) { // Check if player was successfully added (ID was unique)
                addPlayerPopup.style.display = 'none';
                renderPlayerList();
                clearPlayerForm();
            }
        } else {
            alert("Please fill in all required fields.");
        }
    });

    // Close the popup if the user clicks outside of it
    window.addEventListener('click', (event) => {
        if (event.target === addPlayerPopup) {
            addPlayerPopup.style.display = 'none';
            clearPlayerForm();
        }
    });
});

function renderPlayerList() {
    const playerList = document.getElementById('playerList');
    playerList.innerHTML = ''; // Clear existing list
    const players = getPlayers();

    if (players.length === 0) {
        playerList.innerHTML = "<p>No players yet. Add some!</p>";
        return;
    }

    players.forEach(player => {
        const listItem = document.createElement('li');
        listItem.textContent = `${player.firstName} ${player.lastName} (${player.nickname}) - ID: ${player.id} - ${player.genderMatch}, ${player.position}, Line: ${player.line}`;

        // Basic delete functionality for now
        const deleteButton = document.createElement('button');
        deleteButton.classList.add('delete-button');
        deleteButton.textContent = 'X';
        deleteButton.addEventListener('click', () => {
            if (confirm(`Delete ${player.firstName} ${player.lastName}?`)) {
                deletePlayer(player.id);
                renderPlayerList();
            }
        });

        listItem.appendChild(deleteButton);
        playerList.appendChild(listItem);
    });
}

function clearPlayerForm() {
    document.getElementById('firstName').value = '';
    document.getElementById('lastName').value = '';
    document.getElementById('nickname').value = '';
    document.getElementById('genderMatch').value = 'M';
    document.getElementById('position').value = 'H';
    document.getElementById('playerLine').value = 'O';
}