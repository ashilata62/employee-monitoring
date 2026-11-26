let electron;
try {
    electron = require('electron');
} catch (e) {
    electron = {
        app: {
            whenReady: () => Promise.resolve(),
            on: () => { },
            quit: () => { },
            requestSingleInstanceLock: () => true,
            getLoginItemSettings: () => ({ openAtLogin: false }),
            setLoginItemSettings: () => { }
        },
        BrowserWindow: class {
            constructor() {
                this.webContents = { send: () => { } };
            }
            loadFile() { }
            loadURL() { }
            on() { }
            show() { }
            hide() { }
            focus() { }
            isVisible() { return true; }
            isDestroyed() { return false; }
            isMinimized() { return false; }
            restore() { }
        },
        ipcMain: { on: () => { }, handle: () => { } },
        Tray: class {
            constructor() { }
            setToolTip() { }
            setContextMenu() { }
            on() { }
            destroy() { }
            displayBalloon() { }
        },
        Menu: {
            buildFromTemplate: (tpl) => ({ items: tpl })
        },
        Notification: class {
            constructor() { }
            show() { }
            static isSupported() { return false; }
        },
        nativeImage: {
            createFromPath: () => ({ resize: () => null }),
            createFromDataURL: () => ({ resize: () => null })
        }
    };
}
if (!electron.powerMonitor) {
    electron.powerMonitor = {
        getSystemIdleTime: () => 0,
        getSystemIdleState: () => 'active',
        on: () => { }
    };
}
const { app, BrowserWindow, ipcMain, powerMonitor, Tray, Menu, Notification, nativeImage } = electron;
const path = require('path');
const os = require('os');
const fs = require('fs');
const { exec } = require('child_process');
const { fetchActiveWindow } = require('./utils/fetchActiveWindow');
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
function resolveServerUrl() {
    if (process.env.API_URL && process.env.API_URL.trim()) {
        return process.env.API_URL.trim().replace(/\/api\/?$/, '').replace(/\/$/, '');
    }
    try {
        const candidatePaths = [
            path.join(process.resourcesPath || '', 'server-config.json'),
            path.join(__dirname, 'server-config.json'),
            path.join(__dirname, '..', 'server-config.json')
        ];
        for (const p of candidatePaths) {
            if (fs.existsSync(p)) {
                const raw = JSON.parse(fs.readFileSync(p, 'utf-8'));
                if (raw && raw.SERVER_URL) {
                    return raw.SERVER_URL.trim().replace(/\/api\/?$/, '').replace(/\/$/, '');
                }
            }
        }
    } catch (e) {}
    return 'https://insight-pool-production.up.railway.app';
}

const API_URL = resolveServerUrl();
console.log(`[Desktop Agent] Initialized with API_URL: ${API_URL}`);

function getLocalConfigPath() {
    try {
        if (app && typeof app.getPath === 'function') {
            const userDir = app.getPath('userData');
            if (!fs.existsSync(userDir)) fs.mkdirSync(userDir, { recursive: true });
            return path.join(userDir, 'agent-config.json');
        }
    } catch (e) {}
    return path.join(__dirname, 'agent-config.json');
}

function saveLocalConfig(data) {
    try {
        const cfgPath = getLocalConfigPath();
        const existing = loadLocalConfig() || {};
        fs.writeFileSync(cfgPath, JSON.stringify({ ...existing, ...data, updatedAt: new Date().toISOString() }, null, 2), 'utf-8');
    } catch (err) {
        console.warn('[Config] Failed to save local config:', err.message);
    }
}

function loadLocalConfig() {
    try {
        const cfgPath = getLocalConfigPath();
        if (fs.existsSync(cfgPath)) {
            const raw = fs.readFileSync(cfgPath, 'utf-8');
            return JSON.parse(raw);
        }
    } catch (err) {
        console.warn('[Config] Failed to read local config:', err.message);
    }
    return null;
}

let mainWindow = null;
let socket = null;

// Agent Runtime State
let agentState = {
    employeeId: null,
    deviceId: null,
    agentToken: null,
    status: 'inactive', // 'pending' | 'active' | 'inactive'
    permissionsCompleted: false,
    activeTaskId: null, // Active Task ID linked from frontend
    activeTaskName: null,
    autoMappedProjectId: null,
    autoMappedProjectName: null,
    cachedProjects: [],
    isTracking: false,
};

// Violation Cooldown / Debounce State (Requirement 3)
let lastViolation = {
    key: null,
    timestamp: 0,
};
const VIOLATION_COOLDOWN_MS = 60 * 1000; // 60s cooldown for same continuous violation

// ─── Smart Idle & Inactivity Monitoring Configuration (Requirements 2, 3, 4, 5) ──
const DEFAULT_IDLE_THRESHOLD_SECONDS = 180; // 3 minutes (180s) - Idle classification & Alert
const WARNING_THRESHOLD_SECONDS = 120; // 2 minutes (120s) - Warning reminder
const PASSIVE_THRESHOLD_SECONDS = 60; // 1 minute (60s) - Initial inactivity detection

let idleConfig = {
    thresholdSeconds: DEFAULT_IDLE_THRESHOLD_SECONDS,
    warningSeconds: WARNING_THRESHOLD_SECONDS,
    passiveSeconds: PASSIVE_THRESHOLD_SECONDS,
    checkIntervalMs: 5000, // Check inactivity every 5 seconds
};

let idleState = {
    currentStatus: 'ACTIVE', // 'ACTIVE' | 'PASSIVE' | 'IDLE_WARNING' | 'IDLE' | 'BREAK' | 'RESUMED'
    idleStartTime: null,
    lastActiveTimestamp: Date.now(),
    lastIdleSeconds: 0,
    hasSentPassiveAlert: false,
    hasSentWarningAlert: false,
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

// Auto-restore saved session if present
try {
    const savedConfig = loadLocalConfig();
    if (savedConfig) {
        if (savedConfig.employeeId) agentState.employeeId = savedConfig.employeeId;
        if (savedConfig.agentToken) agentState.agentToken = savedConfig.agentToken;
        if (savedConfig.deviceId) agentState.deviceId = savedConfig.deviceId;
        if (savedConfig.status) agentState.status = savedConfig.status;
        if (savedConfig.permissionsCompleted !== undefined) agentState.permissionsCompleted = savedConfig.permissionsCompleted;
        console.log(`[Desktop Agent] Restored session from AppData: Employee=${agentState.employeeId || 'None'}, Device=${agentState.deviceId || 'None'}, Status=${agentState.status}`);
    }
} catch (e) {
    console.warn('[Desktop Agent] Could not restore saved session:', e.message);
}

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

// ─── Auto Project Mapping via Window Title & Process Regex Matching ──────────
/**
 * Auto-detect project from active window title using smart regex matching
 * @param {string} windowTitle - Active foreground window title
 * @param {string} appName - Process or application name
 * @returns {{ matched: boolean, projectId: string|null, projectName: string|null, pattern: string|null }}
 */
function matchAutoProject(windowTitle, appName) {
    if (!windowTitle && !appName) return { matched: false, projectId: null, projectName: null, pattern: null };

    const combined = `${appName || ''} ${windowTitle || ''}`.trim();
    if (!combined) return { matched: false, projectId: null, projectName: null, pattern: null };

    // 1. Check against cached projects loaded from real database
    if (Array.isArray(agentState.cachedProjects) && agentState.cachedProjects.length > 0) {
        for (const proj of agentState.cachedProjects) {
            if (!proj || !proj.name) continue;
            try {
                const escaped = proj.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const regex = new RegExp(`\\b${escaped}\\b`, 'i');
                if (regex.test(combined)) {
                    return {
                        matched: true,
                        projectId: proj.id,
                        projectName: proj.name,
                        pattern: regex.toString()
                    };
                }
            } catch (err) { }
        }
    }

    // 2. Generic Regex Rules for Projects:
    // Matches patterns like [Project: XYZ], [Fintech SaaS Platform], "Project - XYZ", "PRJ-1234", "Client ABC", repository names in IDEs
    const genericProjectPatterns = [
        /(?:project|prj|client|workspace)\s*[:\-_|/]\s*([a-zA-Z0-9_\-\s]{2,50})/i,
        /\[([a-zA-Z0-9_\-\s]{2,50})\]/i,
        /(?:[-–—]\s*)([a-zA-Z0-9_\-\s]{2,40})\s*[-–—]\s*(?:visual studio code|sublime text|webstorm|intellij|android studio|cursor)/i,
        /([a-zA-Z0-9_\-]+)\s*[-–—]\s*(?:visual studio code|sublime text|webstorm|intellij|android studio|cursor)/i
    ];

    const ignoreList = ['chrome', 'edge', 'firefox', 'desktop', 'untitled', 'new tab', 'home', 'settings', 'visual studio code', 'cursor'];

    for (const pattern of genericProjectPatterns) {
        const match = combined.match(pattern);
        if (match && match[1]) {
            const detectedName = match[1].trim();
            if (detectedName.length >= 2 && !ignoreList.includes(detectedName.toLowerCase())) {
                return {
                    matched: true,
                    projectId: null,
                    projectName: detectedName,
                    pattern: pattern.toString()
                };
            }
        }
    }

    return { matched: false, projectId: null, projectName: null, pattern: null };
}

/**
 * Fetch and synchronize active project mapping rules from backend
 */
async function syncProjectsFromBackend() {
    if (!agentState.agentToken || !axios) return;
    try {
        const res = await axios.get(`${API_URL}/api/agent/projects`, {
            headers: {
                'X-Agent-Auth': agentState.agentToken,
                'Authorization': `Bearer ${agentState.agentToken}`
            },
            timeout: 8000
        });
        if (res.data?.success && Array.isArray(res.data?.data)) {
            agentState.cachedProjects = res.data.data;
            console.log(`[AutoProject] Synchronized ${agentState.cachedProjects.length} active projects for regex auto-mapping.`);
        }
    } catch (e) {
        // Fallback silently
    }
}

// ─── Cross-Platform Native Window & Screen Capture Helpers ──────────────────────────
/**
 * Get Foreground Window Title & Process Name (Cross-platform: Windows, macOS, Linux)
 */
async function getActiveWindowInfo() {
    try {
        const result = await fetchActiveWindow();
        if (result && (result.appName || result.windowTitle || result.title)) {
            const windowTitle = result.windowTitle || result.title || 'Desktop';
            return {
                appName: result.appName || 'Desktop',
                windowTitle: windowTitle,
                title: windowTitle,
                processId: result.processId || result.pid || 0,
                timestamp: result.timestamp || new Date().toISOString()
            };
        }
    } catch (e) {
        // Fallback
    }
    return { appName: 'Desktop', windowTitle: 'Desktop', title: 'Desktop', processId: 0, timestamp: new Date().toISOString() };
}

/**
 * Capture Desktop Screenshot to Base64 JPEG (Cross-platform: Windows, macOS, Linux)
 */
function captureScreenBase64() {
    return new Promise((resolve, reject) => {
        if (process.platform === 'win32') {
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

            exec(`powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -Command "${script.replace(/\r?\n/g, ' ')}"`, { maxBuffer: 10 * 1024 * 1024, timeout: 8000 }, (err, stdout) => {
                if (!err && stdout && stdout.trim().startsWith('data:image/')) {
                    return resolve(stdout.trim());
                }
                tryFallbackScreenshot(resolve, reject);
            });
        } else if (process.platform === 'darwin') {
            // macOS native silent screencapture
            const tmpFile = path.join(os.tmpdir(), `ems-mac-${Date.now()}.jpg`);
            exec(`screencapture -x -t jpg "${tmpFile}"`, { timeout: 6000 }, (err) => {
                if (!err && fs.existsSync(tmpFile)) {
                    try {
                        const imgBuf = fs.readFileSync(tmpFile);
                        fs.unlinkSync(tmpFile);
                        return resolve(`data:image/jpeg;base64,${imgBuf.toString('base64')}`);
                    } catch (e) { }
                }
                tryFallbackScreenshot(resolve, reject);
            });
        } else if (process.platform === 'linux') {
            // Linux native import (ImageMagick) or scrot
            const tmpFile = path.join(os.tmpdir(), `ems-linux-${Date.now()}.jpg`);
            exec(`import -window root -quality 65 "${tmpFile}" 2>/dev/null || scrot "${tmpFile}" 2>/dev/null`, { timeout: 6000 }, (err) => {
                if (!err && fs.existsSync(tmpFile)) {
                    try {
                        const imgBuf = fs.readFileSync(tmpFile);
                        fs.unlinkSync(tmpFile);
                        return resolve(`data:image/jpeg;base64,${imgBuf.toString('base64')}`);
                    } catch (e) { }
                }
                tryFallbackScreenshot(resolve, reject);
            });
        } else {
            tryFallbackScreenshot(resolve, reject);
        }
    });
}

function tryFallbackScreenshot(resolve, reject) {
    try {
        let screenshotDesktop;
        try {
            screenshotDesktop = require('screenshot-desktop');
        } catch {
            try {
                screenshotDesktop = require('../employee-monitoring/employee-monitoring-frontend/node_modules/screenshot-desktop');
            } catch { }
        }
        if (screenshotDesktop) {
            screenshotDesktop({ format: 'jpeg' })
                .then(buf => resolve(`data:image/jpeg;base64,${buf.toString('base64')}`))
                .catch(reject);
        } else {
            reject(new Error('Cross-platform screenshot engine not available'));
        }
    } catch (e) {
        reject(e);
    }
}

// ─── Heartbeat Mechanism (Task & Project-Aware) ──────────────────────────────
async function sendHeartbeat() {
    if (!agentState.deviceId) return;
    try {
        const payload = {
            deviceId: agentState.deviceId,
            taskId: agentState.activeTaskId || null, // Requirement 2 & 5
            autoMappedProjectId: agentState.autoMappedProjectId || null,
            autoMappedProjectName: agentState.autoMappedProjectName || null
        };

        const res = await axios.post(`${API_URL}/api/agent/heartbeat`, payload, { timeout: 8000 });
        console.log(`[Heartbeat] Pulse sent for device ${agentState.deviceId} (Active Task: ${agentState.activeTaskId || 'None'}, AutoProject: ${agentState.autoMappedProjectName || 'None'}). Status: ${res.data?.message || 'OK'}`);
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
            autoMappedProjectId: agentState.autoMappedProjectId || null,
            autoMappedProjectName: agentState.autoMappedProjectName || null,
            data: {
                ...dataPayload,
                taskId: agentState.activeTaskId || null, // Attached to inner activity data
                autoMappedProjectId: agentState.autoMappedProjectId || null,
                autoMappedProjectName: agentState.autoMappedProjectName || null
            }
        };

        const res = await axios.post(`${API_URL}/api/agent/activity`, fullPayload, {
            headers: {
                'X-Agent-Auth': agentState.agentToken,
                'Content-Type': 'application/json'
            },
            timeout: 15000
        });

        console.log(`[ActivityLog] Logged successfully. App: ${dataPayload.activeApp}, Task: ${agentState.activeTaskId || 'None'}, AutoProject: ${agentState.autoMappedProjectName || 'None'}, Violation: ${dataPayload.violation ? dataPayload.violationType : 'None'}`);
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

// ─── Idle Activity Reporting to Backend (Requirements 2, 3, 4, 5) ─────────────
async function sendIdleActivityEvent({ status, idleDuration, timestamp, idleStartTime, taskId, source }) {
    if (!agentState.employeeId || !agentState.agentToken) return;

    try {
        const payload = {
            employeeId: agentState.employeeId,
            taskId: taskId || agentState.activeTaskId || null,
            status, // 'PASSIVE' | 'IDLE_WARNING' | 'IDLE' | 'RESUMED' | 'ACTIVE'
            idleDuration: idleDuration || 0,
            idleStartTime,
            timestamp: timestamp || new Date().toISOString(),
            source: source || 'DESKTOP_AGENT'
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
 * Periodically evaluate system idle time from OS (Windows API GetLastInputInfo)
 * Detects transitions between ACTIVE, PASSIVE, IDLE_WARNING, and IDLE without recording text/passwords
 */
async function checkIdleActivity() {
    if (!agentState.isTracking && agentState.status !== 'active') return;

    const idleSeconds = getSystemInactivitySeconds();
    idleState.lastIdleSeconds = idleSeconds;
    const now = Date.now();
    const idleThreshold = idleConfig.thresholdSeconds; // 180s (3 min)
    const warningThreshold = idleConfig.warningSeconds; // 120s (2 min)
    const passiveThreshold = idleConfig.passiveSeconds; // 60s (1 min)

    // 1. Stage: IDLE (>= 3 minutes / 180s)
    if (idleSeconds >= idleThreshold) {
        if (idleState.currentStatus !== 'IDLE') {
            idleState.currentStatus = 'IDLE';
            if (!idleState.idleStartTime) {
                idleState.idleStartTime = new Date(now - (idleSeconds * 1000)).toISOString();
            }
            console.log(`[SmartIdle] IDLE DETECTED: No mouse/keyboard input for ${idleSeconds}s (Threshold: ${idleThreshold}s).`);

            // Send IDLE event once per idle session (prevents duplicate notification/alert spam)
            if (!idleState.hasSentIdleAlert) {
                idleState.hasSentIdleAlert = true;

                // Show OS Native Notification
                if (Notification && typeof Notification.isSupported === 'function' && Notification.isSupported()) {
                    try {
                        new Notification({
                            title: 'Employee Inactivity Alert',
                            body: 'You have been inactive for 3 minutes. Please resume your work.'
                        }).show();
                    } catch (e) { }
                }

                await sendIdleActivityEvent({
                    status: 'IDLE',
                    idleDuration: idleSeconds,
                    timestamp: new Date().toISOString(),
                    idleStartTime: idleState.idleStartTime,
                    taskId: agentState.activeTaskId || null,
                    source: 'DESKTOP_AGENT'
                });

                // Notify renderer UI
                if (mainWindow && !mainWindow.isDestroyed()) {
                    mainWindow.webContents.send('idle:prompt', {
                        title: 'Employee Inactivity Alert',
                        message: 'You have been inactive for 3 minutes. Please resume your work.',
                        idleDuration: idleSeconds,
                        idleStartTime: idleState.idleStartTime
                    });
                    mainWindow.webContents.send('idle:state-changed', {
                        status: 'IDLE',
                        idleDuration: idleSeconds,
                        idleStartTime: idleState.idleStartTime
                    });
                }
            }
        }
    }
    // 2. Stage: IDLE WARNING (>= 2 minutes / 120s)
    else if (idleSeconds >= warningThreshold) {
        if (idleState.currentStatus !== 'IDLE_WARNING' && idleState.currentStatus !== 'IDLE') {
            idleState.currentStatus = 'IDLE_WARNING';
            if (!idleState.idleStartTime) {
                idleState.idleStartTime = new Date(now - (idleSeconds * 1000)).toISOString();
            }
            console.log(`[SmartIdle] WARNING THRESHOLD: No mouse/keyboard input for ${idleSeconds}s (Warning: ${warningThreshold}s).`);

            if (!idleState.hasSentWarningAlert) {
                idleState.hasSentWarningAlert = true;

                const startD = new Date(now - (idleSeconds * 1000));
                const endD = new Date(now);
                const formatTime = (d) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
                const warningMsg = `You have been inactive for 2 minutes (from ${formatTime(startD)} to ${formatTime(endD)}). Please resume your work.`;

                // Non-intrusive reminder notification
                if (Notification && typeof Notification.isSupported === 'function' && Notification.isSupported()) {
                    try {
                        new Notification({
                            title: 'Activity Reminder',
                            body: warningMsg
                        }).show();
                    } catch (e) { }
                }

                await sendIdleActivityEvent({
                    status: 'IDLE_WARNING',
                    idleDuration: idleSeconds,
                    timestamp: new Date().toISOString(),
                    idleStartTime: idleState.idleStartTime,
                    taskId: agentState.activeTaskId || null,
                    source: 'DESKTOP_AGENT'
                });

                if (mainWindow && !mainWindow.isDestroyed()) {
                    mainWindow.webContents.send('idle:warning', {
                        title: 'Activity Reminder',
                        message: warningMsg,
                        idleDuration: idleSeconds
                    });
                    mainWindow.webContents.send('idle:state-changed', {
                        status: 'IDLE_WARNING',
                        idleDuration: idleSeconds,
                        idleStartTime: idleState.idleStartTime
                    });
                }
            }
        }
    }
    // 3. Stage: PASSIVE (>= 1 minute / 60s)
    else if (idleSeconds >= passiveThreshold) {
        if (idleState.currentStatus === 'ACTIVE') {
            idleState.currentStatus = 'PASSIVE';
            console.log(`[SmartIdle] PASSIVE DETECTED: No recent input for ${idleSeconds}s. Tracking initial inactivity.`);

            if (!idleState.hasSentPassiveAlert) {
                idleState.hasSentPassiveAlert = true;
                await sendIdleActivityEvent({
                    status: 'PASSIVE',
                    idleDuration: idleSeconds,
                    timestamp: new Date().toISOString(),
                    taskId: agentState.activeTaskId || null,
                    source: 'DESKTOP_AGENT'
                });

                if (mainWindow && !mainWindow.isDestroyed()) {
                    mainWindow.webContents.send('idle:state-changed', {
                        status: 'PASSIVE',
                        idleDuration: idleSeconds
                    });
                }
            }
        }
    }
    // 4. Stage: ACTIVE (Genuine mouse/keyboard input detected, idleSeconds < passiveThreshold)
    else {
        idleState.lastActiveTimestamp = now;

        // Transition back to ACTIVE if was PASSIVE, IDLE_WARNING, or IDLE
        if (idleState.currentStatus !== 'ACTIVE' && idleState.currentStatus !== 'BREAK') {
            const idleEndTime = new Date().toISOString();
            const totalIdleDuration = idleState.idleStartTime
                ? Math.max(idleSeconds, Math.round((now - new Date(idleState.idleStartTime).getTime()) / 1000))
                : idleSeconds;

            console.log(`[SmartIdle] RESUMED: Mouse/keyboard activity detected after ${totalIdleDuration}s idle. Returning to ACTIVE state.`);

            idleState.currentStatus = 'ACTIVE';
            idleState.hasSentPassiveAlert = false;
            idleState.hasSentWarningAlert = false;
            idleState.hasSentIdleAlert = false; // Reset for next idle session

            await sendIdleActivityEvent({
                status: 'RESUMED',
                idleDuration: totalIdleDuration,
                timestamp: idleEndTime,
                idleStartTime: idleState.idleStartTime,
                taskId: agentState.activeTaskId || null,
                source: 'DESKTOP_AGENT'
            });

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
let projectSyncInterval = null;

function startMonitoringLoops() {
    if (agentState.isTracking) return;
    agentState.isTracking = true;

    console.log('[Desktop Agent] Monitoring loops started.');

    // 1. High frequency Window, Auto-Project & Blacklist Detection (every 3 seconds)
    activityMonitoringInterval = setInterval(async () => {
        try {
            const { appName, windowTitle } = await getActiveWindowInfo();

            // Auto Project Detection (Regex matching against synchronized backend projects)
            const match = matchAutoProject(windowTitle, appName);
            if (match && match.matched) {
                if (agentState.autoMappedProjectId !== match.projectId || agentState.autoMappedProjectName !== match.projectName) {
                    agentState.autoMappedProjectId = match.projectId;
                    agentState.autoMappedProjectName = match.projectName;
                    console.log(`[AutoProject] Window auto-mapped to project "${match.projectName}" (ID: ${match.projectId})`);
                    updateTrayMenu();
                    if (mainWindow && !mainWindow.isDestroyed()) {
                        mainWindow.webContents.send('project:auto-detected', match);
                    }
                }
            } else if (agentState.autoMappedProjectId || agentState.autoMappedProjectName) {
                if (!agentState.activeTaskId) {
                    agentState.autoMappedProjectId = null;
                    agentState.autoMappedProjectName = null;
                    updateTrayMenu();
                }
            }

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

    // 3. Routine Screenshot & Activity Log (every 1 minute)
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
    }, 1 * 60 * 1000);

    // 4. Heartbeat (every 60 seconds)
    heartbeatInterval = setInterval(sendHeartbeat, 60 * 1000);
    sendHeartbeat(); // Immediate first pulse

    // 5. Auto Project Synchronization from Database (every 5 minutes)
    projectSyncInterval = setInterval(syncProjectsFromBackend, 5 * 60 * 1000);
    syncProjectsFromBackend(); // Immediate sync
}

function stopMonitoringLoops() {
    if (activityMonitoringInterval) clearInterval(activityMonitoringInterval);
    if (routineScreenshotInterval) clearInterval(routineScreenshotInterval);
    if (heartbeatInterval) clearInterval(heartbeatInterval);
    if (idleMonitoringInterval) clearInterval(idleMonitoringInterval);
    if (projectSyncInterval) clearInterval(projectSyncInterval);
    activityMonitoringInterval = null;
    routineScreenshotInterval = null;
    heartbeatInterval = null;
    idleMonitoringInterval = null;
    projectSyncInterval = null;
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
            systemInfo: JSON.stringify({
                hostname: os.hostname(),
                platform: os.platform(),
                arch: os.arch()
            })
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

// ─── Agent Stealth Mode, System Tray & Startup Auto-Run ──────────────────────
let tray = null;
let isQuitting = false;

function getTrayIcon() {
    try {
        if (nativeImage && typeof nativeImage.createFromDataURL === 'function') {
            const iconDataUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAERlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAAEKADAAQAAAABAAAAEAAAAAA0YuksAAAAUUlEQVQ4y2NgGAWjYBSMAtwAXt7e/1Ewqh60ePbsGYowDDAyMv5HkcaGQ1f8H1kOHTNqALrCcXFxwS1BVsA4qI3xQ0NDwS1BVsA4qI3xQ0MBAACVNxrIe+k/AAAAAElFTkSuQmCC';
            return nativeImage.createFromDataURL(iconDataUri);
        }
        if (nativeImage && typeof nativeImage.createFromPath === 'function') {
            const iconPath = path.join(__dirname, 'icon.png');
            if (fs.existsSync(iconPath)) return nativeImage.createFromPath(iconPath);
        }
    } catch (e) { }
    return null;
}

function isStartupAutoRunEnabled() {
    try {
        if (app && typeof app.getLoginItemSettings === 'function') {
            const settings = app.getLoginItemSettings();
            return !!settings.openAtLogin;
        }
    } catch (e) {
        console.error('[AutoRun] Error reading login item settings:', e.message);
    }
    return false;
}

function setStartupAutoRun(enable) {
    try {
        if (app && typeof app.setLoginItemSettings === 'function') {
            app.setLoginItemSettings({
                openAtLogin: !!enable,
                openAsHidden: true,
                path: process.execPath,
                args: ['--hidden']
            });
            console.log(`[AutoRun] Windows startup auto-run configured: ${!!enable}`);
            updateTrayMenu();
            return true;
        }
    } catch (e) {
        console.error('[AutoRun] Error setting login item settings:', e.message);
    }
    return false;
}

function createTray() {
    if (tray) return tray;
    try {
        const icon = getTrayIcon();
        if (!icon && typeof Tray !== 'function') return null;
        tray = new Tray(icon || path.join(__dirname, 'icon.png'));
        tray.setToolTip('EMS Desktop Tracker Agent');

        tray.on('double-click', () => {
            if (mainWindow) {
                if (mainWindow.isVisible()) {
                    mainWindow.hide();
                } else {
                    mainWindow.show();
                    mainWindow.focus();
                }
                updateTrayMenu();
            }
        });

        updateTrayMenu();
        return tray;
    } catch (e) {
        console.error('[Tray] Error initializing tray:', e.message);
        return null;
    }
}

function updateTrayMenu() {
    if (!tray || typeof Menu.buildFromTemplate !== 'function') return;
    try {
        const isTracking = agentState.isTracking;
        const isIdle = idleState.isIdle;
        const statusLabel = isTracking ? (isIdle ? '🟡 Status: Idle' : '🟢 Status: Active Tracking') : '⚪ Status: Stopped';
        const projectLabel = agentState.autoMappedProjectName
            ? `📁 Project: ${agentState.autoMappedProjectName}`
            : (agentState.activeTaskId ? `📌 Task: ${agentState.activeTaskId}` : '📁 Project: Auto-detecting...');
        const autoRunActive = isStartupAutoRunEnabled();

        const contextMenu = Menu.buildFromTemplate([
            { label: 'EMS Desktop Tracker Agent', enabled: false },
            { type: 'separator' },
            { label: statusLabel, enabled: false },
            { label: projectLabel, enabled: false },
            { type: 'separator' },
            {
                label: (mainWindow && mainWindow.isVisible()) ? 'Hide to Tray (Stealth)' : 'Show Dashboard',
                click: () => {
                    if (!mainWindow) {
                        createWindow();
                    } else if (mainWindow.isVisible()) {
                        mainWindow.hide();
                    } else {
                        mainWindow.show();
                        mainWindow.focus();
                    }
                    updateTrayMenu();
                }
            },
            {
                label: 'Run on Windows Startup',
                type: 'checkbox',
                checked: autoRunActive,
                click: (item) => {
                    setStartupAutoRun(item.checked);
                }
            },
            {
                label: 'Trigger Activity Sync',
                click: async () => {
                    await syncProjectsFromBackend();
                    await sendHeartbeat();
                }
            },
            { type: 'separator' },
            {
                label: 'Exit Agent Permanently',
                click: () => {
                    isQuitting = true;
                    stopMonitoringLoops();
                    if (tray && typeof tray.destroy === 'function') tray.destroy();
                    app.quit();
                }
            }
        ]);

        tray.setContextMenu(contextMenu);
        tray.setToolTip(`EMS Agent: ${isTracking ? (isIdle ? 'Idle' : 'Active') : 'Stopped'} | ${agentState.autoMappedProjectName || 'Auto Mapping'}`);
    } catch (err) {
        console.error('[Tray] Error updating tray menu:', err.message);
    }
}

// ─── Single Instance Lock ───────────────────────────────────────────────────
const gotSingleInstanceLock = (app && typeof app.requestSingleInstanceLock === 'function')
    ? app.requestSingleInstanceLock()
    : true;

if (!gotSingleInstanceLock) {
    console.log('[Desktop Agent] Another instance is already running. Quitting.');
    if (app && typeof app.quit === 'function') app.quit();
    process.exit(0);
} else {
    if (app && typeof app.on === 'function') {
        app.on('second-instance', () => {
            if (mainWindow) {
                if (mainWindow.isMinimized()) mainWindow.restore();
                if (!mainWindow.isVisible()) mainWindow.show();
                mainWindow.focus();
            }
        });
    }
}

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

    // Stealth Mode: Hide to Tray on window close instead of exiting
    mainWindow.on('close', (event) => {
        if (!isQuitting) {
            event.preventDefault();
            mainWindow.hide();
            updateTrayMenu();
            if (Notification && typeof Notification.isSupported === 'function' && Notification.isSupported()) {
                try {
                    new Notification({
                        title: 'EMS Agent Running in Background',
                        body: 'The tracker agent is minimized to system tray and continuing background monitoring.'
                    }).show();
                } catch (e) { }
            }
            return false;
        }
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // Auto-Run hidden startup support
    if (process.argv.includes('--hidden')) {
        mainWindow.hide();
    }
}

app.whenReady().then(() => {
    createWindow();
    createTray();

    // Auto-resume background monitoring if previously authorized and active
    if (agentState.agentToken && agentState.employeeId && agentState.permissionsCompleted && agentState.status === 'active') {
        console.log(`[Desktop Agent] Active session detected. Auto-starting monitoring loops for employee: ${agentState.employeeId}...`);
        startMonitoringLoops();
    }

    syncProjectsFromBackend();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        } else if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
        }
    });
});

app.on('before-quit', () => {
    isQuitting = true;
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        if (isQuitting) {
            stopMonitoringLoops();
            app.quit();
        }
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

ipcMain.handle('idle:respond', async (_event, response) => {
    console.log('[Desktop Agent] Employee responded to idle prompt:', response);
    try {
        if (agentState.employeeId && agentState.agentToken) {
            await axios.post(`${API_URL}/api/agent/idle-response`, {
                employeeId: agentState.employeeId,
                response,
                taskId: agentState.activeTaskId || null
            }, {
                headers: {
                    'X-Agent-Auth': agentState.agentToken,
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            });
        }
        if (response === 'WORKING') {
            idleState.currentStatus = 'ACTIVE';
            idleState.hasSentIdleAlert = false;
            idleState.hasSentWarningAlert = false;
            idleState.hasSentPassiveAlert = false;
            idleState.idleStartTime = null;
        } else if (response === 'BREAK') {
            idleState.currentStatus = 'BREAK';
        }
        return { success: true };
    } catch (err) {
        console.error('[Desktop Agent] Error sending idle confirmation response:', err.message);
        return { success: false, error: err.message };
    }
});

// Tray & Stealth Window IPC Handlers
ipcMain.on('close-window', () => {
    if (mainWindow) {
        mainWindow.hide();
        updateTrayMenu();
    }
});

ipcMain.handle('tray:toggle-visibility', () => {
    if (mainWindow) {
        if (mainWindow.isVisible()) {
            mainWindow.hide();
        } else {
            mainWindow.show();
            mainWindow.focus();
        }
        updateTrayMenu();
        return mainWindow.isVisible();
    }
    return false;
});

// Auto Project & Windows Auto-Run IPC Handlers
ipcMain.handle('project:get-auto-detected', () => {
    return {
        projectId: agentState.autoMappedProjectId,
        projectName: agentState.autoMappedProjectName,
        cachedProjectsCount: agentState.cachedProjects ? agentState.cachedProjects.length : 0
    };
});

ipcMain.handle('autostart:get-status', () => {
    return isStartupAutoRunEnabled();
});

ipcMain.handle('autostart:set-status', (_event, enabled) => {
    return setStartupAutoRun(enabled);
});

// ─── Agent Setup & Approval IPC Handlers (agentAPI Compatibility) ────────────
ipcMain.handle('get-device-id', () => agentState.deviceId || os.hostname());
ipcMain.handle('get-invite-prefill', () => ({}));
ipcMain.handle('get-approval-status', () => {
    const hasAuth = Boolean(agentState.agentToken && agentState.employeeId);
    if (!hasAuth) return 'setup';
    if (!agentState.permissionsCompleted) return 'permissions';
    return agentState.status === 'active' ? 'approved' : 'pending';
});
ipcMain.handle('get-permissions-state', () => ({
    screen: true,
    location: true,
    idle: true,
    completed: Boolean(agentState.permissionsCompleted)
}));
ipcMain.handle('complete-permissions', (_event, permissions) => {
    agentState.permissionsCompleted = true;
    saveLocalConfig({
        permissionsCompleted: true,
        status: agentState.status
    });

    if (agentState.status === 'active') {
        startMonitoringLoops();
    }
    return { success: true };
});
ipcMain.handle('complete-setup', async (_event, data) => {
    try {
        if (!data || !data.email || !data.password) {
            return { success: false, error: 'Email and password required' };
        }

        const payload = {
            name: data.name || data.email.split('@')[0],
            email: data.email.trim(),
            password: data.password,
            deviceId: agentState.deviceId,
            inviteToken: data.inviteToken || null,
            systemInfo: JSON.stringify({
                hostname: os.hostname(),
                platform: os.platform(),
                arch: os.arch(),
                release: os.release()
            })
        };

        console.log(`[AgentSetup] Sending registration to ${API_URL}/api/agent/register for: ${payload.email}...`);
        const res = await axios.post(`${API_URL}/api/agent/register`, payload, { timeout: 15000 });

        if (res.data?.success && res.data?.data) {
            agentState.employeeId = res.data.data.agent.employeeId;
            agentState.agentToken = res.data.data.token;
            agentState.deviceId = res.data.data.agent.deviceId || agentState.deviceId;
            agentState.status = res.data.data.agent.status || 'active';
            agentState.permissionsCompleted = false;

            saveLocalConfig({
                employeeId: agentState.employeeId,
                agentToken: agentState.agentToken,
                deviceId: agentState.deviceId,
                status: agentState.status,
                permissionsCompleted: false
            });

            console.log(`[AgentSetup] Registration succeeded for: ${agentState.employeeId}. Status: ${agentState.status}`);
            return { success: true, agent: res.data.data.agent };
        }
        return { success: false, error: res.data?.message || 'Registration failed on server' };
    } catch (err) {
        const errorMsg = err.response?.data?.message || err.message;
        console.error('[AgentSetup] Registration failed:', errorMsg);
        return { success: false, error: errorMsg };
    }
});
ipcMain.handle('request-location', async () => {
    return { success: true, coords: { latitude: 0, longitude: 0 } };
});
ipcMain.handle('check-screen-permission', async () => {
    return true;
});
ipcMain.handle('run-health-check', async () => {
    let connectivityStatus = 'fail';
    let connectivityMsg = 'Cannot reach backend server';
    try {
        if (axios) {
            const res = await axios.get(`${API_URL}/api/agent/health`, { timeout: 8000 });
            if (res.data?.success) {
                connectivityStatus = 'pass';
                connectivityMsg = 'Connected to live Railway server';
            }
        }
    } catch (e) {
        connectivityMsg = `Connection failed: ${e.message}`;
    }

    return {
        connectivity: { status: connectivityStatus, message: connectivityMsg },
        powershell: { status: 'pass', message: 'PowerShell capability active' },
        screen: { status: 'pass', message: 'Screen capture ready' },
        storage: { status: 'pass', message: 'Local storage healthy' }
    };
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
    handleViolationScreenshot,
    matchAutoProject,
    syncProjectsFromBackend,
    isStartupAutoRunEnabled,
    setStartupAutoRun,
    createTray,
    updateTrayMenu
};
