/**
 * Cross-tab and real-time synchronization for staff activity & status
 */
const CHANNEL_NAME = 'ems_staff_sync';

export const broadcastStaffStatus = ({
    employeeId,
    status, // 'online' | 'idle' | 'break' | 'offline'
    isIdle = false,
    isOnBreak = false,
    activeApp = 'Active Work',
    currentActivity = 'Active / Logged In',
    idleSeconds = 0
}) => {
    if (!employeeId) return;

    const payload = {
        type: 'STAFF_STATUS_UPDATE',
        employeeId: String(employeeId),
        status,
        isIdle: !!isIdle,
        isOnBreak: !!isOnBreak,
        activeApp,
        currentActivity,
        idleSeconds: Number(idleSeconds) || 0,
        timestamp: Date.now()
    };

    // 1. BroadcastChannel across browser tabs/windows
    try {
        if (typeof BroadcastChannel !== 'undefined') {
            const channel = new BroadcastChannel(CHANNEL_NAME);
            channel.postMessage(payload);
            channel.close();
        }
    } catch (e) {}

    // 2. Window CustomEvent within current window
    try {
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('ems:staff_status_update', { detail: payload }));
        }
    } catch (e) {}

    // 3. Update localStorage persistent state cache
    try {
        const saved = localStorage.getItem('ems_state_v5');
        if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed.employees)) {
                parsed.employees = parsed.employees.map(e => {
                    const match = String(e.id) === String(employeeId) || 
                                  String(e.userId) === String(employeeId) || 
                                  String(e.employeeId) === String(employeeId);
                    if (match) {
                        return {
                            ...e,
                            status: status === 'online' ? 'online' : status,
                            accountStatus: status === 'online' ? 'active' : status,
                            isIdle: !!isIdle,
                            isOnBreak: !!isOnBreak,
                            idleTime: isIdle ? (idleSeconds || e.idleTime || 60) : 0,
                            idleMinutes: isIdle ? Math.floor((idleSeconds || e.idleTime || 60) / 60) : 0,
                            activeApp: activeApp || (isIdle ? 'Away from Computer (Idle)' : 'Active Work'),
                            currentActivity: currentActivity || (isIdle ? 'Away from Computer (Idle)' : 'Active / Logged In'),
                            lastSeen: new Date().toISOString()
                        };
                    }
                    return e;
                });
                localStorage.setItem('ems_state_v5', JSON.stringify(parsed));
            }
        }
    } catch (e) {}
};

export const subscribeStaffStatus = (callback) => {
    if (typeof window === 'undefined') return () => {};

    let channel = null;
    try {
        if (typeof BroadcastChannel !== 'undefined') {
            channel = new BroadcastChannel(CHANNEL_NAME);
            channel.onmessage = (event) => {
                if (event.data?.type === 'STAFF_STATUS_UPDATE') {
                    callback(event.data);
                }
            };
        }
    } catch (e) {}

    const handleCustomEvent = (event) => {
        if (event.detail) {
            callback(event.detail);
        }
    };

    window.addEventListener('ems:staff_status_update', handleCustomEvent);

    return () => {
        if (channel) {
            try {
                channel.close();
            } catch (e) {}
        }
        window.removeEventListener('ems:staff_status_update', handleCustomEvent);
    };
};
