const { app, BrowserWindow, ipcMain, nativeImage, Tray, Menu, Notification, powerMonitor, desktopCapturer } = require('electron');
const path = require('path');
const axios = require('axios');
const screenshot = require('screenshot-desktop');
const os = require('os');
const fs = require('fs');
const crypto = require('crypto');
const { execSync, exec } = require('child_process');
const { io } = require('socket.io-client');
const logger = require('./utils/logger');
const { fetchActiveWindow } = require('./utils/fetchActiveWindow');

// --- CONFIGURATION & SERVER URL SETUP ---
function loadServerUrl() {
    if (process.env.AGENT_SERVER_URL) {
        return process.env.AGENT_SERVER_URL.trim();
    }

    const searchPaths = [];

    // 1. Next to the executable (portable build custom override)
    try {
        searchPaths.push(path.join(path.dirname(process.execPath), 'server-config.json'));
    } catch (e) { }

    // 2. Packaged resources path
    try {
        if (app.isPackaged) {
            searchPaths.push(path.join(process.resourcesPath, 'server-config.json'));
        }
    } catch (e) { }

    // 3. Dev folder next to main.js
    try {
        searchPaths.push(path.join(__dirname, 'server-config.json'));
    } catch (e) { }

    for (const configPath of searchPaths) {
        try {
            if (fs.existsSync(configPath)) {
                const data = JSON.parse(fs.readFileSync(configPath, 'utf8'));
                if (data && data.SERVER_URL) {
                    return data.SERVER_URL.trim();
                }
            }
        } catch (e) { }
    }

    // Default Fallback (production server)
    // return 'http://localhost:5000'; // Commented out: was local dev fallback
    return 'http://localhost:5000';
}

const SERVER_URL = loadServerUrl();
const API_BASE_URL = `${SERVER_URL}/api`;
// Use portable storage: local to exe if packaged, otherwise userData for dev
// Use portable storage: highly recommended to use appData for reliability in packaged builds
const getStorageDir = () => {
    try {
        return app.getPath('userData');
    } catch (e) {
        return path.dirname(process.execPath);
    }
};

// Use the original executable path for naming if it's a portable build
const exeIdentity = process.env.PORTABLE_EXECUTABLE_FILE
    ? path.basename(process.env.PORTABLE_EXECUTABLE_FILE)
    : path.basename(process.execPath);

const STORAGE_PATH = path.join(getStorageDir(), `.${exeIdentity}-storage.json`);
const QUEUE_PATH = path.join(getStorageDir(), `.${exeIdentity}-queue.json`);
const LOG_PATH = path.join(getStorageDir(), `.${exeIdentity}-agent.log`);

// --- LOGGING ---

function logToFile(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const logLine = `[${timestamp}] [${level}] ${message}\n`;
    console.log(logLine.trim());
    try {
        fs.appendFileSync(LOG_PATH, logLine);
    } catch (e) { }
}

let mainWindow = null;
let tray = null;
let config = {
    isInitialized: false,
    employeeId: null,
    employeeName: '',
    employeeEmail: '',
    token: '',
    deviceId: '',
    isApproved: false,
    captureIntervalMs: 30000,
    permissions: {
        screen: false,
        location: false,
        idle: false,
        completed: false,
        grantedAt: null
    }
};

let statusCheckInterval = null;
let socket = null;
let liveInterval = null;

/** Personal-computer invite prefill (email locked, name editable) */
let pendingInvite = { token: null, email: null, fullName: null, emailLocked: false };

function parseInviteTokenFromArgs(argv = process.argv) {
    for (const arg of argv) {
        if (arg.startsWith('--invite-token=')) {
            return arg.split('=').slice(1).join('=');
        }
        if (arg.startsWith('ems-tracker://')) {
            try {
                const u = new URL(arg);
                return u.searchParams.get('token');
            } catch (e) { /* ignore */ }
        }
    }
    return null;
}

async function loadInvitePreview(token) {
    if (!token) return null;
    try {
        const res = await axios.get(`${API_BASE_URL}/auth/invitations/validate/${token}`);
        if (res.data?.success && res.data?.data) {
            pendingInvite = {
                token,
                email: res.data.data.email,
                fullName: res.data.data.fullName || '',
                emailLocked: true,
            };
            config.pendingInviteToken = token;
            saveStorage();
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('invite-loaded', pendingInvite);
            }
            return pendingInvite;
        }
    } catch (e) {
        logToFile(`Invite preview failed: ${e.message}`, 'WARN');
    }
    return null;
}

// --- UTILS ---

function connectSocket() {
    if (socket || !config.token) return;

    socket = io(SERVER_URL, {
        auth: { token: config.token },
        transports: ['websocket']
    });

    socket.on('connect', () => {
        console.log('Socket connected to server');
    });

    socket.on('live:request', (data) => {
        console.log('Live screening requested by admin');
        startLiveMode();
    });

    socket.on('live:stop', () => {
        console.log('Live screening stopped');
        stopLiveMode();
    });

    socket.on('settings:update', (data) => {
        console.log('[Agent] Received settings update:', data);
        if (data.frequency) {
            config.captureIntervalMs = Math.max(parseInt(data.frequency, 10) * 60000, 30000);
            saveStorage();
            console.log(`[Agent] Updating capture frequency to ${Math.round(config.captureIntervalMs / 1000)} sec`);
            // Restart tracking with new interval
            startTracking();
        }
    });

    socket.on('agent:approved', () => {
        console.log('Agent approved by admin! Starting tracking...');
        config.isApproved = true;
        saveStorage();
        startTracking(); // This will now proceed as isApproved is true
        if (mainWindow) mainWindow.webContents.send('status-updated', 'approved');
    });

    socket.on('connect', () => {
        logToFile('Socket connected to live server successfully');
    });

    socket.on('connect_error', (err) => {
        logToFile(`Socket connection error: ${err.message}`, 'ERROR');
    });

    socket.on('disconnect', (reason) => {
        logToFile(`Socket disconnected. Reason: ${reason}`);
        stopLiveMode();
    });
}

function startLiveMode() {
    if (liveInterval) clearInterval(liveInterval);

    // Capture immediately
    captureAndUpload();

    // High frequency capture (every 3 seconds)
    liveInterval = setInterval(captureAndUpload, 3000);

    // Auto stop after 5 minutes to save bandwidth/resources if admin forgets
    setTimeout(stopLiveMode, 300000);
}

function stopLiveMode() {
    if (liveInterval) {
        clearInterval(liveInterval);
        liveInterval = null;
    }
}

async function getActiveWindowWindows() {
    // Delegates to the production‑ready PowerShell helper.
    // Returns {appName, title, pid} – we only need appName and title.
    try {
        const result = await fetchActiveWindow();
        return { app: result.appName, title: result.title, pid: result.pid };
    } catch (e) {
        logger.error('Failed to fetch active window', { err: e.message });
        return { app: 'Unknown', title: 'Unknown', pid: 0 };
    }
}

function getIdleTimeWindows() {
    return new Promise((resolve) => {
        try {
            const script = `
                Add-Type @'
                  using System;
                  using System.Runtime.InteropServices;
                  public class Win32 {
                    [StructLayout(LayoutKind.Sequential)]
                    public struct LASTINPUTINFO {
                        public uint cbSize;
                        public uint dwTime;
                    }
                    [DllImport("user32.dll")]
                    public static extern bool GetLastInputInfo(ref LASTINPUTINFO plii);
                  }
'@
                $lii = New-Object Win32+LASTINPUTINFO
                $lii.cbSize = [System.Runtime.InteropServices.Marshal]::SizeOf($lii)
                if ([Win32]::GetLastInputInfo([ref]$lii)) {
                    $idleMs = [Environment]::TickCount - $lii.dwTime
                    return [Math]::Floor($idleMs / 1000)
                }
                return 0
            `;
            const child = exec(`powershell -Command "${script.replace(/\\n/g, ' ').replace(/"/g, '`"')}"`, (error, stdout) => {
                if (error) {
                    resolve(0);
                } else {
                    resolve(parseInt(stdout.trim()) || 0);
                }
            });

            setTimeout(() => {
                try { child.kill(); resolve(0); } catch (e) { }
            }, 5000);
        } catch (e) {
            resolve(0);
        }
    });
}

function captureWithPowerShell() {
    return new Promise((resolve) => {
        try {
            const tempPath = path.join(app.getPath('temp'), `snap_${Date.now()}.png`);

            // Industrial-grade C# code compiled directly into PowerShell
            const script = `
                $ErrorActionPreference = 'Stop'
                Try {
                    $Definition = @"
                        using System;
                        using System.Drawing;
                        using System.Drawing.Imaging;
                        using System.Windows.Forms;
                        using System.Runtime.InteropServices;

                        public class ScreenCapture {
                            public static void Capture(string filePath) {
                                Rectangle bounds = Screen.PrimaryScreen.Bounds;
                                using (Bitmap bitmap = new Bitmap(bounds.Width, bounds.Height)) {
                                    using (Graphics g = Graphics.FromImage(bitmap)) {
                                        g.CopyFromScreen(Point.Empty, Point.Empty, bounds.Size);
                                    }
                                    bitmap.Save(filePath, ImageFormat.Png);
                                }
                            }
                        }
"@
                    Add-Type -TypeDefinition $Definition -ReferencedAssemblies System.Windows.Forms,System.Drawing
                    [ScreenCapture]::Capture('${tempPath.replace(/\\/g, '\\\\')}')
                } Catch {
                    Write-Error $_.Exception.Message
                }
            `.trim();

            // Use EncodedCommand for absolute robustness with complex scripts
            const encodedScript = Buffer.from(script, 'utf16le').toString('base64');
            const child = exec(`powershell -NoProfile -ExecutionPolicy Bypass -EncodedCommand ${encodedScript}`, (error, stdout, stderr) => {
                if (error) {
                    logToFile(`PowerShell capture process error: ${error.message}`, 'ERROR');
                    resolve(null);
                } else if (fs.existsSync(tempPath)) {
                    logToFile(`PowerShell capture successful: ${tempPath}`);
                    const buffer = fs.readFileSync(tempPath);
                    try { fs.unlinkSync(tempPath); } catch (e) { } // Cleanup
                    resolve(buffer);
                } else {
                    logToFile(`PowerShell capture failed silently. stderr: ${stderr}`, 'ERROR');
                    resolve(null);
                }
            });

            setTimeout(() => {
                try { child.kill(); resolve(null); } catch (e) { }
            }, 10000); // 10s timeout
        } catch (e) {
            logToFile(`PowerShell capture setup error: ${e.message}`, 'ERROR');
            resolve(null);
        }
    });
}

async function captureWithNative() {
    try {
        logToFile('Executing desktopCapturer.getSources...');
        const sources = await desktopCapturer.getSources({
            types: ['screen'],
            thumbnailSize: { width: 1280, height: 720 }
        });

        if (sources && sources.length > 0) {
            logToFile(`Native capture successful from source: ${sources[0].name}`);
            return sources[0].thumbnail.toPNG();
        }
    } catch (e) {
        logToFile(`Native capture failed: ${e.message}`, 'ERROR');
    }
    return null;
}

function getStrongDeviceId() {
    const info = [
        os.hostname(),
        os.platform(),
        os.arch(),
        os.userInfo().username,
        os.totalmem()
    ].join('|');
    return crypto.createHash('sha256').update(info).digest('hex').substring(0, 16).toUpperCase();
}

function loadStorage() {
    if (fs.existsSync(STORAGE_PATH)) {
        try {
            config = { ...config, ...JSON.parse(fs.readFileSync(STORAGE_PATH)) };
        } catch (e) {
            console.error('Failed to load storage');
        }
    }
    if (!config.permissions) {
        config.permissions = { screen: false, location: false, idle: false, completed: false, grantedAt: null };
    } else {
        config.permissions = {
            screen: Boolean(config.permissions.screen),
            location: Boolean(config.permissions.location),
            idle: Boolean(config.permissions.idle),
            completed: Boolean(config.permissions.completed),
            grantedAt: config.permissions.grantedAt || null
        };
    }
    if (!Number.isFinite(config.captureIntervalMs) || config.captureIntervalMs < 30000) {
        config.captureIntervalMs = 30000;
    }
    if (!config.deviceId) config.deviceId = getStrongDeviceId();
}

function saveStorage() {
    try {
        fs.writeFileSync(STORAGE_PATH, JSON.stringify(config));
    } catch (e) {
        logToFile(`Failed to save storage: ${e.message}`, 'ERROR');
    }
}

function addToQueue(data) {
    let queue = [];
    if (fs.existsSync(QUEUE_PATH)) {
        try { queue = JSON.parse(fs.readFileSync(QUEUE_PATH)); } catch (e) { }
    }
    queue.push({ ...data, timestamp: new Date().toISOString() });
    fs.writeFileSync(QUEUE_PATH, JSON.stringify(queue.slice(-50))); // Keep last 50
}

async function processQueue() {
    if (!config.isInitialized || !config.token || !fs.existsSync(QUEUE_PATH)) return;

    let queue = [];
    try {
        queue = JSON.parse(fs.readFileSync(QUEUE_PATH));
    } catch (e) {
        return;
    }

    if (queue.length === 0) return;

    console.log(`[Agent] Processing offline queue: ${queue.length} items...`);
    const remaining = [];

    for (const item of queue) {
        try {
            await axios.post(`${API_BASE_URL}/agent/activity`, {
                employeeId: config.employeeId,
                data: item
            }, {
                headers: { 'X-Agent-Auth': config.token },
                timeout: 30000
            });
        } catch (error) {
            remaining.push(item);
        }
    }

    fs.writeFileSync(QUEUE_PATH, JSON.stringify(remaining));
    if (remaining.length === 0) {
        console.log('[Agent] Offline queue processed successfully.');
    }
}

// --- CORE APP LOGIC ---

async function getLocation() {
    logToFile('Fetching location metadata...');

    // Attempt multiple services for reliability in different network environments

    // Service 1: ipapi.co (HTTPS, reliable)
    try {
        logToFile('Trying ipapi.co (HTTPS)...');
        const res = await axios.get('https://ipapi.co/json/', { timeout: 10000 });
        if (res.data && !res.data.error) {
            logToFile(`Location (ipapi.co): ${res.data.city}, ${res.data.country_name}`);
            return {
                city: res.data.city,
                region: res.data.region,
                country: res.data.country_name,
                lat: res.data.latitude,
                lon: res.data.longitude,
                ip: res.data.ip
            };
        }
    } catch (e) {
        logToFile(`ipapi.co failed: ${e.message}`, 'WARN');
    }

    // Service 2: ip-api.com (HTTP - good as fallback)
    try {
        logToFile('Trying ip-api.com (HTTP)...');
        const res = await axios.get('http://ip-api.com/json', { timeout: 10000 });
        if (res.data && res.data.status === 'success') {
            logToFile(`Location (ip-api.com): ${res.data.city}, ${res.data.country}`);
            return {
                city: res.data.city,
                region: res.data.regionName,
                country: res.data.country,
                lat: res.data.lat,
                lon: res.data.lon,
                ip: res.data.query
            };
        }
    } catch (e) {
        logToFile(`ip-api.com failed: ${e.message}`, 'WARN');
    }

    logToFile('No location data available', 'ERROR');
    return null;
}

async function captureAndUpload() {
    if (!config.isInitialized) return;

    try {
        // 1. Capture & Compress
        logToFile('Starting capture cycle...');
        let sources = null;

        try {
            // Priority 1: Native Electron Capturer (Most reliable, no external process)
            logToFile('Trying Native capture (Electron desktopCapturer)...');
            sources = await Promise.race([
                captureWithNative(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Native capture timeout')), 15000))
            ]);
        } catch (e) {
            logToFile(`Native capture failed or timed out: ${e.message}`, 'WARN');
        }

        if (!sources) {
            // Priority 2: PowerShell Fallback (v2 - C# Compiled)
            try {
                logToFile('Native failed, trying PowerShell C# fallback...');
                sources = await captureWithPowerShell();
            } catch (pE) {
                logToFile(`PowerShell fallback failed: ${pE.message}`, 'ERROR');
            }
        }

        if (!sources) {
            // Priority 3: screenshot-desktop library (As last resort)
            try {
                logToFile('PowerShell failed, trying library: screenshot-desktop...');
                sources = await Promise.race([
                    screenshot({ format: 'png' }),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Library capture timeout')), 10000))
                ]);
            } catch (libE) {
                logToFile(`Library capture failed: ${libE.message}`, 'ERROR');
            }
        }

        if (!sources) {
            logToFile('CRITICAL: All capture methods failed for monitoring', 'ERROR');
            return;
        }

        const img = nativeImage.createFromBuffer(sources);
        const compressedBase64 = img.resize({ width: 1280 }).toJPEG(60).toString('base64');
        const screenshotUrl = `data:image/jpeg;base64,${compressedBase64}`;

        logToFile('Screenshot captured successfully.');

        // 2. Get Metadata
        let activeApp = 'Unknown';
        let activeWindow = 'Unknown';
        let idleTime = 0;

        if (os.platform() === 'win32') {
            logToFile('Fetching window and idle info (Windows)...');
            const winInfo = await getActiveWindowWindows();
            activeApp = winInfo.app;
            activeWindow = winInfo.title;
            idleTime = await getIdleTimeWindows();
        }


        const location = await getLocation();

        const payload = {
            activeApp,
            activeWindow,
            idleTime,
            screenshotUrl,
            location,
            timestamp: new Date().toISOString()
        };

        // 3. Upload
        logToFile(`Uploading activity to ${API_BASE_URL}/agent/activity...`);
        try {
            await axios.post(`${API_BASE_URL}/agent/activity`, {
                employeeId: config.employeeId,
                data: payload
            }, {
                headers: { 'X-Agent-Auth': config.token },
                timeout: 60000 // Increased timeout for slow connections
            });
            logToFile('Activity and Screenshot uploaded successfully');
        } catch (uploadError) {
            logToFile(`Upload failed, adding to queue: ${uploadError.message}`, 'ERROR');
            addToQueue(payload);
        }
    } catch (error) {
        logToFile(`Capture cycle fatal error: ${error.message}`, 'ERROR');
    }
}

let trackingIntervals = [];

function checkStorageHealth() {
    if (config.isInitialized && !fs.existsSync(STORAGE_PATH)) {
        console.log('Storage file missing! Stopping tracking and requesting re-setup.');
        stopTracking();
        config.isInitialized = false;
        mainWindow.show();
        new Notification({
            title: 'Action Required',
            body: 'Agent configuration missing. Please register again.'
        }).show();
    }
}

function stopTrackingLocal() {
    trackingIntervals.forEach(clearInterval);
    trackingIntervals = [];
    stopLiveMode();
    if (socket) {
        socket.disconnect();
        socket = null;
    }
}

/** Tell backend to clock out (system shutdown, exit, agent stopped). */
async function requestServerClockOut() {
    if (!config.isInitialized || !config.employeeId) return;
    try {
        logToFile('Sending clock-out to server (shutdown / exit)...');
        await axios.post(
            `${API_BASE_URL}/agent/stop-tracking`,
            { employeeId: config.employeeId },
            {
                headers: config.token ? { 'X-Agent-Auth': config.token } : {},
                timeout: 10000,
            }
        );
        logToFile('Clock-out successful');
    } catch (e) {
        logToFile(`Clock-out request failed: ${e.message}`, 'WARN');
    }
}

/**
 * Stop local tracking. Pass clockOut: true only when employee is leaving (shutdown, exit, deapproved).
 */
function stopTracking({ clockOut = false } = {}) {
    stopTrackingLocal();
    if (clockOut && config.employeeId) {
        return requestServerClockOut();
    }
    return Promise.resolve();
}

let isShuttingDown = false;

async function handleSystemShutdown() {
    if (isShuttingDown) return;
    isShuttingDown = true;
    stopTrackingLocal();
    await requestServerClockOut();
}

function createTray() {
    tray = new Tray(path.join(__dirname, 'icon.png')); // Ensure you have an icon.png
    const contextMenu = Menu.buildFromTemplate([
        { label: 'Show Agent', click: () => mainWindow.show() },
        { label: 'Force Sync', click: () => processQueue() },
        { type: 'separator' },
        {
            label: 'Exit',
            click: async () => {
                app.isQuitting = true;
                await handleSystemShutdown();
                app.quit();
            },
        }
    ]);
    tray.setToolTip('Insightful Monitoring Agent');
    tray.setContextMenu(contextMenu);
    tray.on('double-click', () => mainWindow.show());
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 450,
        height: 700,
        resizable: false,
        icon: path.join(__dirname, 'icon.png'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        },
    });

    mainWindow.loadFile('index.html');

    mainWindow.on('close', (event) => {
        if (!app.isQuitting) {
            event.preventDefault();
            mainWindow.hide();
        }
    });
}

async function checkDeviceRecovery() {
    const deviceId = getStrongDeviceId();
    console.log(`Checking for existing registration for device: ${deviceId}`);

    try {
        const response = await axios.get(`${API_BASE_URL}/agent/check-device/${deviceId}`);
        if (response.data.success) {
            const data = response.data.data;
            console.log('Device recognized by server! Auto-recovering session...');

            config.employeeId = data.employeeId;
            config.employeeName = data.employeeName;
            config.employeeEmail = data.employeeEmail;
            config.token = data.token;
            config.deviceId = deviceId;
            config.isApproved = (data.status === 'active');
            config.isInitialized = true;

            saveStorage();
            startTracking();
            return true;
        }
    } catch (error) {
        console.log('Device recovery failed or device not registered.');
    }
    return false;
}

// --- IPC HANDLERS ---

ipcMain.handle('get-device-id', () => config.deviceId);

ipcMain.handle('get-invite-prefill', () => ({ ...pendingInvite }));

ipcMain.handle('complete-setup', async (event, data) => {
    try {
        const inviteToken = data.inviteToken || pendingInvite.token || config.pendingInviteToken;

        if (pendingInvite.emailLocked && pendingInvite.email) {
            const submitted = (data.email || '').trim().toLowerCase();
            const expected = pendingInvite.email.trim().toLowerCase();
            if (submitted !== expected) {
                return { success: false, error: 'Email must match your invitation address.' };
            }
        }

        const response = await axios.post(`${API_BASE_URL}/agent/register`, {
            email: data.email,
            password: data.password,
            name: data.name,
            deviceId: config.deviceId,
            inviteToken: inviteToken || undefined,
            systemInfo: {
                platform: os.platform(),
                release: os.release(),
                arch: os.arch()
            }
        });

        if (response.data.success) {
            config.employeeId = response.data.data.agent.employeeId;
            config.token = response.data.data.token;
            config.employeeName = data.name;
            config.employeeEmail = data.email;
            config.isInitialized = true;
            config.isApproved = false; // New registrations are always pending
            config.captureIntervalMs = 30000;
            config.pendingInviteToken = null;
            pendingInvite = { token: null, email: null, fullName: null, emailLocked: false };
            config.permissions = {
                screen: false,
                location: false,
                idle: false,
                completed: false,
                grantedAt: null
            };
            saveStorage();

            // Check status immediately
            checkApprovalStatus();
            connectSocket(); // Start listening for realtime 'agent:approved' event
            return { success: true };
        }
    } catch (error) {
        const backendMsg = error?.response?.data?.message || error?.response?.data?.error;
        const errorMessage = backendMsg || error.message || 'Setup failed';
        console.error('Setup failed:', errorMessage);
        logToFile(`Setup failed: ${errorMessage}`, 'ERROR');
        return { success: false, error: errorMessage };
    }
    return { success: false, error: 'Registration failed. Please try again.' };
});

ipcMain.handle('get-permissions-state', () => config.permissions || {});

ipcMain.handle('complete-permissions', (event, permissions) => {
    const current = config.permissions || {};
    config.permissions = {
        screen: Boolean(permissions?.screen ?? current.screen),
        location: Boolean(permissions?.location ?? current.location),
        idle: Boolean(permissions?.idle ?? current.idle),
        completed: Boolean(permissions?.completed ?? current.completed),
        grantedAt: permissions?.grantedAt || current.grantedAt || null
    };
    saveStorage();

    // If approval was already granted before permissions were completed,
    // start tracking immediately so user does not need to restart the agent.
    if (config.permissions.completed) {
        if (config.isApproved) {
            startTracking();
        } else {
            checkApprovalStatus();
        }
    }

    return { success: true };
});

ipcMain.handle('request-location', async () => {
    const loc = await getLocation();
    if (loc) return { success: true, coords: { latitude: loc.lat, longitude: loc.lon } };
    return { success: false, error: 'Failed to fetch location via IP service' };
});

ipcMain.handle('run-health-check', async () => {
    const results = {
        connectivity: { status: 'loading', message: 'Checking...' },
        powershell: { status: 'loading', message: 'Checking...' },
        screen: { status: 'loading', message: 'Checking...' },
        storage: { status: 'loading', message: 'Checking...' }
    };

    // 1. Connectivity
    try {
        await axios.get(`${SERVER_URL}/api/health`, { timeout: 5000 });
        results.connectivity = { status: 'pass', message: 'Connected to live server' };
    } catch (e) {
        if (e.response) {
            // Any HTTP response (even 401/403/404) means the server is reachable and running
            results.connectivity = { status: 'pass', message: 'Connected to live server' };
        } else {
            results.connectivity = { status: 'fail', message: `Server unreachable: ${e.message}` };
        }
    }

    // 2. PowerShell
    try {
        const out = execSync('powershell -NoProfile -Command "Write-Output OK"', { timeout: 5000 }).toString().trim();
        if (out === 'OK') {
            results.powershell = { status: 'pass', message: 'PowerShell scripts enabled' };
        } else {
            throw new Error('Invalid output');
        }
    } catch (e) {
        results.powershell = { status: 'fail', message: 'PowerShell restricted or blocked' };
    }

    // 3. Screen Capture
    try {
        const sources = await desktopCapturer.getSources({ types: ['screen'], thumbnailSize: { width: 1, height: 1 } });
        if (sources && sources.length > 0) {
            results.screen = { status: 'pass', message: 'Screen capture permitted' };
        } else {
            results.screen = { status: 'fail', message: 'Screen access blocked by OS' };
        }
    } catch (e) {
        results.screen = { status: 'fail', message: `Capture error: ${e.message}` };
    }

    // 4. Storage
    try {
        fs.writeFileSync(path.join(getStorageDir(), '.health-test'), 'test');
        fs.unlinkSync(path.join(getStorageDir(), '.health-test'));
        results.storage = { status: 'pass', message: 'Storage write access OK' };
    } catch (e) {
        results.storage = { status: 'fail', message: 'Storage folder protected' };
    }

    return results;
});

ipcMain.handle('check-screen-permission', async () => {
    try {
        const screenshot = require('screenshot-desktop');
        try {
            // Take a small test screenshot to verify permission
            await screenshot({ format: 'png' });
            console.log('[Agent] Screen permission verified via screenshot-desktop');
            return true;
        } catch (e) {
            console.warn('[Agent] Primary screen check failed, trying fallbacks...');

            // Check if we can at least get source list (macOS/Linux style check, but good for Electron)
            const sources = await desktopCapturer.getSources({ types: ['screen'], thumbnailSize: { width: 1, height: 1 } });
            if (sources && sources.length > 0) {
                console.log('[Agent] Screen permission verified via desktopCapturer');
                return true;
            }

            return false;
        }
    } catch (e) {
        console.error('Screen permission check error:', e.message);
        return false;
    }
});

async function checkApprovalStatus() {
    if (!config.isInitialized || !config.employeeId) return;

    try {
        const response = await axios.get(`${API_BASE_URL}/agent/status/${config.employeeId}`, {
            headers: { 'Authorization': `Bearer ${config.token}` }
        });

        if (response.data.success) {
            const serverStatus = response.data.data.status;
            const wasApproved = config.isApproved;
            config.isApproved = (serverStatus === 'active');

            if (config.isApproved !== wasApproved) {
                saveStorage();
                if (config.isApproved) {
                    startTracking();
                    if (mainWindow) mainWindow.webContents.send('status-updated', 'approved');

                    // Show activation notification only when transitioning to active
                    new Notification({
                        title: 'Insightful Agent Active',
                        body: 'Administrator has approved your device. Monitoring has started.',
                        icon: path.join(__dirname, 'icon.png')
                    }).show();
                } else {
                    stopTracking({ clockOut: true });
                    if (mainWindow) mainWindow.webContents.send('status-updated', 'pending');
                }
            }
        }
    } catch (error) {
        console.error('Status check failed:', error.message);

        // If 401 (Unauthorized), 403 (Forbidden), or 404 (Not Found), it means 
        // the agent is no longer valid on the server. We should reset.
        if (error.response && [401, 403, 404].includes(error.response.status)) {
            console.log(`Agent validation failed (Status: ${error.response.status}). Resetting...`);
            stopTracking({ clockOut: true });
            config.isInitialized = false;
            config.isApproved = false;

            // Clear local storage
            if (fs.existsSync(STORAGE_PATH)) fs.unlinkSync(STORAGE_PATH);

            // Show registration form again
            if (mainWindow) {
                mainWindow.webContents.send('status-updated', 'deleted');
                mainWindow.show();
            }
        }
    }
}

ipcMain.handle('get-approval-status', () => {
    if (!config.isInitialized) return 'setup';
    if (!config.permissions || !config.permissions.completed) return 'permissions';
    return config.isApproved ? 'approved' : 'pending';
});

ipcMain.on('close-window', () => {
    mainWindow.hide();
});

function startTracking(isStartup = false) {
    if (!config.permissions || !config.permissions.completed) {
        console.log('Skipping tracking: Required permissions are not completed yet.');
        if (mainWindow) {
            mainWindow.webContents.send('status-updated', 'permissions');
        }
        return;
    }

    if (!config.isApproved) {
        console.log('Skipping tracking: Agent not approved.');
        if (mainWindow) mainWindow.webContents.send('status-updated', 'pending');

        if (!statusCheckInterval) {
            statusCheckInterval = setInterval(checkApprovalStatus, 60000); // Check every 1 min
        }
        // Force an immediate check on startup
        if (isStartup) checkApprovalStatus();
        return;
    }

    // Even if local config says approved, do one check on startup to be sure
    if (isStartup) {
        console.log('App startup: Verifying existing approval with server...');
        checkApprovalStatus();
        // If it was already approved, we can start, but checkApprovalStatus will stop it if server says 404
    }

    // Agent is approved, clear frequent check and start real tracking
    if (statusCheckInterval) {
        clearInterval(statusCheckInterval);
        statusCheckInterval = null;
    }

    stopTracking(); // Clear existing if any

    connectSocket(); // Enable real-time commands

    const frequencyMs = Math.max(Number(config.captureIntervalMs) || 30000, 30000);
    console.log(`[Agent] Tracking started with interval: ${Math.round(frequencyMs / 1000)} sec`);

    trackingIntervals.push(setInterval(captureAndUpload, frequencyMs));
    trackingIntervals.push(setInterval(processQueue, 300000)); // Process queue every 5 mins
    trackingIntervals.push(setInterval(checkStorageHealth, 60000)); // Check health every 1 min

    // Immediate capture on activation
    captureAndUpload();

    // Send initial heartbeat
    axios.post(`${API_BASE_URL}/agent/heartbeat`, { deviceId: config.deviceId })
        .catch(e => console.log('Initial heartbeat failed'));

    // Only show notification if we just TRANSITIONED to active, not every startup
    // (This will be handled inside checkApprovalStatus transition logic now)
}

// --- APP LIFECYCLE ---

if (process.defaultApp) {
    if (process.argv.length >= 2) {
        app.setAsDefaultProtocolClient('ems-tracker', process.execPath, [path.resolve(process.argv[1])]);
    }
} else {
    app.setAsDefaultProtocolClient('ems-tracker');
}

const gotSingleInstanceLock = app.requestSingleInstanceLock();
if (!gotSingleInstanceLock) {
    app.quit();
} else {
    app.on('second-instance', (_event, argv) => {
        const token = parseInviteTokenFromArgs(argv);
        if (token) loadInvitePreview(token);
        if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
        }
    });
}

app.on('open-url', (event, url) => {
    event.preventDefault();
    const token = parseInviteTokenFromArgs([url]);
    if (token) loadInvitePreview(token);
});

// --- APP LIFECYCLE ---

app.whenReady().then(async () => {
    // Separate this instance's ID so OS treats it uniquely if it's a different download
    if (process.platform === 'win32') {
        const uniqueId = `com.ems.tracker.${exeIdentity.replace(/[^a-zA-Z0-9]/g, '')}`;
        app.setAppUserModelId(uniqueId);
    }

    loadStorage();
    createWindow();
    createTray();

    const inviteToken = parseInviteTokenFromArgs(process.argv) || config.pendingInviteToken;
    if (inviteToken && !config.isInitialized) {
        await loadInvitePreview(inviteToken);
    }

    if (!config.isInitialized) {
        checkDeviceRecovery().then(recovered => {
            if (!recovered && mainWindow) {
                mainWindow.show();
            }
        });
    } else {
        // Run completely in background but verify First
        startTracking(true);
        if (!config.permissions || !config.permissions.completed) {
            mainWindow.show();
        }
    }

    // Auto-start on boot
    app.setLoginItemSettings({
        openAtLogin: true,
        path: app.getPath('exe')
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        // Don't quit, keep tray alive
    }
});

app.on('before-quit', async (event) => {
    app.isQuitting = true;
    if (!isShuttingDown && config.employeeId) {
        event.preventDefault();
        await handleSystemShutdown();
        app.quit();
    }
});

// Windows / macOS system shutdown or restart
if (powerMonitor) {
    powerMonitor.on('shutdown', () => {
        handleSystemShutdown().catch(() => { });
    });
}
