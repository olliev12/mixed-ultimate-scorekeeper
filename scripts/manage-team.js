// scripts/manage-team.js
let playerHeadingElement;
let selectedPlayer;

document.addEventListener('DOMContentLoaded', async () => {
    await loadStarfireData(); // Ensure data is loaded
    renderPlayerList();

    const addPlayerBtn = document.getElementById('addPlayerBtn');
    const addPlayerPopup = document.getElementById('addPlayerPopup');
    const closeButton = document.querySelector('.close-button');
    const savePlayerBtn = document.getElementById('savePlayerBtn');
    const deletePlayerBtn = document.getElementById('deletePlayerBtn');
    playerHeadingElement = document.getElementById('playerHeading');

    addPlayerBtn.addEventListener('click', () => {
        addPlayerPopup.style.display = 'block';
        playerHeadingElement.textContent = 'Add New Player';
        deletePlayerBtn.style.display = 'none';
        savePlayerBtn.textContent = 'Save Player';
        clearPlayerForm();
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
            if (selectedPlayer) {
                const updatedPlayer = updatePlayer({ firstName, lastName, nickname, genderMatch, position, line }, selectedPlayer.id);
                if (updatedPlayer) { // Check if player was successfully added (ID was unique)
                    addPlayerPopup.style.display = 'none';
                    renderPlayerList();
                    clearPlayerForm();
                }
            }
            else {
                const newPlayer = addPlayer({ firstName, lastName, nickname, genderMatch, position, line });
                if (newPlayer) { // Check if player was successfully added (ID was unique)
                    addPlayerPopup.style.display = 'none';
                    renderPlayerList();
                    clearPlayerForm();
                }
            }
        } else {
            alert("Please fill in all required fields.");
        }
    });

    deletePlayerBtn.addEventListener('click', () => {
        if (selectedPlayer && confirm(`Delete Player: ${selectedPlayer.id}?`)) {
            deletePlayer(selectedPlayer.id);
            clearPlayerForm();
            renderPlayerList();
            addPlayerPopup.style.display = 'none';
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
        listItem.textContent = `${player.firstName} ${player.lastName} (${player.nickname})`;

        // Basic delete functionality for now
        const editButton = document.createElement('button');
        editButton.classList.add('edit-button');
        editButton.textContent = 'Edit Player';
        editButton.id = player.id;

        editButton.addEventListener('click', (buttonClick) => {
            selectedPlayer = getPlayerById(buttonClick.target.id);
            addPlayerPopup.style.display = 'block';
            fillPlayerForm(selectedPlayer);
            playerHeadingElement.textContent = `Edit: ${selectedPlayer.firstName} ${selectedPlayer.lastName}`;
            savePlayerBtn.textContent = 'Update Player';
            deletePlayerBtn.style.display = 'inline-block';
        });

        listItem.appendChild(editButton);
        playerList.appendChild(listItem);
    });
}

function clearPlayerForm() {
    selectedPlayer = null;
    document.getElementById('firstName').value = '';
    document.getElementById('lastName').value = '';
    document.getElementById('nickname').value = '';
    document.getElementById('genderMatch').value = 'M';
    document.getElementById('position').value = 'H';
    document.getElementById('playerLine').value = 'O';
}

function fillPlayerForm (player) {
    document.getElementById('firstName').value = player.firstName;
    document.getElementById('lastName').value = player.lastName;
    document.getElementById('nickname').value = player.nickname;
    document.getElementById('genderMatch').value = player.genderMatch;
    document.getElementById('position').value = player.position;
    document.getElementById('playerLine').value = player.line;
}