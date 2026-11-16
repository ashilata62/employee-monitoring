const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('agentAPI', {
  getDeviceInfo: () => ipcRenderer.invoke('get-device-id'),
  getInvitePrefill: () => ipcRenderer.invoke('get-invite-prefill'),
  onInviteLoaded: (callback) => ipcRenderer.on('invite-loaded', (_event, data) => callback(data)),
  completeSetup: (data) => ipcRenderer.invoke('complete-setup', data),
  getPermissionsState: () => ipcRenderer.invoke('get-permissions-state'),
  completePermissions: (data) => ipcRenderer.invoke('complete-permissions', data),
  getApprovalStatus: () => ipcRenderer.invoke('get-approval-status'),
  closeWindow: () => ipcRenderer.send('close-window'),
  requestLocation: () => ipcRenderer.invoke('request-location'),
  checkScreenPermission: () => ipcRenderer.invoke('check-screen-permission'),
  onStatusUpdated: (callback) => ipcRenderer.on('status-updated', (_event, status) => callback(status)),
  runHealthCheck: () => ipcRenderer.invoke('run-health-check'),
});

window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector);
    if (element) element.innerText = text;
  };

  for (const type of ['chrome', 'node', 'electron']) {
    replaceText(`${type}-version`, process.versions[type]);
  }
});
