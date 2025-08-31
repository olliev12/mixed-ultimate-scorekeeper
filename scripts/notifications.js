// scripts/notifications.js

/**
 * Centralized user notifications.
 * Falls back to alert if Notifications API is unavailable or denied.
 * @param {string} message
 * @param {('info'|'warning'|'error'|'success')} [type]
 */
function showNotification(message, type = 'info') {
    // Basic noop for type for now; could map to icons/sounds later
    if (!('Notification' in window)) {
        alert(message);
        return;
    }
    if (Notification.permission === 'granted') {
        new Notification(message);
        return;
    }
    if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                new Notification(message);
            } else {
                alert(message);
            }
        });
        return;
    }
    alert(message);
}

window.showNotification = showNotification;
