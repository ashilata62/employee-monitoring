const { contextBridge, ipcRenderer } = require('electron');

/**
 * Preload Script - Secure IPC Bridge between Frontend and Electron Main Process
 */
contextBridge.exposeInMainWorld('electronAPI', {
    // ─── Task ID Linking ──────────────────────────────────────────────────
    setActiveTask: (taskId) => {
        ipcRenderer.send('task:set-active', taskId);
    },
    getActiveTask: () => {
        return ipcRenderer.invoke('task:get-active');
    },
    onActiveTaskChanged: (callback) => {
        const handler = (_event, taskId) => callback(taskId);
        ipcRenderer.on('task:active-updated', handler);
        return () => ipcRenderer.removeListener('task:active-updated', handler);
    },

    // ─── Agent System Info & Status ───────────────────────────────────────
    getSystemInfo: () => ipcRenderer.invoke('agent:get-system-info'),
    getAgentStatus: () => ipcRenderer.invoke('agent:get-status'),
    registerAgent: (credentials) => ipcRenderer.invoke('agent:register', credentials),
    triggerManualCapture: () => ipcRenderer.invoke('agent:manual-capture'),
    
    // ─── Smart Idle & Inactivity Monitoring ──────────────────────────────
    getIdleStatus: () => ipcRenderer.invoke('idle:get-status'),
    setIdleThreshold: (seconds) => ipcRenderer.send('idle:set-threshold', seconds),
    respondToIdlePrompt: (response) => ipcRenderer.invoke('idle:respond', response),
    onIdleStateChanged: (callback) => {
        const handler = (_event, state) => callback(state);
        ipcRenderer.on('idle:state-changed', handler);
        return () => ipcRenderer.removeListener('idle:state-changed', handler);
    },
    onIdleWarning: (callback) => {
        const handler = (_event, data) => callback(data);
        ipcRenderer.on('idle:warning', handler);
        return () => ipcRenderer.removeListener('idle:warning', handler);
    },
    onIdlePrompt: (callback) => {
        const handler = (_event, data) => callback(data);
        ipcRenderer.on('idle:prompt', handler);
        return () => ipcRenderer.removeListener('idle:prompt', handler);
    },

    // ─── Auto Project Mapping ────────────────────────────────────────────
    getAutoProject: () => ipcRenderer.invoke('project:get-auto-detected'),
    onAutoProjectDetected: (callback) => {
        const handler = (_event, proj) => callback(proj);
        ipcRenderer.on('project:auto-detected', handler);
        return () => ipcRenderer.removeListener('project:auto-detected', handler);
    },

    // ─── Stealth Mode, System Tray & Windows Startup Auto-Run ────────────
    getStartupAutoRun: () => ipcRenderer.invoke('autostart:get-status'),
    setStartupAutoRun: (enabled) => ipcRenderer.invoke('autostart:set-status', enabled),
    toggleTrayVisibility: () => ipcRenderer.invoke('tray:toggle-visibility'),
    hideToTray: () => ipcRenderer.send('close-window'),

    // ─── Event Listeners ──────────────────────────────────────────────────
    onViolationDetected: (callback) => {
        const handler = (_event, violation) => callback(violation);
        ipcRenderer.on('agent:violation-detected', handler);
        return () => ipcRenderer.removeListener('agent:violation-detected', handler);
    }
});

// Backward compatibility alias for 'window.electron'
contextBridge.exposeInMainWorld('electron', {
    sendTask: (taskId) => ipcRenderer.send('task:set-active', taskId),
    getTask: () => ipcRenderer.invoke('task:get-active')
});

// Agent API compatibility from origin/main
contextBridge.exposeInMainWorld('agentAPI', {
    getDeviceInfo: () => ipcRenderer.invoke('get-device-id').catch(() => 'DESKTOP-CLIENT'),
    getInvitePrefill: () => ipcRenderer.invoke('get-invite-prefill').catch(() => ({})),
    onInviteLoaded: (callback) => ipcRenderer.on('invite-loaded', (_event, data) => callback(data)),
    completeSetup: (data) => ipcRenderer.invoke('complete-setup', data).catch(err => ({ success: false, error: err.message })),
    getPermissionsState: () => ipcRenderer.invoke('get-permissions-state').catch(() => ({ screen: true, location: true, idle: true, completed: false })),
    completePermissions: (data) => ipcRenderer.invoke('complete-permissions', data).catch(() => ({ success: true })),
    getApprovalStatus: () => ipcRenderer.invoke('get-approval-status').catch(() => 'setup'),
    closeWindow: () => ipcRenderer.send('close-window'),
    requestLocation: () => ipcRenderer.invoke('request-location').catch(() => ({ success: true })),
    checkScreenPermission: () => ipcRenderer.invoke('check-screen-permission').catch(() => true),
    onStatusUpdated: (callback) => ipcRenderer.on('status-updated', (_event, status) => callback(status)),
    runHealthCheck: () => ipcRenderer.invoke('run-health-check').catch(() => ({}))
});
