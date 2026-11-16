const { exec } = require('child_process');
const path = require('path');

function fetchActiveWindow() {
    return new Promise((resolve, reject) => {
        // Since fetchActiveWindow.js is in agent-source/utils/, __dirname is agent-source/utils.
        // We go up one folder to reach agent-source/scripts/get-active-window.ps1
        let scriptPath = path.join(__dirname, '..', 'scripts', 'get-active-window.ps1');
        if (scriptPath.includes('app.asar')) {
            scriptPath = scriptPath.replace('app.asar', 'app.asar.unpacked');
        }
        
        exec(`powershell -NoProfile -ExecutionPolicy Bypass -File "${scriptPath}"`, (error, stdout, stderr) => {
            if (error) {
                return reject(error);
            }
            try {
                const parsed = JSON.parse(stdout.trim());
                resolve(parsed);
            } catch (err) {
                reject(new Error(`Failed to parse active window output: "${stdout.trim()}". Error: ${err.message}`));
            }
        });
    });
}

module.exports = { fetchActiveWindow };
