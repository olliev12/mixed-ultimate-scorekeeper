// scripts/utils.js

/**
 * Formats an ISO string or Date to HH:MM for display
 * @param {string|Date|null} value
 * @returns {string}
 */
function formatTimeForDisplay(value) {
    if (!value) return '--:--';
    const d = (value instanceof Date) ? value : new Date(value);
    if (isNaN(d.getTime())) return '--:--';
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
}

/**
 * Formats a Date or date-like value to an <input type="time"> value (HH:MM)
 * @param {string|Date|null} date
 * @returns {string}
 */
function formatInputTime(date) {
    const d = (date instanceof Date) ? date : new Date(date);
    if (isNaN(d.getTime())) return '';
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
}

/**
 * Simple debounce utility
 * @param {Function} fn
 * @param {number} waitMs
 * @returns {Function}
 */
function debounce(fn, waitMs) {
    let tId;
    return function debounced(...args) {
        if (tId) clearTimeout(tId);
        tId = setTimeout(() => fn.apply(this, args), waitMs);
    };
}

// Expose to window for simplicity in vanilla environment
window.formatTimeForDisplay = formatTimeForDisplay;
window.formatInputTime = formatInputTime;
window.debounce = debounce;
