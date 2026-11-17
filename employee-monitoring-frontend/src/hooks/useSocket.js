import { useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

let sharedSocket = null;
let activeToken = null;

/**
 * Returns a singleton Socket.IO client instance per authenticated session
 */
export const getSharedSocket = (token) => {
    if (!token) {
        if (sharedSocket) {
            sharedSocket.disconnect();
            sharedSocket = null;
            activeToken = null;
        }
        return null;
    }

    if (!sharedSocket || activeToken !== token) {
        if (sharedSocket) {
            sharedSocket.disconnect();
        }
        activeToken = token;
        sharedSocket = io(SOCKET_URL, {
            auth: { token },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
            timeout: 10000
        });

        sharedSocket.on('connect', () => {
            console.log('[Socket] Connected to server successfully (ID:', sharedSocket.id, ')');
        });

        sharedSocket.on('connect_error', (err) => {
            console.error('[Socket] Connection error:', err.message);
        });
    }

    return sharedSocket;
};

const useSocket = () => {
    const { token } = useAuthStore();
    const socketRef = useRef(null);

    useEffect(() => {
        if (!token) return;

        const socket = getSharedSocket(token);
        socketRef.current = socket;

        // Cleanup: We don't abruptly disconnect on component unmount to prevent
        // closing mid-handshake during React 18 StrictMode double-invocations.
        // Disconnection happens when the user logs out (token becomes null).
    }, [token]);

    const emit = useCallback((event, data) => {
        const socket = socketRef.current || sharedSocket;
        if (socket && socket.connected) {
            socket.emit(event, data);
        } else if (socket) {
            // Buffer emit if connecting
            socket.emit(event, data);
        }
    }, []);

    const on = useCallback((event, callback) => {
        const socket = socketRef.current || sharedSocket || getSharedSocket(useAuthStore.getState().token);
        if (socket) {
            socket.off(event, callback); // Prevent duplicate listeners
            socket.on(event, callback);
        }
    }, []);

    const off = useCallback((event, callback) => {
        const socket = socketRef.current || sharedSocket;
        if (socket) {
            socket.off(event, callback);
        }
    }, []);

    return { socket: sharedSocket, emit, on, off };
};

export default useSocket;
