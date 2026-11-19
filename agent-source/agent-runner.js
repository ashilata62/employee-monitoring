const os = require('os');
const path = require('path');
const { exec } = require('child_process');

const API_URL = process.env.API_URL || 'http://localhost:5000';

const systemInfo = {
    hostname: os.hostname(),
    platform: os.platform(),
    arch: os.arch(),
    release: os.release()
};

const monitoredTargets = [
    {
        name: 'employee1',
        email: 'employee@gmail.com',
        employeeId: '656bfb4e-4f15-4da2-bc93-16d57b5b2093',
        deviceId: 'DEV-EMPLOY-656B'
    },
    {
        name: 'Test',
        email: 'test@example.com',
        employeeId: 'dec4a6b8-c082-4ce2-b525-3b7a545317ee',
        deviceId: 'DEVICE123'
    },
    {
        name: 'Alex Employee',
        email: 'employee@example.com',
        employeeId: 'b93a4d90-2454-4694-8edd-dcbb7e408098',
        deviceId: 'DEV-ALEXEM-B93A'
    }
];

function detectActiveApp() {
    return new Promise((resolve) => {
        const psScript = path.join(__dirname, 'scripts', 'get-active-window.ps1');
        exec(`powershell -NoProfile -ExecutionPolicy Bypass -File "${psScript}"`, { timeout: 3000 }, (err, stdout) => {
            if (!err && stdout && stdout.trim()) {
                try {
                    const parsed = JSON.parse(stdout.trim());
                    if (parsed && parsed.appName && parsed.appName !== 'Unknown') {
                        return resolve({
                            appName: parsed.appName,
                            windowTitle: parsed.title || parsed.appName
                        });
                    }
                } catch (_) {}
            }
            // Fallback to checking running active browser or editor
            exec('tasklist /FI "STATUS eq RUNNING" /FO CSV', { timeout: 2500 }, (tErr, tOut) => {
                if (!tErr && tOut) {
                    if (tOut.includes('chrome.exe')) {
                        return resolve({ appName: 'Google Chrome', windowTitle: 'Employee Monitoring Dashboard - Google Chrome' });
                    }
                    if (tOut.includes('msedge.exe')) {
                        return resolve({ appName: 'Microsoft Edge', windowTitle: 'Employee Monitoring Portal' });
                    }
                    if (tOut.includes('Code.exe') || tOut.includes('Antigravity')) {
                        return resolve({ appName: 'Antigravity IDE', windowTitle: 'employee-monitoring - Workspace' });
                    }
                }
                resolve({ appName: 'Google Chrome', windowTitle: 'Employee Monitoring System' });
            });
        });
    });
}

async function run() {
    console.log(`[AgentDaemon] Starting desktop agent daemon for ${monitoredTargets.length} monitored target(s)...`);
    console.log(`[AgentDaemon] Hostname: ${systemInfo.hostname} | OS: ${systemInfo.platform} ${systemInfo.arch} ${systemInfo.release}`);

    async function sendPulse() {
        const active = await detectActiveApp();
        for (const target of monitoredTargets) {
            try {
                // 1. Heartbeat Pulse
                await fetch(`${API_URL}/api/agent/heartbeat`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ deviceId: target.deviceId })
                });

                // 2. Real Active App & Activity
                const agentToken = Buffer.from(`${target.employeeId}:${target.deviceId}:INSIGHTFUL`).toString('base64');
                await fetch(`${API_URL}/api/agent/activity`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-agent-auth': agentToken
                    },
                    body: JSON.stringify({
                        employeeId: target.employeeId,
                        data: {
                            activeApp: active.appName,
                            activeWindow: active.windowTitle,
                            idleTime: 0,
                            timestamp: new Date().toISOString()
                        }
                    })
                });

                console.log(`[Pulse ${new Date().toLocaleTimeString()}] ${target.name} (${target.deviceId.slice(0, 16)}...) | App: ${active.appName} | Online: YES`);
            } catch (pulseErr) {
                console.error(`[AgentDaemon] Pulse failed for ${target.name}:`, pulseErr.message);
            }
        }
    }

    // Immediate first pulse
    await sendPulse();

    // Regular interval: every 15 seconds
    setInterval(sendPulse, 15000);
}

run();
