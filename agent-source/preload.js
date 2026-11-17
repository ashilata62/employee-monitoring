const { contextBridge, ipcRenderer } = require('electron');

/**
 * Preload Script - Secure IPC Bridge between Frontend and Electron Main Process
 */
contextBridge.exposeInMainWorld('electronAPI', {
    // ─── Task ID Linking ──────────────────────────────────────────────────
    /**
     * Send the active taskId from frontend to Electron main process
     * @param {string|null} taskId - The ID of the currently active task
     */
    setActiveTask: (taskId) => {
        ipcRenderer.send('task:set-active', taskId);
    },

    /**
     * Retrieve current active taskId from Electron runtime state
     * @returns {Promise<string|null>}
     */
    getActiveTask: () => {
        return ipcRenderer.invoke('task:get-active');
    },

    /**
     * Subscribe to task change broadcasts
     * @param {function(string|null): void} callback
     * @returns {function(): void} Unsubscribe function
     */
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
    onIdleStateChanged: (callback) => {
        const handler = (_event, state) => callback(state);
        ipcRenderer.on('idle:state-changed', handler);
        return () => ipcRenderer.removeListener('idle:state-changed', handler);
    },

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
