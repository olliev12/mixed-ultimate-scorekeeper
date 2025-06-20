// scripts/home.js
console.log("Home page script loaded.");
document.addEventListener('DOMContentLoaded', async () => {
    await loadStarfireData(); // Ensure data is loaded from data-manager.js

    const exportBtn = document.getElementById('exportData');
    if (exportBtn) {
        exportBtn.addEventListener('click', function() {
            console.log("export")
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
});