import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ShieldAlert, MonitorCheck, Clock, Briefcase, Coffee } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { getActiveSessionSeconds } from '../../hooks/useLiveTime';
import screenshotService from '../../services/screenshotService';
import videoService from '../../services/videoService';
import api from '../../services/apiClient';
import useSocket from '../../hooks/useSocket';
import { toast } from '../../utils/toastManager';
import { broadcastStaffStatus } from '../../utils/staffSync';

export function WebTrackerAgent() {
    const { user, role, clockIn, clockOut, isClockedIn, isTrackerActive, setTrackerActive, isOnBreak } = useAuthStore();
    const isMonitoredEmployee = (user?.role || role || '').toUpperCase() === 'EMPLOYEE';
    const { socket, on, emit, off } = useSocket();
    const [isTracking, setIsTracking] = useState(false);
    const isTrackingRef = useRef(false);
    isTrackingRef.current = isTracking;
    const [error, setError] = useState('');
    const [settings, setSettings] = useState({ frequency: 10, globalBlur: false });

    // ─── Active Task ID State (Requirement 2 & 5) ─────────────────────────────
    const [activeTaskId, setActiveTaskId] = useState(() => {
        return localStorage.getItem('activeTaskId') || null;
    });
    const activeTaskIdRef = useRef(activeTaskId);
    activeTaskIdRef.current = activeTaskId;

    // Reactive live status broadcast for employee attendance state (EMPLOYEE only)
    useEffect(() => {
        if (!user || !isMonitoredEmployee) return;
        const resolvedEmpId = user?.employeeId || user?.employee?.id || user?.id;
        if (!resolvedEmpId) return;

        if (isOnBreak) {
            broadcastStaffStatus({
                employeeId: resolvedEmpId,
                status: 'break',
                isIdle: false,
                isOnBreak: true,
                activeApp: 'On Break',
                currentActivity: 'On Break'
            });
        } else if (isClockedIn) {
            broadcastStaffStatus({
                employeeId: resolvedEmpId,
                status: 'online',
                isIdle: false,
                isOnBreak: false,
                activeApp: isTrackerActive ? 'Active Work (Screen Recording)' : 'Active Work',
                currentActivity: 'Active / Logged In'
            });
        }
    }, [user, isClockedIn, isOnBreak, isTrackerActive, isMonitoredEmployee]);

    // Sync task ID with Electron Desktop Agent whenever it changes
    useEffect(() => {
        if (!user || !isMonitoredEmployee) return;
        if (window.electronAPI?.setActiveTask) {
            window.electronAPI.setActiveTask(activeTaskId);
        } else if (window.electron?.sendTask) {
            window.electron.sendTask(activeTaskId);
        }
    }, [activeTaskId, user, isMonitoredEmployee]);

    // Listen for custom task change events from frontend components or Dev 2 integrations
    useEffect(() => {
        if (!user || !isMonitoredEmployee) return;
        const handleTaskChange = (event) => {
            const newTaskId = event.detail?.taskId || event.detail || null;
            const sanitized = (typeof newTaskId === 'string' && newTaskId.trim().length > 0) ? newTaskId.trim() : null;
            setActiveTaskId(sanitized);
            if (sanitized) {
                localStorage.setItem('activeTaskId', sanitized);
            } else {
                localStorage.removeItem('activeTaskId');
            }
            if (window.electronAPI?.setActiveTask) {
                window.electronAPI.setActiveTask(sanitized);
            }
        };

        window.addEventListener('task:change', handleTaskChange);
        window.addEventListener('task:set-active', handleTaskChange);
        return () => {
            window.removeEventListener('task:change', handleTaskChange);
            window.removeEventListener('task:set-active', handleTaskChange);
        };
    }, [user, isMonitoredEmployee]);

    const streamRef = useRef(null);
    const intervalRef = useRef(null);
    const videoRef = useRef(null);
    const isStartingRef = useRef(false);

    // ─── Cursor Activity & Inactivity Monitoring State (Requirements 2, 3, 4, 5) ─
    const [showIdleModal, setShowIdleModal] = useState(false);
    const showIdleModalRef = useRef(false);
    const [idleMinutesPrompt, setIdleMinutesPrompt] = useState(10);
    const lastActivityRef = useRef(Date.now());
    const idleStatusRef = useRef('ACTIVE'); // 'ACTIVE' | 'PASSIVE' | 'IDLE_WARNING' | 'IDLE' | 'BREAK'
    const idleStartTimeRef = useRef(null);
    const hasSentPassiveAlertRef = useRef(false);
    const hasSentWarningAlertRef = useRef(false);
    const hasSentIdleAlertRef = useRef(false);
    const idleTimerIntervalRef = useRef(null);

    // Activity Detection on window (mouse move, click, scroll, keyboard input) - EMPLOYEE only
    useEffect(() => {
        if (!user || !isMonitoredEmployee) return;

        // Request browser Notification permission for desktop alerts
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission().catch(() => {});
        }

        const handleUserActivity = () => {
            // If the idle alert modal is currently open, DO NOT close it on mouse/keyboard touch!
            // The employee must explicitly choose "I am working" or "I am on a break".
            if (showIdleModalRef.current) {
                return;
            }

            const now = Date.now();
            lastActivityRef.current = now;

            // If employee was inactive (PASSIVE or IDLE_WARNING before modal opened), resume to ACTIVE
            if (idleStatusRef.current === 'PASSIVE' || idleStatusRef.current === 'IDLE_WARNING') {
                const prev = idleStatusRef.current;
                const startTime = idleStartTimeRef.current;
                const duration = startTime
                    ? Math.round((now - new Date(startTime).getTime()) / 1000)
                    : 0;

                console.log(`[WebTrackerAgent] Genuine cursor/input detected! Resuming from ${prev} to ACTIVE (${duration}s idle).`);

                idleStatusRef.current = 'ACTIVE';
                hasSentPassiveAlertRef.current = false;
                hasSentWarningAlertRef.current = false;
                hasSentIdleAlertRef.current = false;
                idleStartTimeRef.current = null;

                const resolvedEmpId = user?.employeeId || user?.employee?.id || user?.id;
                broadcastStaffStatus({
                    employeeId: resolvedEmpId,
                    status: 'online',
                    isIdle: false,
                    isOnBreak: false,
                    activeApp: 'Active Work',
                    currentActivity: 'Active / Logged In'
                });
                if (resolvedEmpId) {
                    api.post('/agent/idle-activity', {
                        employeeId: resolvedEmpId,
                        status: 'RESUMED',
                        idleDuration: duration,
                        taskId: activeTaskIdRef.current,
                        source: 'WEB_AGENT'
                    }).catch(() => {});
                }
            }
        };

        // Listen for genuine user input without recording keystrokes, text or passwords
        window.addEventListener('mousemove', handleUserActivity, { passive: true });
        window.addEventListener('mousedown', handleUserActivity, { passive: true });
        window.addEventListener('keydown', handleUserActivity, { passive: true });
        window.addEventListener('wheel', handleUserActivity, { passive: true });
        window.addEventListener('scroll', handleUserActivity, { passive: true });

        return () => {
            window.removeEventListener('mousemove', handleUserActivity);
            window.removeEventListener('mousedown', handleUserActivity);
            window.removeEventListener('keydown', handleUserActivity);
            window.removeEventListener('wheel', handleUserActivity);
            window.removeEventListener('scroll', handleUserActivity);
        };
    }, [role, user]);

    // Periodic 5-second Inactivity Check (EMPLOYEE only)
    useEffect(() => {
        if (!user || !isMonitoredEmployee) {
            if (idleTimerIntervalRef.current) clearInterval(idleTimerIntervalRef.current);
            return;
        }

        const checkInactivity = () => {
            const { isClockedIn, isOnBreak } = useAuthStore.getState();
            if (!isClockedIn) {
                return;
            }

            const now = Date.now();
            const idleSec = Math.round((now - lastActivityRef.current) / 1000);
            const resolvedEmpId = user?.employeeId || user?.employee?.id || user?.id;

            // 0. AUTO CLOCK-OUT: 15 minutes (900 seconds) of inactivity / freeze
            if (idleSec >= 15 * 60) {
                console.log(`[WebTrackerAgent] 15 minutes of inactivity detected (${idleSec}s). Auto clocking out.`);
                showIdleModalRef.current = false;
                setShowIdleModal(false);
                idleStatusRef.current = 'OFFLINE';

                // Stop tracker recording if active
                if (useAuthStore.getState().isTrackerActive) {
                    useAuthStore.getState().setTrackerActive(false);
                }

                // Execute auto clock-out
                useAuthStore.getState().clockOut();

                toast.error('Auto Clock-Out: You have been clocked out due to 15 minutes of inactivity.');

                if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                    try {
                        new window.Notification('Auto Clock-Out', {
                            body: 'You have been automatically clocked out due to 15 minutes of inactivity.',
                            icon: '/favicon.ico'
                        });
                    } catch (e) {}
                }

                if (socket) {
                    socket.emit('employee:status_override', { status: 'OFFLINE' });
                }

                broadcastStaffStatus({
                    employeeId: resolvedEmpId,
                    status: 'offline',
                    isIdle: false,
                    isOnBreak: false,
                    activeApp: 'Offline (Auto Clock-Out)',
                    currentActivity: 'Offline'
                });

                if (resolvedEmpId) {
                    api.post('/agent/idle-activity', {
                        employeeId: resolvedEmpId,
                        status: 'AUTO_CLOCKED_OUT',
                        idleDuration: idleSec,
                        source: 'WEB_AGENT'
                    }).catch(() => {});
                }
                return;
            }

            // Guard: If employee is on break or modal is already showing (within the 15 min window), skip opening duplicate prompts
            if (isOnBreak || showIdleModalRef.current) {
                return;
            }

            // 1. Stage: IDLE (1 minute / 60 seconds - triggers Employee Inactivity Alert)
            if (idleSec >= 60) {
                if (idleStatusRef.current !== 'IDLE') {
                    idleStatusRef.current = 'IDLE';
                    if (!idleStartTimeRef.current) {
                        idleStartTimeRef.current = new Date(now - idleSec * 1000).toISOString();
                    }

                    if (!hasSentIdleAlertRef.current) {
                        hasSentIdleAlertRef.current = true;
                        setIdleMinutesPrompt(1);
                        showIdleModalRef.current = true;
                        setShowIdleModal(true);

                        // Freeze work session timer at this exact elapsed time!
                        const storeState = useAuthStore.getState();
                        const currentSessionSec = getActiveSessionSeconds(
                            storeState.activeAttendance,
                            storeState.isClockedIn,
                            storeState.isOnBreak
                        );
                        storeState.pauseSessionForIdle(currentSessionSec);

                        // Trigger In-App Alert Toast Notification
                        toast.error('Employee Inactivity Alert: You have been inactive for 1 minute. Please resume your work.');

                        // Trigger Browser Native Desktop Notification
                        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                            try {
                                new window.Notification('Employee Inactivity Alert', {
                                    body: 'You have been inactive for 1 minute. Please resume your work.',
                                    icon: '/favicon.ico'
                                });
                            } catch (e) {
                                console.warn('[WebTrackerAgent] Notification error:', e);
                            }
                        }

                        broadcastStaffStatus({
                            employeeId: resolvedEmpId,
                            status: 'idle',
                            isIdle: true,
                            isOnBreak: false,
                            activeApp: 'Away from Computer (Idle)',
                            currentActivity: 'Away from Computer (Idle)'
                        });

                        if (socket) {
                            socket.emit('employee:status_override', { status: 'IDLE' });
                            socket.emit('employee:activity', {
                                activeApp: 'Away from Computer (Idle)',
                                activeWindow: 'Away from Computer (Idle)',
                                idleTime: idleSec,
                                keystrokes: 0,
                                mouseClicks: 0
                            });
                        }

                        if (resolvedEmpId) {
                            api.post('/agent/idle-activity', {
                                employeeId: resolvedEmpId,
                                status: 'IDLE',
                                idleDuration: idleSec,
                                idleStartTime: idleStartTimeRef.current,
                                taskId: activeTaskIdRef.current,
                                source: 'WEB_AGENT'
                            }).catch(() => {});
                        }
                    }
                }
            }
            // 2. Stage: IDLE WARNING (45 seconds reminder)
            else if (idleSec >= 45) {
                if (idleStatusRef.current !== 'IDLE_WARNING' && idleStatusRef.current !== 'IDLE') {
                    idleStatusRef.current = 'IDLE_WARNING';
                    if (!idleStartTimeRef.current) {
                        idleStartTimeRef.current = new Date(now - idleSec * 1000).toISOString();
                    }

                    if (!hasSentWarningAlertRef.current) {
                        hasSentWarningAlertRef.current = true;
                        toast.warning('Activity Reminder: No recent mouse or keyboard activity detected.');

                        if (resolvedEmpId) {
                            api.post('/agent/idle-activity', {
                                employeeId: resolvedEmpId,
                                status: 'IDLE_WARNING',
                                idleDuration: idleSec,
                                idleStartTime: idleStartTimeRef.current,
                                taskId: activeTaskIdRef.current,
                                source: 'WEB_AGENT'
                            }).catch(() => {});
                        }
                    }
                }
            }
            // 3. Stage: PASSIVE (30 seconds initial inactivity detection)
            else if (idleSec >= 30) {
                if (idleStatusRef.current === 'ACTIVE') {
                    idleStatusRef.current = 'PASSIVE';
                    if (!hasSentPassiveAlertRef.current) {
                        hasSentPassiveAlertRef.current = true;
                        console.log(`[WebTrackerAgent] Inactivity detected: 30s elapsed. Status -> PASSIVE.`);
                        if (resolvedEmpId) {
                            api.post('/agent/idle-activity', {
                                employeeId: resolvedEmpId,
                                status: 'PASSIVE',
                                idleDuration: idleSec,
                                taskId: activeTaskIdRef.current,
                                source: 'WEB_AGENT'
                            }).catch(() => {});
                        }
                    }
                }
            }
        };

        idleTimerIntervalRef.current = setInterval(checkInactivity, 5000);
        return () => {
            if (idleTimerIntervalRef.current) clearInterval(idleTimerIntervalRef.current);
        };
    }, [role, user]);

    // Handle Desktop Agent IPC events if running inside Electron wrapper (EMPLOYEE only)
    useEffect(() => {
        if (!user || !isMonitoredEmployee) return;
        if (window.electronAPI?.onIdlePrompt) {
            const cleanup = window.electronAPI.onIdlePrompt((data) => {
                setIdleMinutesPrompt(Math.floor((data.idleDuration || 600) / 60));
                showIdleModalRef.current = true;
                setShowIdleModal(true);
                const storeState = useAuthStore.getState();
                const currentSessionSec = getActiveSessionSeconds(
                    storeState.activeAttendance,
                    storeState.isClockedIn,
                    storeState.isOnBreak
                );
                storeState.pauseSessionForIdle(currentSessionSec);
            });
            return cleanup;
        }
    }, []);

    // Handle Employee Modal Confirmation ('I am working' or 'I am on a break')
    const handleIdleModalResponse = async (responseType) => {
        const resolvedEmpId = user?.employeeId || user?.employee?.id || user?.id;
        try {
            if (window.electronAPI?.respondToIdlePrompt) {
                await window.electronAPI.respondToIdlePrompt(responseType);
            } else if (resolvedEmpId) {
                await api.post('/agent/idle-response', {
                    employeeId: resolvedEmpId,
                    response: responseType,
                    taskId: activeTaskIdRef.current
                }).catch(() => {});
            }

            if (responseType === 'WORKING') {
                broadcastStaffStatus({
                    employeeId: resolvedEmpId,
                    status: 'online',
                    isIdle: false,
                    isOnBreak: false,
                    activeApp: 'Active Work',
                    currentActivity: 'Active / Logged In'
                });
                if (socket) {
                    socket.emit('employee:status_override', { status: 'ONLINE' });
                    socket.emit('employee:activity', {
                        activeApp: 'Active Work',
                        activeWindow: 'Active Work',
                        idleTime: 0,
                        keystrokes: 1,
                        mouseClicks: 1
                    });
                }
                idleStatusRef.current = 'ACTIVE';
                lastActivityRef.current = Date.now();
                hasSentIdleAlertRef.current = false;
                hasSentWarningAlertRef.current = false;
                hasSentPassiveAlertRef.current = false;
                idleStartTimeRef.current = null;
                showIdleModalRef.current = false;
                setShowIdleModal(false);

                // Resume the paused session timer so it starts counting upwards again seamlessly
                useAuthStore.getState().resumeSessionFromIdle();

                toast.success('Work session resumed.');
            } else if (responseType === 'BREAK') {
                broadcastStaffStatus({
                    employeeId: resolvedEmpId,
                    status: 'break',
                    isIdle: false,
                    isOnBreak: true,
                    activeApp: 'On Break',
                    currentActivity: 'On Break'
                });
                if (socket) {
                    socket.emit('employee:status_override', { status: 'BREAK' });
                }
                idleStatusRef.current = 'BREAK';
                showIdleModalRef.current = false;
                setShowIdleModal(false);

                // Release modal pause lock
                useAuthStore.getState().resumeSessionFromIdle();

                // Start official break so session banner displays "Session Paused", "On Break", and "Resume Work"
                if (!useAuthStore.getState().isOnBreak) {
                    await useAuthStore.getState().toggleBreak();
                }

                toast.info('Break mode activated. Work timer is paused.');
            }
        } catch (err) {
            console.error('[WebTrackerAgent] Failed to submit idle confirmation:', err);
            showIdleModalRef.current = false;
            setShowIdleModal(false);
            useAuthStore.getState().resumeSessionFromIdle();
        }
    };

    // ─── Video Recording Refs ──────────────────────────────────────────────────
    const mediaRecorderRef = useRef(null);
    const recordingChunkIntervalRef = useRef(null);
    
    // WebRTC Live Monitoring
    const pcRef = useRef(null);

    // Only render for EMPLOYEE role
    if (role !== 'EMPLOYEE') return null;


    // ─── Video Recording (5-minute WebM chunks) ────────────────────────────────
    const startVideoRecording = () => {
        if (!streamRef.current || mediaRecorderRef.current) return;

        const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp8')
            ? 'video/webm;codecs=vp8'
            : 'video/webm';

        let recorder;
        try {
            recorder = new MediaRecorder(streamRef.current, { mimeType });
        } catch (err) {
            console.error('[WebTrackerAgent] MediaRecorder init failed:', err);
            return;
        }

        const chunks = [];

        recorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) chunks.push(e.data);
        };

        recorder.onstop = async () => {
            if (chunks.length === 0) return;
            const blob = new Blob(chunks, { type: mimeType });
            chunks.length = 0; // Clear array in-place for GC

            const formData = new FormData();
            formData.append('video', blob, `recording-${Date.now()}.webm`);
            const resolvedEmpId = user?.employeeId || user?.employee?.id || user?.id || '';
            formData.append('employeeId', resolvedEmpId);

            // Upload with exponential backoff (3 attempts)
            for (let attempt = 1; attempt <= 3; attempt++) {
                try {
                    await videoService.uploadVideo(formData);
                    console.log('[WebTrackerAgent] Video chunk uploaded successfully.');
                    break;
                } catch (err) {
                    console.warn(`[WebTrackerAgent] Video upload attempt ${attempt} failed:`, err.message);
                    if (attempt === 3) {
                        console.error('[WebTrackerAgent] Video upload failed after 3 attempts. Chunk dropped.');
                    } else {
                        await new Promise((r) => setTimeout(r, 2000 * attempt));
                    }
                }
            }
        };

        recorder.onerror = (e) => {
            console.error('[WebTrackerAgent] MediaRecorder error:', e.error);
        };

        recorder.start();
        mediaRecorderRef.current = recorder;
        console.log('[WebTrackerAgent] Video recording started (chunk interval: 5 min).');

        // Every 5 minutes: stop current recorder (triggers onstop → upload), start new chunk
        recordingChunkIntervalRef.current = setInterval(() => {
            const current = mediaRecorderRef.current;
            if (current && current.state === 'recording') {
                current.stop(); // onstop handler uploads this chunk
                mediaRecorderRef.current = null;
                // Brief delay to let onstop fire before starting next recorder
                setTimeout(() => {
                    if (streamRef.current) startVideoRecording();
                }, 500);
            }
        }, 5 * 60 * 1000);
    };

    const stopVideoRecording = () => {
        // Clear chunk rotation interval
        if (recordingChunkIntervalRef.current) {
            clearInterval(recordingChunkIntervalRef.current);
            recordingChunkIntervalRef.current = null;
        }
        // Stop active recorder — onstop will upload the final partial chunk
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current = null;
            console.log('[WebTrackerAgent] Video recording stopped. Final chunk queued for upload.');
        }
    };

    // ─── Screenshot capture ────────────────────────────────────────────────────
    const captureAndUpload = async () => {
        if (!videoRef.current || !streamRef.current) return;
        try {
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

            canvas.toBlob(async (blob) => {
                if (!blob) return;
                const formData = new FormData();
                formData.append('image', blob, `agent-capture-${Date.now()}.png`);
                formData.append('employeeId', user?.employeeId || '');
                formData.append('productivity', 'PRODUCTIVE');
                formData.append('blurred', settings.globalBlur ? 'true' : 'false');
                if (activeTaskIdRef.current) {
                    formData.append('taskId', activeTaskIdRef.current);
                }
                await screenshotService.uploadRealScreenshot(formData);
                console.log(`[WebTrackerAgent] Screenshot uploaded. Active Task: ${activeTaskIdRef.current || 'None'}`);
            }, 'image/png');
        } catch (err) {
            console.error('[WebTrackerAgent] Screenshot capture failed:', err);
        }
    };

    // ─── Start tracking ────────────────────────────────────────────────────────
    const startTracking = async () => {
        if (isStartingRef.current) return;
        if (isTrackingRef.current || (streamRef.current?.active && streamRef.current.getVideoTracks().some(t => t.readyState === 'live'))) {
            console.log('[WebTrackerAgent] Stream is already active. Skipping duplicate prompt.');
            setIsTracking(true);
            isTrackingRef.current = true;
            setTrackerActive(true);
            return;
        }

        try {
            isStartingRef.current = true;
            setError('');

            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: { displaySurface: 'monitor', cursor: 'always' },
                audio: false,
            });

            const track = stream.getVideoTracks()[0];
            const trackSettings = track.getSettings();

            // Screen sharing check
            if (trackSettings.displaySurface !== 'monitor') {
                track.stop();
                setError('You MUST share your ENTIRE SCREEN. Window or Tab sharing is not allowed.');
                setIsTracking(false);
                isTrackingRef.current = false;
                setTrackerActive(false);
                return;
            }

            streamRef.current = stream;

            const video = document.createElement('video');
            video.srcObject = stream;
            video.play();
            videoRef.current = video;

            await new Promise((resolve) => { video.onplaying = resolve; });

            // Trigger Location Permission
            if ("geolocation" in navigator) {
                navigator.geolocation.getCurrentPosition(() => {}, () => {}, { enableHighAccuracy: true });
            }

            setIsTracking(true);
            isTrackingRef.current = true;
            setTrackerActive(true);
            setError('');

            // Stop when user ends screen share via browser UI
            track.onended = () => stopTracking();

            // Screenshot interval
            captureAndUpload();
            const intervalMs = (settings.frequency || 10) * 60 * 1000;
            intervalRef.current = setInterval(captureAndUpload, intervalMs);

            // ─── Start chunked video recording ────────────────────────────────
            startVideoRecording();

        } catch (err) {
            console.error('[WebTrackerAgent] Failed to start tracking:', err);
            setError('Permission denied. Please allow screen sharing to start tracking.');
            setIsTracking(false);
            isTrackingRef.current = false;
            setTrackerActive(false);
        } finally {
            isStartingRef.current = false;
        }
    };

    const stopTracking = async () => {
        // ─── Stop video recording first (uploads final chunk) ─────────────────
        stopVideoRecording();

        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
        }
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        setIsTracking(false);
        isTrackingRef.current = false;
        setTrackerActive(false);
    };

    // ─── Lifecycle effects ─────────────────────────────────────────────────────
    // Settings fetch
    useEffect(() => {
        const init = async () => {
            try {
                const res = await screenshotService.getSettings();
                if (res.success && res.data) {
                    setSettings({ frequency: res.data.frequency, globalBlur: res.data.globalBlur });
                }
            } catch (err) {
                console.error('[WebTrackerAgent] Failed to fetch settings:', err);
            }
        };
        init();
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        const handleUnload = () => stopTracking();
        const handleStartTrackerEvent = () => startTracking().catch(() => {});
        const handleStopTrackerEvent = () => stopTracking();
        
        window.addEventListener('beforeunload', handleUnload);
        window.addEventListener('start-web-tracker', handleStartTrackerEvent);
        window.addEventListener('stop-web-tracker', handleStopTrackerEvent);
        
        return () => {
            window.removeEventListener('beforeunload', handleUnload);
            window.removeEventListener('start-web-tracker', handleStartTrackerEvent);
            window.removeEventListener('stop-web-tracker', handleStopTrackerEvent);
            stopTracking();
        };
    }, []);

    // Stop if role changes away from EMPLOYEE or if logged out
    useEffect(() => {
        if (role !== 'EMPLOYEE') stopTracking();
    }, [role]);

    // Cleanup tracks only when unmounting, but don't force clockOut if persistent
    useEffect(() => {
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (recordingChunkIntervalRef.current) clearInterval(recordingChunkIntervalRef.current);
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                mediaRecorderRef.current.stop();
            }
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(t => t.stop());
            }
        };
    }, []);

    // ─── WebRTC Live Signaling ───────────────────────────────────────────────
    useEffect(() => {
        if (!socket || role !== 'EMPLOYEE' || !isTracking) return;

        const handleLiveRequest = async ({ requesterId }) => {
            console.log('[WebTrackerAgent] Received live request from:', requesterId);
            
            if (pcRef.current) {
                pcRef.current.close();
            }

            const pc = new RTCPeerConnection({
                iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
            });
            pcRef.current = pc;

            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => pc.addTrack(track, streamRef.current));
            }

            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    emit('live:candidate', { 
                        targetId: requesterId, 
                        candidate: event.candidate,
                        forEmployeeId: user?.employeeId 
                    });
                }
            };

            try {
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                emit('live:offer', { requesterId, offer });
            } catch (err) {
                console.error('[WebTrackerAgent] WebRTC Offer failed:', err);
            }
        };

        const handleLiveAnswer = async ({ answer }) => {
            if (pcRef.current) {
                try {
                    await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
                } catch (err) {
                    console.error('[WebTrackerAgent] WebRTC Answer failed:', err);
                }
            }
        };

        const handleIceCandidate = async ({ candidate }) => {
            if (pcRef.current) {
                try {
                    await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
                } catch (err) {
                    console.error('[WebTrackerAgent] WebRTC Candidate failed:', err);
                }
            }
        };

        on('live:request', handleLiveRequest);
        on('live:answer', handleLiveAnswer);
        on('live:candidate', handleIceCandidate);

        return () => {
            off('live:request', handleLiveRequest);
            off('live:answer', handleLiveAnswer);
            off('live:candidate', handleIceCandidate);
            if (pcRef.current) {
                pcRef.current.close();
                pcRef.current = null;
            }
        };
    }, [socket, role, isTracking, emit, on, off]);

    // Removed arbitrary click auto-start
    // The user will explicitly click "Start Tracker" in the WorkSessionBanner now.
    
    // Dynamic screenshot frequency update
    useEffect(() => {
        if (isTracking && intervalRef.current) {
            clearInterval(intervalRef.current);
            const intervalMs = (settings.frequency || 10) * 60 * 1000;
            intervalRef.current = setInterval(captureAndUpload, intervalMs);
        }
    }, [settings.frequency, isTracking]);

    // Use isTrackerActive to hide the global overlay
    // Disabled as per user request to allow direct dashboard access
    const showLoadingOverlay = false; // !isTrackerActive && role === 'EMPLOYEE';

    if (!isMonitoredEmployee) return null;

    return (
        <>
            {/* We no longer render the tiny top-left badge; 
                the UI is managed fully by the WorkSessionBanner and this Overlay */}
            
            {/* Compliance Blocking Overlay */}
            {showLoadingOverlay && createPortal(
                <div
                    className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/90 backdrop-blur-2xl animate-in fade-in duration-500 pointer-events-auto"
                    onContextMenu={(e) => e.preventDefault()}
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh' }}
                >
                    <div className="bg-white dark:bg-slate-900 p-8 sm:p-12 rounded-[2rem] shadow-[0_35px_60px_-15px_rgba(0,0,0,0.6)] max-w-lg w-full mx-4 border border-slate-200 dark:border-slate-800 text-center">
                        <div className="h-24 w-24 bg-rose-100 dark:bg-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-8 border-4 border-white dark:border-slate-900 shadow-xl">
                            <ShieldAlert size={48} className="text-rose-600 dark:text-rose-400 animate-pulse" />
                        </div>

                        <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">
                            System Locked
                        </h2>

                        <p className="text-slate-500 dark:text-slate-400 text-base mb-8 leading-relaxed font-medium">
                            To unlock the software and access your dashboard, you must first activate the <strong className="text-slate-900 dark:text-white">Web Tracker Agent</strong> and share your <strong className="text-slate-900 dark:text-white underline decoration-rose-500 decoration-2">ENTIRE SCREEN</strong>.
                        </p>

                        {error && (
                            <div className="mb-8 p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl flex items-center gap-3 text-left animate-in slide-in-from-bottom-3">
                                <ShieldAlert size={24} className="text-rose-500 shrink-0" />
                                <span className="text-xs font-bold text-rose-700 dark:text-rose-400 uppercase leading-tight tracking-wider">{error}</span>
                            </div>
                        )}

                        <button
                            onClick={() => startTracking().catch(()=>{})}
                            className="w-full py-5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-lg font-black uppercase tracking-widest shadow-[0_10px_30px_rgba(225,29,72,0.3)] transition-all hover:scale-[1.02] active:scale-95 mb-6 flex items-center justify-center gap-3"
                        >
                            <MonitorCheck size={24} />
                            <span>Launch Web Tracker</span>
                        </button>

                        <div className="flex items-center justify-center gap-4 text-[10px] text-slate-400 uppercase font-black tracking-widest opacity-60">
                            <span>Requires Screen Share</span>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Employee Inactivity Alert Modal (Requirements 4 & 5) */}
            {showIdleModal && createPortal(
                <div
                    className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-300 pointer-events-auto p-4"
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh' }}
                >
                    <div className="bg-[#1C2419] border border-[#C9A96E]/30 rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 text-center text-[#E8DFD1] animate-in zoom-in-95 duration-200">
                        <div className="h-16 w-16 mx-auto mb-5 rounded-2xl bg-[#C9A96E]/15 border border-[#C9A96E]/30 flex items-center justify-center shadow-inner">
                            <Clock className="w-8 h-8 text-[#C9A96E] animate-pulse" />
                        </div>

                        <div className="inline-block px-3 py-1 rounded-full bg-[#C9A96E]/15 border border-[#C9A96E]/30 text-[#C9A96E] text-xs font-semibold uppercase tracking-wider mb-3">
                            Inactivity Alert
                        </div>

                        <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#E8DFD1] mb-2 tracking-tight">
                            Employee Inactivity Alert
                        </h3>

                        <p className="text-sm text-[#9E988A] leading-relaxed mb-6 font-medium">
                            You have been inactive for 1 minute. Please resume your work.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <button
                                onClick={() => handleIdleModalResponse('WORKING')}
                                className="flex-1 py-3 px-5 bg-[#C9A96E] hover:bg-[#d8b87d] text-[#161C14] rounded-xl font-bold text-sm tracking-wide shadow-lg transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <Briefcase className="w-4 h-4 text-[#161C14]" />
                                <span>I am working</span>
                            </button>
                            <button
                                onClick={() => handleIdleModalResponse('BREAK')}
                                className="flex-1 py-3 px-5 bg-[#252E22] hover:bg-[#2E3A2A] text-[#E8DFD1] border border-[#3E4F39] rounded-xl font-medium text-sm tracking-wide transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <Coffee className="w-4 h-4 text-[#9E988A]" />
                                <span>I am on a break</span>
                            </button>
                        </div>
                        <p className="mt-4 text-[11px] text-[#9E988A] opacity-75">
                            Please select an option above to resume your session or transition to break mode.
                        </p>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
