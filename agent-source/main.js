let electron;
try {
    electron = require('electron');
} catch (e) {
    electron = {
        app: { whenReady: () => Promise.resolve(), on: () => {}, quit: () => {} },
        BrowserWindow: class { constructor() {} loadFile() {} on() {} isDestroyed() { return false; } },
        ipcMain: { on: () => {}, handle: () => {} }
    };
}
if (!electron.powerMonitor) {
    electron.powerMonitor = {
        getSystemIdleTime: () => 0,
        getSystemIdleState: () => 'active',
        on: () => {}
    };
}
const { app, BrowserWindow, ipcMain, powerMonitor } = electron;
const path = require('path');
const os = require('os');
const { exec } = require('child_process');
let axios;
try {
    axios = require('axios');
} catch (e) {
    try {
        axios = require('../employee-monitoring/employee-monitoring-frontend/node_modules/axios');
    } catch (e2) {
        axios = null;
    }
}
let io;
try {
    io = require('socket.io-client');
} catch (e) {
    try {
        io = require('../employee-monitoring/employee-monitoring-frontend/node_modules/socket.io-client');
    } catch (e2) {
        io = null;
    }
}

// ─── Desktop Agent Configuration & Runtime State ─────────────────────────────
const API_URL = process.env.API_URL || 'http://localhost:5000';
let mainWindow = null;
let socket = null;

// Agent Runtime State
let agentState = {
    employeeId: null,
    deviceId: null,
    agentToken: null,
    status: 'inactive', // 'pending' | 'active' | 'inactive'
    activeTaskId: null, // Active Task ID linked from frontend
    isTracking: false,
};

// Violation Cooldown / Debounce State (Requirement 3)
let lastViolation = {
    key: null,
    timestamp: 0,
};
const VIOLATION_COOLDOWN_MS = 60 * 1000; // 60s cooldown for same continuous violation

// ─── Smart Idle & Inactivity Monitoring Configuration (Requirement 2 & 3) ────
const DEFAULT_IDLE_THRESHOLD_SECONDS = 600; // 10 minutes (600 seconds) default
let idleConfig = {
    thresholdSeconds: DEFAULT_IDLE_THRESHOLD_SECONDS,
    checkIntervalMs: 5000, // Check inactivity every 5 seconds
};

let idleState = {
    currentStatus: 'ACTIVE', // 'ACTIVE' | 'IDLE' | 'RESUMED'
    idleStartTime: null,
    lastActiveTimestamp: Date.now(),
    lastIdleSeconds: 0,
    hasSentIdleAlert: false, // Prevents duplicate IDLE events in same session
};

/**
 * Read system inactivity in seconds using OS native powerMonitor API (Windows GetLastInputInfo)
 * Detects time elapsed since the last mouse move, click or keyboard input.
 */
function getSystemInactivitySeconds() {
    try {
        if (powerMonitor && typeof powerMonitor.getSystemIdleTime === 'function') {
            return powerMonitor.getSystemIdleTime();
        }
    } catch (e) {
        // Fallback gracefully
    }
    return 0;
}

// PowerMonitor OS Event Hooks (Screen Lock, Sleep, Resume)
if (powerMonitor && typeof powerMonitor.on === 'function') {
    powerMonitor.on('lock-screen', () => {
        console.log('[PowerMonitor] Screen locked by employee');
    });
    powerMonitor.on('unlock-screen', () => {
        console.log('[PowerMonitor] Screen unlocked by employee');
        checkIdleActivity();
    });
    powerMonitor.on('suspend', () => {
        console.log('[PowerMonitor] System entering sleep/suspend mode');
    });
    powerMonitor.on('resume', () => {
        console.log('[PowerMonitor] System resumed from sleep');
        checkIdleActivity();
    });
}

// ─── Existing Blacklist Configuration (Reused from System Rules) ──────────────
// Reused from backend productivityRules.js & resolveAppActivity.js
const BLACKLISTED_KEYWORDS = [
    'youtube',
    'netflix',
    'twitch',
    'tiktok',
    'reddit',
    'facebook',
    'instagram',
    'twitter',
    'x.com',
    'spotify',
    'steam',
    'torrent',
    'dailymotion',
    'vimeo'
];

/**
 * Generate unique Hardware/OS Device ID
 */
function getDeviceId() {
    const hostname = os.hostname();
    const platform = os.platform();
    const arch = os.arch();
    const cpus = os.cpus();
    const cpuModel = cpus.length > 0 ? cpus[0].model.replace(/\s+/g, '_') : 'cpu';
    return Buffer.from(`${hostname}-${platform}-${arch}-${cpuModel}`).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 32);
}

agentState.deviceId = getDeviceId();

// ─── Active Task ID Linking (Requirement 2 & 5) ──────────────────────────────
/**
 * Receive and update the active taskId from frontend
 */
ipcMain.on('task:set-active', (event, taskId) => {
    // Validate taskId safely (string non-empty or null)
    const sanitizedTaskId = (typeof taskId === 'string' && taskId.trim().length > 0)
        ? taskId.trim()
        : null;

    const previousTask = agentState.activeTaskId;
    agentState.activeTaskId = sanitizedTaskId;

    console.log(`[Desktop Agent] Active Task ID updated: [${previousTask || 'None'}] → [${agentState.activeTaskId || 'None'}]`);

    // Broadcast update confirmation to renderer
    if (event && event.sender && !event.sender.isDestroyed()) {
        event.sender.send('task:active-updated', agentState.activeTaskId);
    }
});

/**
 * Return current active taskId synchronously/asynchronously to IPC callers
 */
ipcMain.handle('task:get-active', () => {
    return agentState.activeTaskId;
});

// ─── Blacklist & Violation Detection (Requirement 3) ─────────────────────────
/**
 * Detect if active application or window title violates blacklist configuration
 * @param {string} appName - Process or application name
 * @param {string} windowTitle - Active foreground window title / URL
 * @returns {{ isViolation: boolean, violationType: string|null, matched: string|null }}
 */
function checkBlacklistViolation(appName, windowTitle) {
    const appLower = (appName || '').toLowerCase();
    const titleLower = (windowTitle || '').toLowerCase();

    for (const keyword of BLACKLISTED_KEYWORDS) {
        const isAppMatch = appLower.includes(keyword);
        const isUrlOrTitleMatch = titleLower.includes(keyword);

        if (isAppMatch || isUrlOrTitleMatch) {
            const isUrl = isUrlOrTitleMatch && (titleLower.includes('.com') || titleLower.includes('.tv') || titleLower.includes('http') || titleLower.includes('www'));
            return {
                isViolation: true,
                violationType: isUrl ? 'BLACKLISTED_URL' : 'BLACKLISTED_APP',
                matched: keyword
            };
        }
    }

    return { isViolation: false, violationType: null, matched: null };
}

// ─── Native Windows Window & Screen Capture Helpers ──────────────────────────
/**
 * Get Foreground Window Title & Process Name using PowerShell
 */
function getActiveWindowInfo() {
    return new Promise((resolve) => {
        // Fast PowerShell script to read active foreground window
        const script = `
        Add-Type @"
            using System;
            using System.Runtime.InteropServices;
            using System.Text;
            public class WinInfo {
                [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
                [DllImport("user32.dll")] public static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int count);
                [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);
            }
"@
        $hwnd = [WinInfo]::GetForegroundWindow()
        $sb = New-Object System.Text.StringBuilder 256
        [void][WinInfo]::GetWindowText($hwnd, $sb, 256)
        $title = $sb.ToString()
        $pidOut = 0
        [WinInfo]::GetWindowThreadProcessId($hwnd, [ref]$pidOut)
        $proc = Get-Process -Id $pidOut -ErrorAction SilentlyContinue
        $pName = if ($proc) { $proc.ProcessName } else { "Unknown" }
        Write-Output "$pName|$title"
        `;

        exec(`powershell -NoProfile -NonInteractive -Command "${script.replace(/\r?\n/g, ' ')}"`, { timeout: 4000 }, (err, stdout) => {
            if (err || !stdout.trim()) {
                resolve({ appName: 'Desktop', windowTitle: 'Desktop' });
                return;
            }
            const parts = stdout.trim().split('|');
            const appName = parts[0]?.trim() || 'Unknown';
            const windowTitle = parts.slice(1).join('|')?.trim() || appName;
            resolve({ appName, windowTitle });
        });
    });
}

/**
 * Capture Desktop Screenshot to Base64 JPEG
 */
function captureScreenBase64() {
    return new Promise((resolve, reject) => {
        // Native Windows GDI+ screen capture to base64 jpeg
        const script = `
        Add-Type -AssemblyName System.Windows.Forms
        Add-Type -AssemblyName System.Drawing
        $screen = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
        $bitmap = New-Object System.Drawing.Bitmap $screen.Width, $screen.Height
        $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
        $graphics.CopyFromScreen($screen.Location, [System.Drawing.Point]::Empty, $screen.Size)
        $ms = New-Object System.IO.MemoryStream
        $codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
        $ep = New-Object System.Drawing.Imaging.EncoderParameters 1
        $ep.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality, [long]65)
        $bitmap.Save($ms, $codec, $ep)
        $bytes = $ms.ToArray()
        $base64 = [Convert]::ToBase64String($bytes)
        $graphics.Dispose()
        $bitmap.Dispose()
        $ms.Dispose()
        Write-Output "data:image/jpeg;base64,$base64"
        `;

        exec(`powershell -NoProfile -NonInteractive -Command "${script.replace(/\r?\n/g, ' ')}"`, { maxBuffer: 10 * 1024 * 1024, timeout: 8000 }, (err, stdout) => {
            if (err) return reject(err);
            const b64 = stdout.trim();
            if (b64.startsWith('data:image/')) {
                resolve(b64);
            } else {
                reject(new Error('Invalid screenshot output'));
            }
        });
    });
}

// ─── Heartbeat Mechanism (Task-Aware) ─────────────────────────────────────────
async function sendHeartbeat() {
    if (!agentState.deviceId) return;
    try {
        const payload = {
            deviceId: agentState.deviceId,
            taskId: agentState.activeTaskId || null, // Requirement 2 & 5
        };

        const res = await axios.post(`${API_URL}/api/agent/heartbeat`, payload, { timeout: 8000 });
        console.log(`[Heartbeat] Pulse sent for device ${agentState.deviceId} (Active Task: ${agentState.activeTaskId || 'None'}). Status: ${res.data?.message || 'OK'}`);
    } catch (err) {
        console.warn(`[Heartbeat] Failed: ${err.response?.data?.message || err.message}`);
    }
}

// ─── Activity & Screenshot Logging (Task-Aware & Instant Violation) ───────────
async function sendActivityLog(dataPayload) {
    if (!agentState.employeeId || !agentState.agentToken) return;

    try {
        const fullPayload = {
            employeeId: agentState.employeeId,
            taskId: agentState.activeTaskId || null, // Attached to top-level request
            data: {
                ...dataPayload,
                taskId: agentState.activeTaskId || null, // Attached to inner activity data
            }
        };

        const res = await axios.post(`${API_URL}/api/agent/activity`, fullPayload, {
            headers: {
                'X-Agent-Auth': agentState.agentToken,
                'Content-Type': 'application/json'
            },
            timeout: 15000
        });

        console.log(`[ActivityLog] Logged successfully. App: ${dataPayload.activeApp}, Task: ${agentState.activeTaskId || 'None'}, Violation: ${dataPayload.violation ? dataPayload.violationType : 'None'}`);
        return res.data;
    } catch (err) {
        console.error(`[ActivityLog] Upload failed: ${err.response?.data?.message || err.message}`);
    }
}

/**
 * Activity-Triggered Instant Screenshot Handler (Requirement 3)
 */
async function handleViolationScreenshot(appName, windowTitle, violationType) {
    const violationKey = `${appName}:${windowTitle}`;
    const now = Date.now();

    // Debounce / Cooldown check: avoid continuous spam for the same violation
    if (lastViolation.key === violationKey && (now - lastViolation.timestamp) < VIOLATION_COOLDOWN_MS) {
        return; // Continuous violation within cooldown, skip duplicate screenshot
    }

    lastViolation.key = violationKey;
    lastViolation.timestamp = now;

    console.warn(`[VIOLATION DETECTED] App: "${appName}", Title: "${windowTitle}". Triggering INSTANT screenshot...`);

    try {
        const screenshotUrl = await captureScreenBase64();
        
        await sendActivityLog({
            activeApp: appName,
            activeWindow: windowTitle,
            idleTime: 0,
            screenshotUrl,
            timestamp: new Date().toISOString(),
            violation: true,
            violationType,
            taskId: agentState.activeTaskId || null
        });

        // Notify renderer UI if open
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('agent:violation-detected', {
                appName,
                windowTitle,
                violationType,
                taskId: agentState.activeTaskId || null,
                timestamp: new Date().toISOString()
            });
        }
    } catch (err) {
        console.error('[Violation Screenshot] Capture failed:', err.message);
    }
}

// ─── Idle Activity Reporting to Backend (Requirement 4 & 5) ─────────────────
async function sendIdleActivityEvent({ status, idleDuration, timestamp, idleStartTime, taskId }) {
    if (!agentState.employeeId || !agentState.agentToken) return;

    try {
        const payload = {
            employeeId: agentState.employeeId,
            taskId: taskId || agentState.activeTaskId || null,
            status, // 'IDLE' | 'RESUMED' | 'ACTIVE'
            idleDuration: idleDuration || 0,
            idleStartTime,
            timestamp: timestamp || new Date().toISOString()
        };

        const res = await axios.post(`${API_URL}/api/agent/idle-activity`, payload, {
            headers: {
                'X-Agent-Auth': agentState.agentToken,
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });

        console.log(`[SmartIdle] Idle event '${status}' reported to backend. Email alert sent: ${res.data?.data?.emailSent ? 'Yes' : 'Simulated'}`);
        return res.data;
    } catch (err) {
        console.error(`[SmartIdle] Failed to report idle event '${status}':`, err.response?.data?.message || err.message);
    }
}

/**
 * Periodically evaluate system idle time from OS
 * Detects transitions between ACTIVE and IDLE without recording text/passwords
 */
async function checkIdleActivity() {
    if (!agentState.isTracking && agentState.status !== 'active') return;

    const idleSeconds = getSystemInactivitySeconds();
    idleState.lastIdleSeconds = idleSeconds;
    const now = Date.now();
    const threshold = idleConfig.thresholdSeconds;

    // Detect Transition: ACTIVE -> IDLE
    if (idleSeconds >= threshold) {
        if (idleState.currentStatus !== 'IDLE') {
            idleState.currentStatus = 'IDLE';
            idleState.idleStartTime = new Date(now - (idleSeconds * 1000)).toISOString();
            console.log(`[SmartIdle] IDLE DETECTED: No mouse/keyboard input for ${idleSeconds}s (Threshold: ${threshold}s).`);

            // Send IDLE event once per idle session (prevents repeated spam)
            if (!idleState.hasSentIdleAlert) {
                idleState.hasSentIdleAlert = true;
                await sendIdleActivityEvent({
                    status: 'IDLE',
                    idleDuration: idleSeconds,
                    timestamp: new Date().toISOString(),
                    idleStartTime: idleState.idleStartTime,
                    taskId: agentState.activeTaskId || null
                });

                // Notify renderer UI if window open
                if (mainWindow && !mainWindow.isDestroyed()) {
                    mainWindow.webContents.send('idle:state-changed', {
                        status: 'IDLE',
                        idleDuration: idleSeconds,
                        idleStartTime: idleState.idleStartTime
                    });
                }
            }
        }
    } else {
        // Employee has active mouse/keyboard input (idleSeconds < threshold)
        idleState.lastActiveTimestamp = now;

        // Detect Transition: IDLE -> RESUMED / ACTIVE
        if (idleState.currentStatus === 'IDLE') {
            const idleEndTime = new Date().toISOString();
            const totalIdleDuration = idleState.idleStartTime
                ? Math.max(threshold, Math.round((now - new Date(idleState.idleStartTime).getTime()) / 1000))
                : idleSeconds;

            console.log(`[SmartIdle] RESUMED: Mouse/keyboard activity resumed after ${totalIdleDuration}s. Returning to ACTIVE state.`);

            idleState.currentStatus = 'ACTIVE';
            idleState.hasSentIdleAlert = false; // Reset for next idle session

            await sendIdleActivityEvent({
                status: 'RESUMED',
                idleDuration: totalIdleDuration,
                timestamp: idleEndTime,
                idleStartTime: idleState.idleStartTime,
                taskId: agentState.activeTaskId || null
            });

            // Notify renderer UI
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('idle:state-changed', {
                    status: 'ACTIVE',
                    idleDuration: 0
                });
            }

            idleState.idleStartTime = null;
        }
    }
}

// ─── Active Window & Activity Monitoring Loop ────────────────────────────────
let activityMonitoringInterval = null;
let routineScreenshotInterval = null;
let heartbeatInterval = null;
let idleMonitoringInterval = null;

function startMonitoringLoops() {
    if (agentState.isTracking) return;
    agentState.isTracking = true;

    console.log('[Desktop Agent] Monitoring loops started.');

    // 1. High frequency Window & Blacklist Detection (every 3 seconds)
    activityMonitoringInterval = setInterval(async () => {
        try {
            const { appName, windowTitle } = await getActiveWindowInfo();

            // Check blacklist violation
            const { isViolation, violationType } = checkBlacklistViolation(appName, windowTitle);

            if (isViolation) {
                // Instant violation screenshot triggered!
                await handleViolationScreenshot(appName, windowTitle, violationType);
            }
        } catch (err) {
            console.error('[Window Check Error]:', err.message);
        }
    }, 3000);

    // 2. Smart Idle & Inactivity Monitoring (every 5 seconds)
    idleMonitoringInterval = setInterval(checkIdleActivity, idleConfig.checkIntervalMs);
    checkIdleActivity(); // Immediate first check

    // 3. Routine Screenshot & Activity Log (every 3 minutes)
    routineScreenshotInterval = setInterval(async () => {
        try {
            const { appName, windowTitle } = await getActiveWindowInfo();
            const screenshotUrl = await captureScreenBase64().catch(() => null);

            await sendActivityLog({
                activeApp: appName,
                activeWindow: windowTitle,
                idleTime: idleState.lastIdleSeconds || 0,
                screenshotUrl,
                timestamp: new Date().toISOString(),
                violation: false,
                taskId: agentState.activeTaskId || null
            });
        } catch (err) {
            console.error('[Routine Screenshot Error]:', err.message);
        }
    }, 3 * 60 * 1000);

    // 4. Heartbeat (every 60 seconds)
    heartbeatInterval = setInterval(sendHeartbeat, 60 * 1000);
    sendHeartbeat(); // Immediate first pulse
}

function stopMonitoringLoops() {
    if (activityMonitoringInterval) clearInterval(activityMonitoringInterval);
    if (routineScreenshotInterval) clearInterval(routineScreenshotInterval);
    if (heartbeatInterval) clearInterval(heartbeatInterval);
    if (idleMonitoringInterval) clearInterval(idleMonitoringInterval);
    activityMonitoringInterval = null;
    routineScreenshotInterval = null;
    heartbeatInterval = null;
    idleMonitoringInterval = null;
    agentState.isTracking = false;
    console.log('[Desktop Agent] Monitoring loops stopped.');
}

// ─── Agent Registration & IPC System Info Handlers ────────────────────────────
ipcMain.handle('agent:get-system-info', () => {
    return {
        deviceId: agentState.deviceId,
        hostname: os.hostname(),
        platform: os.platform(),
        arch: os.arch(),
        activeTaskId: agentState.activeTaskId
    };
});

ipcMain.handle('agent:get-status', () => {
    return {
        ...agentState
    };
});

ipcMain.handle('agent:register', async (_event, credentials) => {
    try {
        const payload = {
            ...credentials,
            deviceId: agentState.deviceId,
            systemInfo: {
                hostname: os.hostname(),
                platform: os.platform(),
                arch: os.arch()
            }
        };

        const res = await axios.post(`${API_URL}/api/agent/register`, payload);
        if (res.data?.success && res.data?.data) {
            agentState.employeeId = res.data.data.agent.employeeId;
            agentState.agentToken = res.data.data.token;
            agentState.status = res.data.data.agent.status;

            if (agentState.status === 'active') {
                startMonitoringLoops();
            }
            return { success: true, agent: res.data.data.agent };
        }
        return { success: false, message: res.data?.message || 'Registration failed' };
    } catch (err) {
        return { success: false, message: err.response?.data?.message || err.message };
    }
});

ipcMain.handle('agent:manual-capture', async () => {
    try {
        const { appName, windowTitle } = await getActiveWindowInfo();
        const screenshotUrl = await captureScreenBase64();
        await sendActivityLog({
            activeApp: appName,
            activeWindow: windowTitle,
            idleTime: 0,
            screenshotUrl,
            timestamp: new Date().toISOString(),
            violation: false,
            taskId: agentState.activeTaskId || null
        });
        return { success: true };
    } catch (err) {
        return { success: false, message: err.message };
    }
});

// ─── Electron Window Creation ────────────────────────────────────────────────
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 460,
        height: 680,
        resizable: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
        title: 'EMS Desktop Tracker Agent',
        autoHideMenuBar: true
    });

    mainWindow.loadFile(path.join(__dirname, 'index.html'));

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        stopMonitoringLoops();
        app.quit();
    }
});

ipcMain.handle('idle:get-status', () => {
    return {
        ...idleState,
        inactivitySeconds: getSystemInactivitySeconds(),
        thresholdSeconds: idleConfig.thresholdSeconds
    };
});

ipcMain.on('idle:set-threshold', (_event, seconds) => {
    const sec = parseInt(seconds, 10);
    if (!isNaN(sec) && sec > 0) {
        idleConfig.thresholdSeconds = sec;
        console.log(`[SmartIdle] Inactivity threshold updated to ${sec}s (${Math.round(sec / 60)}m).`);
    }
});

module.exports = {
    agentState,
    idleState,
    idleConfig,
    checkIdleActivity,
    sendIdleActivityEvent,
    checkBlacklistViolation,
    sendHeartbeat,
    sendActivityLog,
    handleViolationScreenshot
};
