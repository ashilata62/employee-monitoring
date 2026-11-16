/** Format total seconds as 01h 05m 30s */
export function formatSecondsToHMS(totalSeconds) {
    const sec = Math.max(0, Math.floor(totalSeconds || 0));
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
}

/** Parse hours number, HH:MM, or XXh XXm [XXs] into seconds */
export function parseTimeValueToSeconds(value) {
    if (value == null || value === '') return 0;
    if (typeof value === 'number' && !Number.isNaN(value)) {
        return Math.round(value * 3600);
    }

    const str = String(value).trim();
    if (!str) return 0;

    const hms = str.match(/(\d+)\s*h\s*(\d+)\s*m(?:\s*(\d+)\s*s)?/i);
    if (hms) {
        return parseInt(hms[1], 10) * 3600 + parseInt(hms[2], 10) * 60 + parseInt(hms[3] || '0', 10);
    }

    const colon = str.match(/^(\d+):(\d{2})(?::(\d{2}))?$/);
    if (colon) {
        return parseInt(colon[1], 10) * 3600 + parseInt(colon[2], 10) * 60 + parseInt(colon[3] || '0', 10);
    }

    const num = parseFloat(str);
    if (!Number.isNaN(num)) return Math.round(num * 3600);

    return 0;
}
