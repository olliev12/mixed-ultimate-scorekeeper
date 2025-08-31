// scripts/home.js
console.log("Home page script loaded.");
document.addEventListener('DOMContentLoaded', async () => {
    await loadStarfireData(); // Ensure data is loaded from data-manager.js

    const exportBtn = document.getElementById('exportData');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            const gamesData = JSON.stringify(appData, null, 2); // Convert games array to JSON
            const blob = new Blob([gamesData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'games.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
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

    const deleteLocalDataBtn = document.getElementById('deleteLocalDataBtn');
    if (deleteLocalDataBtn) {
        deleteLocalDataBtn.addEventListener('click', async () => {
            if (confirm("Are you sure you want to delete all local Starfire data? This will reset the application to its default state.")) {
                localStorage.removeItem(STARFIRE_DATA_KEY); // STARFIRE_DATA_KEY is from data-manager.js
                appData = null; // Clear the in-memory cache in data-manager
                await loadStarfireData(); // Reload initial data
                alert("Local data has been cleared. Application has been reset to default state.");
            }
        });
    }
});