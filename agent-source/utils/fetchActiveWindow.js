const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * Cross-Platform Active Window & Application Inspector
 * Supports:
 * - Windows (PowerShell / Win32 API)
 * - macOS (Native Swift / JXA AppleScript)
 * - Linux (xdotool, xprop, /proc, Wayland swaymsg)
 */
function fetchActiveWindow() {
    return new Promise((resolve, reject) => {
        const platform = process.platform;
        let scriptsDir = path.join(__dirname, '..', 'scripts');
        if (scriptsDir.includes('app.asar')) {
            scriptsDir = scriptsDir.replace('app.asar', 'app.asar.unpacked');
        }

        if (platform === 'win32') {
            const scriptPath = path.join(scriptsDir, 'get-active-window.ps1');
            exec(`powershell -NoProfile -ExecutionPolicy Bypass -File "${scriptPath}"`, { timeout: 3500 }, (error, stdout) => {
                if (error) {
                    return resolve({ appName: 'Desktop', windowTitle: 'Desktop' });
                }
                try {
                    const parsed = JSON.parse(stdout.trim());
                    resolve(parsed);
                } catch {
                    resolve({ appName: 'Desktop', windowTitle: 'Desktop' });
                }
            });
        } else if (platform === 'darwin') {
            // macOS: try Swift helper first, fallback to JXA script
            const swiftPath = path.join(scriptsDir, 'get-active-window-mac.swift');
            const jxaPath = path.join(scriptsDir, 'get-active-window-mac.js');

            exec(`swift "${swiftPath}"`, { timeout: 3500 }, (err, stdout) => {
                if (!err && stdout && stdout.trim()) {
                    try {
                        return resolve(JSON.parse(stdout.trim()));
                    } catch {}
                }
                // Fallback to JXA osascript
                exec(`osascript -l JavaScript "${jxaPath}"`, { timeout: 3500 }, (jxaErr, jxaOut) => {
                    if (!jxaErr && jxaOut && jxaOut.trim()) {
                        try {
                            return resolve(JSON.parse(jxaOut.trim()));
                        } catch {}
                    }
                    resolve({ appName: 'Finder', windowTitle: 'Desktop' });
                });
            });
        } else if (platform === 'linux') {
            // Linux: run bash script or inline xdotool
            const linuxScript = path.join(scriptsDir, 'get-active-window-linux.sh');
            exec(`bash "${linuxScript}"`, { timeout: 3500 }, (err, stdout) => {
                if (!err && stdout && stdout.trim()) {
                    try {
                        return resolve(JSON.parse(stdout.trim()));
                    } catch {}
                }
                resolve({ appName: 'Desktop', windowTitle: 'Desktop' });
            });
        } else {
            resolve({ appName: 'Desktop', windowTitle: 'Desktop' });
        }
    });
}

module.exports = { fetchActiveWindow };
