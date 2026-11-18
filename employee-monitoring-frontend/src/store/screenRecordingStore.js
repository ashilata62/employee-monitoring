import { create } from 'zustand';
import videoService from '../services/videoService';
import { toast } from '../utils/toastManager';
import { useAuthStore } from './authStore';

// Non-reactive singleton refs that persist across route changes
let activeStream = null;
let activeRecorder = null;
let recordedChunks = [];
let recordingTimer = null;
let selectedTargetEmployeeId = null;
let uploadWatchdog = null;

const clearWatchdog = () => {
    if (uploadWatchdog) {
        clearTimeout(uploadWatchdog);
        uploadWatchdog = null;
    }
};

export const formatRecordingTimer = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const useScreenRecordingStore = create((set, get) => ({
    isRecording: false,
    recordingSeconds: 0,
    isUploading: false,
    lastSavedVideo: null,

    startRecording: async (targetEmployeeId = null) => {
        if (get().isRecording || get().isUploading) return;
        clearWatchdog();

        try {
            let stream = null;
            try {
                // Optimized screen capture: 15-24 fps and 1080p max to keep file size lightweight and upload instant
                stream = await navigator.mediaDevices.getDisplayMedia({
                    video: {
                        cursor: 'always',
                        displaySurface: 'monitor',
                        frameRate: { ideal: 15, max: 24 },
                        width: { max: 1920 },
                        height: { max: 1080 }
                    },
                    audio: false
                });
            } catch (err) {
                stream = await navigator.mediaDevices.getDisplayMedia({
                    video: { cursor: 'always' },
                    audio: false
                });
            }

            if (!stream) return;

            activeStream = stream;
            recordedChunks = [];
            selectedTargetEmployeeId = targetEmployeeId;

            const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp8')
                ? 'video/webm;codecs=vp8'
                : (MediaRecorder.isTypeSupported('video/webm') ? 'video/webm' : 'video/mp4');

            // 800 kbps gives crisp text while reducing file size by ~85% for lightning-fast save time
            let recorder;
            try {
                recorder = new MediaRecorder(stream, {
                    mimeType,
                    videoBitsPerSecond: 800000
                });
            } catch (recErr) {
                recorder = new MediaRecorder(stream, { mimeType });
            }

            activeRecorder = recorder;

            recorder.ondataavailable = (e) => {
                if (e.data && e.data.size > 0) {
                    recordedChunks.push(e.data);
                }
            };

            recorder.onstop = async () => {
                try {
                    const chunks = [...recordedChunks];
                    recordedChunks = [];

                    if (recordingTimer) {
                        clearInterval(recordingTimer);
                        recordingTimer = null;
                    }

                    if (activeStream) {
                        activeStream.getTracks().forEach(t => {
                            try { t.stop(); } catch (e) { /* ignore */ }
                        });
                        activeStream = null;
                    }
                    activeRecorder = null;
                    set({ isRecording: false, recordingSeconds: 0 });

                    if (chunks.length === 0) {
                        clearWatchdog();
                        set({ isUploading: false });
                        toast.error('No video data was captured.');
                        return;
                    }

                    const blob = new Blob(chunks, { type: mimeType });
                    await get().uploadRecordedVideo(blob);
                } catch (err) {
                    console.error('[ScreenRecording] onstop error:', err);
                    clearWatchdog();
                    set({ isUploading: false, isRecording: false, recordingSeconds: 0 });
                }
            };

            const videoTrack = stream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.onended = () => {
                    console.log('[ScreenRecording] Stream ended by user via browser UI.');
                    get().stopRecording();
                };
            }

            recorder.start(1000);
            set({ isRecording: true, recordingSeconds: 0, isUploading: false });

            recordingTimer = setInterval(() => {
                set(state => ({ recordingSeconds: state.recordingSeconds + 1 }));
            }, 1000);

            toast.info('Screen recording started. You can navigate between any pages; recording will continue.');
        } catch (err) {
            clearWatchdog();
            if (err.name !== 'NotAllowedError') {
                console.error('Failed to start recording:', err);
                toast.error('Could not start screen recording: ' + err.message);
            }
            set({ isRecording: false, isUploading: false, recordingSeconds: 0 });
        }
    },

    stopRecording: () => {
        clearWatchdog();
        // Set a 15-second watchdog timer to prevent UI from freezing forever if upload stalls
        uploadWatchdog = setTimeout(() => {
            console.warn('[ScreenRecording] Watchdog timed out. Forcing isUploading to false.');
            set({ isUploading: false, isRecording: false, recordingSeconds: 0 });
            toast.warning('Video upload took too long or was interrupted.');
        }, 15000);

        if (activeRecorder && activeRecorder.state === 'recording') {
            try {
                set({ isUploading: true });
                // Flush remaining buffer data
                if (typeof activeRecorder.requestData === 'function') {
                    try { activeRecorder.requestData(); } catch (e) { /* ignore */ }
                }
                activeRecorder.stop();
            } catch (err) {
                console.error('[ScreenRecording] Error stopping recorder:', err);
                clearWatchdog();
                set({ isUploading: false, isRecording: false, recordingSeconds: 0 });
            }
        } else {
            // Already inactive or stopped
            if (activeStream) {
                activeStream.getTracks().forEach(t => {
                    try { t.stop(); } catch (e) { /* ignore */ }
                });
                activeStream = null;
            }
            activeRecorder = null;
            if (recordingTimer) {
                clearInterval(recordingTimer);
                recordingTimer = null;
            }
            clearWatchdog();
            set({ isRecording: false, recordingSeconds: 0, isUploading: false });
        }
    },

    uploadRecordedVideo: async (blob) => {
        set({ isUploading: true });
        try {
            const authState = useAuthStore.getState();
            const user = authState.user;

            let empId = selectedTargetEmployeeId;
            if (!empId || empId === 'All') {
                empId = user?.employeeId || user?.employee?.id || user?.id;
            }

            const formData = new FormData();
            formData.append('video', blob, `screen-recording-${Date.now()}.webm`);
            if (empId) {
                formData.append('employeeId', empId);
            }

            const res = await videoService.uploadVideo(formData);

            if (res && res.success) {
                toast.success('Screen recording saved successfully!');
                set({ lastSavedVideo: res.data });
                window.dispatchEvent(new CustomEvent('video-recording-saved', { detail: res.data }));
            } else {
                toast.error(res?.message || 'Failed to save recording');
            }
        } catch (err) {
            console.error('Failed to upload video recording:', err);
            toast.error(err.response?.data?.message || err.message || 'Failed to upload video');
        } finally {
            clearWatchdog();
            set({ isUploading: false, isRecording: false, recordingSeconds: 0 });
        }
    },

    forceReset: () => {
        clearWatchdog();
        if (recordingTimer) {
            clearInterval(recordingTimer);
            recordingTimer = null;
        }
        if (activeStream) {
            activeStream.getTracks().forEach(t => {
                try { t.stop(); } catch (e) { /* ignore */ }
            });
            activeStream = null;
        }
        activeRecorder = null;
        recordedChunks = [];
        set({ isRecording: false, isUploading: false, recordingSeconds: 0 });
    }
}));
