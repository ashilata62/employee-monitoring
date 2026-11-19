
import React, { useState, useRef, useEffect, useMemo, useCallback, memo } from 'react';
import {
  Grid,
  List,
  Filter,
  Eye,
  EyeOff,
  Calendar,
  Download,
  Trash2,
  Clock,
  ChevronDown,
  Search,
  CheckCircle2,
  X,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Settings,
  Shield,
  Camera,
  RefreshCw,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Plus,
  Check,
  Globe,
  User,
  Users,
  Monitor,
  Folder,
  CheckSquare,
  Tag,
  PieChart,
  Video,
  FileVideo,
  Square,
  HardDrive,
  Maximize,
  Minimize2,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  AlertCircle,
  MoreVertical,
  Briefcase,
  Loader2
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useRealTime } from '../hooks/RealTimeContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import screenshotService from '../services/screenshotService';
import videoService from '../services/videoService';
import { useScreenRecordingStore, formatRecordingTimer } from '../store/screenRecordingStore';
import { toast } from '../utils/toastManager';
import { API_BASE_URL, BASE_URL } from '../config/api';

const cn = (...inputs) => twMerge(clsx(inputs));

const getImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('blob:')) return url;
  const cleanBase = BASE_URL.replace(/\/+$/, '');
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return `${cleanBase}${cleanPath}`;
};

// ─── Live Stream Viewer Component ───────────────────────────────────────────
const LiveStreamModal = memo(({ isOpen, onClose, employee, socket }) => {
  const { employees: contextEmployees } = useRealTime();
  const videoRef = useRef(null);
  const pcRef = useRef(null);
  const senderSocketIdRef = useRef(null);
  // Proactive status check
  const isEmployeeOnline = useMemo(() => {
    if (!employee || !contextEmployees) return false;
    const emp = contextEmployees.find(e => e.id === employee.id);
    return emp?.status === 'online' || emp?.status === 'idle';
  }, [employee, contextEmployees]);

  const [status, setStatus] = useState(isEmployeeOnline ? 'LIVE' : 'OFFLINE');

  useEffect(() => {
    if (!isOpen || !socket || !employee) return;

    // Set initial status based on online state
    if (!isEmployeeOnline) {
      setStatus('OFFLINE');
    } else {
      setStatus('LIVE');
    }

    let isEstablished = false;
    const timeout = setTimeout(() => {
      if (!isEstablished) setStatus('Offline or Not Sharing');
    }, 15000);

    console.log('[WebRTC] Starting receiver for:', employee.name);
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });
    pcRef.current = pc;

    pc.ontrack = (event) => {
      console.log('[WebRTC] Received track');
      isEstablished = true;
      clearTimeout(timeout);
      if (videoRef.current) {
        videoRef.current.srcObject = event.streams[0];
        setStatus('LIVE');
      }
    };

    const handleOffer = async ({ employeeId, offer, fromId }) => {
      if (employeeId !== employee.id) return;
      console.log('[WebRTC] Received offer from:', fromId);
      senderSocketIdRef.current = fromId;
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('live:answer', { employeeId, answer, targetId: fromId });
      } catch (err) {
        console.error('[WebRTC] Offer handling failed:', err);
      }
    };

    const handleCandidate = async ({ employeeId, candidate }) => {
      if (employeeId !== employee.id) return;
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error('[WebRTC] Candidate handling failed:', err);
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && senderSocketIdRef.current) {
        socket.emit('live:candidate', {
          targetId: senderSocketIdRef.current,
          candidate: event.candidate,
          forEmployeeId: employee.id
        });
      }
    };

    socket.on('live:offer', handleOffer);
    socket.on('live:candidate', handleCandidate);

    // Initial request
    socket.emit('live:request', { employeeId: employee.id });

    return () => {
      clearTimeout(timeout);
      socket.off('live:offer', handleOffer);
      socket.off('live:candidate', handleCandidate);
      pc.close();
      pcRef.current = null;
    };
  }, [isOpen, socket, employee, isEmployeeOnline]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-slate-900 rounded-[2.5rem] overflow-hidden border border-white/10 w-full max-w-5xl shadow-2xl relative animate-scale-in">
        <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-10">
          <div className="flex items-center gap-4 bg-black/40 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/10">
            <div className={cn("h-2 w-2 rounded-full", status === 'Live' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500')} />
            <span className="text-white text-xs font-black uppercase tracking-widest">{status}</span>
            <div className="h-4 w-[1px] bg-white/20 mx-1" />
            <span className="text-white/70 text-xs font-bold">{employee.name}</span>
          </div>
          <button onClick={onClose} className="h-10 w-10 bg-white/10 hover:bg-white/20 text-white rounded-xl flex items-center justify-center transition-all">
            <X size={20} />
          </button>
        </div>
        <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
          <video ref={videoRef} autoPlay playsInline className={cn("w-full h-full object-contain z-10 relative", status === 'LIVE' ? 'opacity-100' : 'opacity-0')} />
          {/* Fallback to latest screenshot if online and no stream yet */}
          {isEmployeeOnline && (
            <img
              src={getImageUrl(contextEmployees.find(e => e.id === employee.id)?.screenshotUrl || employee.screenshotUrl)}
              className="absolute inset-0 w-full h-full object-contain opacity-50 blur-sm"
              alt="Preview"
            />
          )}
        </div>
        {status !== 'LIVE' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <Monitor className="h-12 w-12 text-slate-700 mx-auto mb-4 animate-pulse" />
              <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">{status}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

// ─── Video Playback Modal Component (Phase 2 - Executive Cinema Edition) ─────
const VideoPlaybackModal = memo(({ isOpen, onClose, playlist = [], initialIndex = 0, onDeleteVideo, canDelete = false }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isBuffering, setIsBuffering] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [playActionFlash, setPlayActionFlash] = useState(null); // 'play' | 'pause' | null
  const flashTimerRef = useRef(null);

  const videoRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  const currentVideo = playlist && playlist[currentIndex] ? playlist[currentIndex] : null;

  // Reset states on chunk switch
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setHasError(false);
    setIsBuffering(true);
    setPlayActionFlash(null);
  }, [currentIndex, currentVideo?.id]);

  // Flash indicator helper for play/pause feedback without persistent blocking icons
  const triggerPlayFlash = (action) => {
    setPlayActionFlash(action);
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    flashTimerRef.current = setTimeout(() => {
      setPlayActionFlash(null);
    }, 600);
  };

  // Keyboard shortcuts (Space, Esc, arrows, M, F, T)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === ' ') {
        e.preventDefault();
        if (videoRef.current) {
          if (videoRef.current.paused) {
            videoRef.current.play().catch(() => { });
            triggerPlayFlash('play');
          } else {
            videoRef.current.pause();
            triggerPlayFlash('pause');
          }
        }
      }
      if (e.key === 'ArrowRight') {
        if (videoRef.current) {
          videoRef.current.currentTime = Math.min(videoRef.current.duration || 0, videoRef.current.currentTime + 5);
        }
      }
      if (e.key === 'ArrowLeft') {
        if (videoRef.current) {
          videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 5);
        }
      }
      if (e.key === 'm' || e.key === 'M') {
        setIsMuted(prev => !prev);
      }
      if (e.key === 'f' || e.key === 'F') {
        handleFullscreen();
      }
      if (e.key === 't' || e.key === 'T') {
        setIsTheaterMode(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !currentVideo) return null;

  const videoSrc = getImageUrl(currentVideo.fileUrl);

  const formatTime = (secs) => {
    if (!secs || isNaN(secs) || secs < 0) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      triggerPlayFlash('pause');
    } else {
      videoRef.current.play().catch(err => console.warn('Play prevented:', err));
      triggerPlayFlash('play');
    }
  };

  const handleSeek = (e) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current && !isNaN(time)) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleSpeedChange = (speed) => {
    setPlaybackRate(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  const handleVolumeChange = (newVol) => {
    setVolume(newVol);
    if (videoRef.current) {
      videoRef.current.volume = newVol;
    }
    if (newVol === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
  };

  const handleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen().catch(() => { });
    } else {
      document.exitFullscreen().catch(() => { });
    }
  };

  const handleEnded = () => {
    if (currentIndex < playlist.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setTimeout(() => {
        if (videoRef.current) videoRef.current.play().catch(() => { });
      }, 350);
    } else {
      setIsPlaying(false);
    }
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = videoSrc;
    a.download = `recording-${currentVideo.employee?.fullName || 'employee'}-${(currentVideo.id || 'vid').slice(0, 8)}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const chunkDate = new Date(currentVideo.createdAt);
  const formattedDate = chunkDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  const formattedTime = chunkDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const employeeName = currentVideo.employee?.fullName || currentVideo.employee?.name || 'Employee';
  const employeeInitial = employeeName.charAt(0).toUpperCase();
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[150] flex items-center justify-center bg-black/85 backdrop-blur-xl p-2 sm:p-4 md:p-6 animate-fade-in"
    >
      <div
        ref={containerRef}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "bg-[#1A1F18] border border-[#384232] rounded-[1.75rem] shadow-2xl flex flex-col relative overflow-hidden transition-all duration-300 animate-scale-in",
          isTheaterMode
            ? "w-[98vw] max-w-[1700px] h-[95vh]"
            : "w-full max-w-6xl xl:max-w-7xl max-h-[92vh]"
        )}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 bg-[#141812] border-b border-[#384232] z-20">
          <div className="flex items-center gap-3 min-w-0">
            {/* Live Screen Recording Badge */}
            <div className="flex items-center gap-2 bg-[#A84B4B]/15 border border-[#A84B4B]/30 px-3 py-1 rounded-xl text-[#E58B8B] text-xs font-bold uppercase tracking-wider shrink-0">
              <span className="h-2 w-2 rounded-full bg-[#A84B4B] animate-pulse" />
              <span>Screen Recording</span>
            </div>

            <div className="h-5 w-[1px] bg-[#384232] shrink-0 hidden sm:block" />

            {/* Employee Profile */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-8 w-8 rounded-xl bg-[#B9955B]/20 border border-[#B9955B]/30 text-[#D3B98D] font-bold text-xs flex items-center justify-center shrink-0">
                {employeeInitial}
              </div>
              <div className="min-w-0">
                <span className="text-[#F5F1E9] text-xs sm:text-sm font-bold block truncate leading-tight">
                  {employeeName}
                </span>
                <span className="text-[#B8B3A7] text-[10px] sm:text-[11px] block truncate leading-tight">
                  {formattedDate} at {formattedTime}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* File Size */}
            <span className="text-xs font-semibold text-[#B8B3A7] bg-[#252B20] px-2.5 py-1 rounded-lg border border-[#384232] hidden sm:inline-block">
              {currentVideo.sizeMb ? `${currentVideo.sizeMb} MB` : 'Chunk'}
            </span>

            {/* Playlist Chunk Counter */}
            {playlist.length > 1 && (
              <span className="text-xs font-bold text-[#D3B98D] bg-[#30382B] px-2.5 py-1 rounded-lg border border-[#B9955B]/40">
                Chunk {currentIndex + 1} of {playlist.length}
              </span>
            )}

            {/* Theater Mode Toggle */}
            <button
              onClick={() => setIsTheaterMode(!isTheaterMode)}
              className="h-9 w-9 bg-[#252B20] hover:bg-[#30382B] text-[#B8B3A7] hover:text-[#F5F1E9] rounded-xl border border-[#384232] flex items-center justify-center transition cursor-pointer"
              title={isTheaterMode ? "Default View (T)" : "Theater Mode (T)"}
            >
              {isTheaterMode ? <Minimize2 size={16} /> : <Maximize size={16} />}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="h-9 w-9 bg-[#252B20] hover:bg-[#A84B4B]/20 text-[#B8B3A7] hover:text-white rounded-xl border border-[#384232] hover:border-[#A84B4B]/40 flex items-center justify-center transition cursor-pointer active:scale-95"
              title="Close (Esc)"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Video Canvas Area */}
        <div
          onClick={togglePlay}
          className="relative flex-1 min-h-[360px] bg-black flex items-center justify-center overflow-hidden group select-none cursor-pointer"
        >
          <video
            ref={videoRef}
            src={videoSrc}
            playsInline
            muted={isMuted}
            className="w-full h-full max-h-[74vh] object-contain"
            onTimeUpdate={() => {
              if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
            }}
            onLoadedMetadata={() => {
              if (videoRef.current) setDuration(videoRef.current.duration);
              setIsBuffering(false);
            }}
            onWaiting={() => setIsBuffering(true)}
            onCanPlay={() => setIsBuffering(false)}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={handleEnded}
            onError={() => {
              setHasError(true);
              setIsBuffering(false);
            }}
          />

          {/* Buffering Spinner */}
          {isBuffering && !hasError && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 pointer-events-none z-10">
              <div className="h-12 w-12 border-2 border-[#B9955B]/20 border-t-[#B9955B] rounded-full animate-spin" />
            </div>
          )}

          {/* Quick Play/Pause Flash Animation (Disappears after 500ms so screen is crystal clear when paused) */}
          {playActionFlash && !isBuffering && !hasError && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div className="h-16 w-16 rounded-full bg-black/60 backdrop-blur-md border border-[#B9955B]/40 text-[#D3B98D] flex items-center justify-center shadow-2xl animate-out fade-out zoom-out duration-500">
                {playActionFlash === 'play' ? <Play size={28} className="translate-x-0.5" /> : <Pause size={28} />}
              </div>
            </div>
          )}

          {/* Unobtrusive Paused Pill (Bottom Corner, doesn't block screen content!) */}
          {!isPlaying && !isBuffering && !hasError && (
            <div className="absolute bottom-4 left-4 z-10 bg-black/75 backdrop-blur-md border border-[#384232] text-[#D3B98D] px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 pointer-events-none opacity-80 group-hover:opacity-100 transition-opacity">
              <Pause size={14} />
              <span>Paused · Click screen or Space to play</span>
            </div>
          )}

          {/* Error Message */}
          {hasError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 p-4 text-center z-20">
              <AlertCircle size={40} className="text-[#A84B4B] mb-2 animate-bounce" />
              <p className="text-[#F5F1E9] font-bold text-sm mb-1">Failed to load video recording chunk</p>
              <p className="text-[#B8B3A7] text-xs mb-4">The file may be processing or inaccessible.</p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setHasError(false);
                  setIsBuffering(true);
                  if (videoRef.current) {
                    videoRef.current.load();
                    videoRef.current.play().catch(() => { });
                  }
                }}
                className="px-4 py-1.5 bg-[#B9955B] hover:bg-[#A17D45] text-white rounded-xl text-xs font-bold transition shadow-warm-xs cursor-pointer"
              >
                Retry Playback
              </button>
            </div>
          )}
        </div>

        {/* Multi-Chunk Session Timeline (if multiple chunks) */}
        {playlist.length > 1 && (
          <div className="bg-[#141812] px-5 py-2.5 border-t border-[#384232] flex items-center gap-2 overflow-x-auto scrollbar-thin z-20">
            <span className="text-[10px] font-bold text-[#B8B3A7] uppercase tracking-wider shrink-0 flex items-center gap-1.5">
              <Video size={13} className="text-[#B9955B]" /> Session Chunks:
            </span>
            {playlist.map((c, idx) => (
              <button
                key={c.id || idx}
                onClick={() => setCurrentIndex(idx)}
                className={cn(
                  "px-3 py-1 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 shrink-0 cursor-pointer",
                  idx === currentIndex
                    ? "bg-[#30382B] text-[#D3B98D] border border-[#B9955B]/60 shadow-warm-xs"
                    : "bg-[#252B20] text-[#B8B3A7] hover:bg-[#2C3426] border border-[#384232]"
                )}
              >
                <span className={cn("w-1.5 h-1.5 rounded-full", idx === currentIndex ? "bg-[#B9955B]" : "bg-[#777367]")} />
                <span>Chunk {idx + 1}</span>
                <span className="text-[10px] opacity-70">
                  {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Bottom Media Controls Bar */}
        <div className="bg-[#141812] px-5 py-3.5 sm:py-4 border-t border-[#384232] space-y-3 z-20">
          {/* Progress / Scrubbing Bar */}
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-bold text-[#D3B98D] min-w-[42px] tabular-nums select-none">
              {formatTime(currentTime)}
            </span>

            {/* Custom Interactive Scrub Track */}
            <div className="relative flex-1 flex items-center group/scrub h-4 cursor-pointer">
              <div className="w-full h-1.5 bg-[#252B20] rounded-full overflow-hidden border border-[#384232]/60 relative">
                <div
                  className="h-full bg-gradient-to-r from-[#B9955B] to-[#D3B98D] rounded-full transition-all duration-75"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <input
                type="range"
                min="0"
                max={duration || 100}
                step="0.1"
                value={currentTime}
                onChange={handleSeek}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>

            <span className="font-mono text-xs font-semibold text-[#B8B3A7] min-w-[42px] tabular-nums text-right select-none">
              {formatTime(duration)}
            </span>
          </div>

          {/* Control Buttons Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            {/* Left Controls: Skip back, -10s, Play/Pause, +10s, Skip next, Volume */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Prev Chunk */}
              <button
                onClick={() => { if (currentIndex > 0) setCurrentIndex(prev => prev - 1); }}
                disabled={currentIndex === 0}
                className="p-2 text-[#B8B3A7] hover:text-[#F5F1E9] disabled:opacity-30 disabled:hover:text-[#B8B3A7] transition cursor-pointer"
                title="Previous Chunk"
              >
                <SkipBack size={17} />
              </button>

              {/* -10s */}
              <button
                onClick={() => {
                  if (videoRef.current) videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
                }}
                className="p-2 text-[#B8B3A7] hover:text-[#D3B98D] transition cursor-pointer"
                title="Rewind 10s (←)"
              >
                <RotateCcw size={17} />
              </button>

              {/* Main Play / Pause Button */}
              <button
                onClick={togglePlay}
                className="h-10 w-10 bg-[#B9955B] hover:bg-[#A17D45] text-white rounded-xl flex items-center justify-center transition shadow-warm-xs cursor-pointer active:scale-95"
                title={isPlaying ? "Pause (Space)" : "Play (Space)"}
              >
                {isPlaying ? <Pause size={18} /> : <Play size={18} className="translate-x-0.5" />}
              </button>

              {/* +10s */}
              <button
                onClick={() => {
                  if (videoRef.current) videoRef.current.currentTime = Math.min(duration || 0, videoRef.current.currentTime + 10);
                }}
                className="p-2 text-[#B8B3A7] hover:text-[#D3B98D] transition cursor-pointer"
                title="Forward 10s (→)"
              >
                <RotateCw size={17} />
              </button>

              {/* Next Chunk */}
              <button
                onClick={() => { if (currentIndex < playlist.length - 1) setCurrentIndex(prev => prev + 1); }}
                disabled={currentIndex === playlist.length - 1}
                className="p-2 text-[#B8B3A7] hover:text-[#F5F1E9] disabled:opacity-30 disabled:hover:text-[#B8B3A7] transition cursor-pointer"
                title="Next Chunk"
              >
                <SkipForward size={17} />
              </button>

              {/* Volume Control with hover slider */}
              <div className="flex items-center gap-1.5 group/vol ml-1 sm:ml-2">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-2 text-[#B8B3A7] hover:text-[#F5F1E9] transition cursor-pointer"
                  title={isMuted ? "Unmute (M)" : "Mute (M)"}
                >
                  {isMuted || volume === 0 ? <VolumeX size={17} /> : <Volume2 size={17} />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="w-16 h-1 bg-[#252B20] accent-[#B9955B] rounded-lg appearance-none cursor-pointer opacity-0 group-hover/vol:opacity-100 transition-opacity"
                  title="Volume"
                />
              </div>
            </div>

            {/* Middle Controls: Speed Selector */}
            <div className="flex items-center gap-1 bg-[#252B20] p-1 rounded-xl border border-[#384232]">
              {[0.5, 1, 1.25, 1.5, 2].map(speed => (
                <button
                  key={speed}
                  onClick={() => handleSpeedChange(speed)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                    playbackRate === speed
                      ? "bg-[#30382B] text-[#D3B98D] border border-[#B9955B]/40 font-bold shadow-xs"
                      : "text-[#B8B3A7] hover:text-[#F5F1E9]"
                  )}
                >
                  {speed}x
                </button>
              ))}
            </div>

            {/* Right Controls: Download, Delete, Fullscreen */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownload}
                className="p-2 text-[#B8B3A7] hover:text-[#F5F1E9] bg-[#252B20] hover:bg-[#30382B] border border-[#384232] rounded-xl transition cursor-pointer"
                title="Download Recording (.webm)"
              >
                <Download size={17} />
              </button>

              {canDelete && (
                <button
                  onClick={() => {
                    if (window.confirm("Are you sure you want to delete this video recording?")) {
                      onDeleteVideo(currentVideo.id);
                    }
                  }}
                  className="p-2 text-[#E58B8B] hover:text-white bg-[#A84B4B]/15 hover:bg-[#A84B4B]/30 border border-[#A84B4B]/30 rounded-xl transition cursor-pointer"
                  title="Delete Recording"
                >
                  <Trash2 size={17} />
                </button>
              )}

              <button
                onClick={handleFullscreen}
                className="p-2 text-[#B8B3A7] hover:text-[#F5F1E9] bg-[#252B20] hover:bg-[#30382B] border border-[#384232] rounded-xl transition cursor-pointer"
                title="Fullscreen (F)"
              >
                <Maximize size={17} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

VideoPlaybackModal.displayName = 'VideoPlaybackModal';

// --- Components ---
const FilterButton = memo(({ active, label, icon: Icon, onClick }) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border",
      active
        ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-md transform scale-105"
        : "bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
    )}
  >
    {Icon && <Icon size={14} />}
    {label}
  </button>
));

FilterButton.displayName = 'FilterButton';

const ToggleSwitch = memo(({ label, enabled, onChange }) => (
  <div className="flex items-center justify-between w-full bg-white dark:bg-slate-900 p-3 sm:p-2 sm:pr-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm min-h-[44px]">
    <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">{label}</span>
    <button
      onClick={() => onChange(!enabled)}
      className={cn(
        "relative h-6 w-10 flex-shrink-0 rounded-full transition-colors duration-300 focus:outline-none",
        enabled ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-700"
      )}
    >
      <span
        className={cn(
          "block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-300",
          enabled ? "translate-x-5" : "translate-x-1"
        )}
      />
    </button>
  </div>
));

ToggleSwitch.displayName = 'ToggleSwitch';

// Keep static utility lists for filter labels only
const appsList = [
  { id: 1, name: "Chrome" },
  { id: 2, name: "VS Code" },
  { id: 3, name: "Figma" },
  { id: 4, name: "Slack" },
  { id: 5, name: "Excel" }
];

const tasksList = [
  { id: 1, name: "Development" },
  { id: 2, name: "Meeting" },
  { id: 3, name: "Design" },
  { id: 4, name: "Documentation" }
];

const screenshotTypesList = [
  { id: 1, name: "Automatic" },
  { id: 2, name: "Manual" }
];

const productivityTypesList = [
  { id: 1, name: "Productive" },
  { id: 2, name: "Neutral" },
  { id: 3, name: "Unproductive" }
];

const categoryList = [
  { id: 1, name: "Work" },
  { id: 2, name: "Break" },
  { id: 3, name: "Personal" }
];

const getAppIcon = (appName) => {
  const lower = (appName || '').toLowerCase();
  if (lower.includes('figma') || lower.includes('sketch')) return '🎨';
  if (lower.includes('code') || lower.includes('studio') || lower.includes('terminal')) return '💻';
  if (lower.includes('slack') || lower.includes('chat') || lower.includes('teams')) return '💬';
  if (lower.includes('sheet') || lower.includes('excel')) return '📊';
  if (lower.includes('doc') || lower.includes('word') || lower.includes('notion')) return '📝';
  if (lower.includes('facebook') || lower.includes('steam') || lower.includes('youtube')) return '🌐';
  return '🖥️';
};

const ScreenshotCard = memo(({ id, employeeId, employee, timestamp, image, isBlurred, app, productivity, onDelete, viewMode, onDownload, globalBlur, onView, onViewLive, project, task, team, category, type, onBlurToggle, isSelectionMode, isSelected, onToggleSelection }) => {
  const [localBlur, setLocalBlur] = useState(isBlurred);
  const effectiveBlur = globalBlur || localBlur;
  const dateObj = new Date(timestamp);
  const time = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateStr = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });

  const handleView = useCallback(() => {
    onView({ id, time, url: image, isBlurred, employee, localBlur, effectiveBlur, app, productivity });
  }, [onView, id, time, image, isBlurred, employee, localBlur, effectiveBlur, app, productivity]);

  const handleBlurToggle = useCallback(async (e) => {
    e.stopPropagation();
    setLocalBlur(prev => !prev);
    // Persist blur state to backend
    if (onBlurToggle) onBlurToggle(id);
  }, [id, onBlurToggle]);

  const handleDownloadClick = useCallback((e) => {
    e.stopPropagation();
    onDownload(image);
  }, [onDownload, image]);

  const handleLiveClick = useCallback((e) => {
    e.stopPropagation();
    // Trigger playback mode in parent
    if (onViewLive) onViewLive({ id: employeeId, name: employee, timestamp });
  }, [onViewLive, employeeId, employee, timestamp]);

  const handleDeleteClick = useCallback((e) => {
    e.stopPropagation();
    onDelete(id);
  }, [onDelete, id]);

  if (viewMode === 'list') {
    return (
      <div
        className={cn(
          "group flex items-center bg-[#FBF9F5] dark:bg-[#252B20] rounded-xl sm:rounded-2xl border p-3 hover:shadow-warm-xs transition-all duration-200 cursor-pointer",
          isSelected ? "border-primary-500 bg-primary-50/30 dark:bg-primary-500/5 shadow-md shadow-primary-500/10" : "border-slate-200 dark:border-slate-800"
        )}
        onClick={isSelectionMode ? () => onToggleSelection(id) : handleView}
      >
        {isSelectionMode && (
          <div className="mr-3 flex-shrink-0">
            <div className={cn(
              "h-5 w-5 rounded-md border-2 flex items-center justify-center transition-all",
              isSelected ? "bg-primary-600 border-primary-600" : "border-slate-300 dark:border-slate-600 bg-transparent"
            )}>
              {isSelected && <Check size={14} className="text-white" strokeWidth={4} />}
            </div>
          </div>
        )}
        <div className="relative h-16 aspect-video rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-800 mr-4 border border-slate-100 dark:border-slate-700 flex-shrink-0">
          <img
            src={getImageUrl(image)}
            alt={time}
            loading="lazy"
            className={cn("h-full w-full object-cover transition-all", effectiveBlur && "blur-md scale-110")}
          />
          {effectiveBlur && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Shield size={10} className="text-white" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0 grid grid-cols-2 md:grid-cols-4 gap-4 items-center">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <div className="h-5 w-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[8px] font-bold text-slate-500 dark:text-slate-400">
                {employee ? employee.charAt(0) : 'A'}
              </div>
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate">{employee}</h4>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-black text-slate-400 bg-slate-50 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-100 dark:border-slate-700">{time}</span>
              <span className="text-[10px] font-bold text-slate-400">{dateStr}</span>
            </div>
          </div>
          <div>
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 block">{app}</span>
          </div>
          <div>
            <span className={cn(
              "text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider",
              productivity === 'productive' ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' :
                productivity === 'unproductive' ? 'bg-rose-100 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400' :
                  'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400'
            )}>
              {productivity}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity px-1 sm:px-2" onClick={e => e.stopPropagation()}>
          <button onClick={handleBlurToggle} className="p-2 sm:p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
            {localBlur ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>
          <button onClick={handleLiveClick} className="p-2 sm:p-2 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg text-rose-400 hover:text-rose-500 transition-colors">
            <Video size={16} />
          </button>
          <button onClick={handleDownloadClick} className="p-2 sm:p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
            <Download size={16} />
          </button>
          {onDelete && (
            <>
              <div className="hidden sm:block h-4 w-[1px] bg-slate-100 dark:bg-slate-800 mx-1" />
              <button onClick={handleDeleteClick} className="p-2 sm:p-2 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg text-slate-400 hover:text-rose-500 transition-colors">
                <Trash2 size={16} />
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  const isProd = productivity?.toLowerCase() === 'productive';
  const isUnprod = productivity?.toLowerCase() === 'unproductive' || productivity?.toLowerCase() === 'idle';

  const borderClass = isSelected
    ? "border-primary-500 ring-2 ring-primary-500/20"
    : isProd
      ? "border-2 border-emerald-500/80 shadow-md shadow-emerald-500/5 hover:border-emerald-600"
      : isUnprod
        ? "border-2 border-rose-500/80 shadow-md shadow-rose-500/5 hover:border-rose-600"
        : "border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700";

  return (
    <div
      className={cn(
        "group relative bg-[#FBF9F5] dark:bg-[#252B20] rounded-xl sm:rounded-2xl shadow-warm-xs hover:shadow-warm-sm transition-all duration-200 hover:-translate-y-0.5 overflow-hidden cursor-pointer",
        isSelected ? "border-primary-500 ring-2 ring-primary-500/20" : "",
        borderClass
      )}
      onClick={isSelectionMode ? () => onToggleSelection(id) : handleView}
    >
      {isSelectionMode && (
        <div className="absolute top-3 left-3 z-[45] animate-in zoom-in duration-200">
          <div className={cn(
            "h-6 w-6 rounded-lg border-2 flex items-center justify-center shadow-lg transition-all",
            isSelected ? "bg-primary-600 border-primary-600" : "bg-white/20 border-white/40 backdrop-blur-md"
          )}>
            {isSelected && <Check size={16} className="text-white" strokeWidth={4} />}
          </div>
        </div>
      )}

      {/* ── Top Header: App Name + Icon + 3-dots Menu (Insightful Image 3) ── */}
      <div className="p-2.5 px-3 flex items-center justify-between border-b border-[#E5DED2]/80 dark:border-[#384232]/80 bg-[#EEE8DD]/40 dark:bg-[#1E2419]/60">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm select-none">{getAppIcon(app || 'Desktop')}</span>
          <span className="text-xs font-black text-slate-800 dark:text-slate-200 truncate">
            {app || 'Desktop Activity'}
          </span>
        </div>
        <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
          <span className={cn(
            "text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider",
            isProd ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400" :
              isUnprod ? "bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400" :
                "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
          )}>
            {productivity}
          </span>
          {onDelete && (
            <button
              onClick={handleDeleteClick}
              className="p-1 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded text-slate-400 hover:text-rose-500 transition-colors"
              title="Delete Screenshot"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      <div className="relative aspect-video w-full overflow-hidden bg-slate-50 dark:bg-slate-800">
        <img
          src={getImageUrl(image)}
          alt={`Screenshot at ${time}`}
          loading="lazy"
          className={cn(
            "h-full w-full object-cover transition-all duration-700",
            effectiveBlur ? "blur-xl scale-110 opacity-80" : "group-hover:scale-105"
          )}
        />
        {effectiveBlur && (
          <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/80 dark:bg-white/90 backdrop-blur-md rounded-full text-white dark:text-slate-900 shadow-lg">
              <Shield size={12} className="text-emerald-400" />
              <span className="text-[10px] font-black uppercase tracking-widest">Privacy Blur</span>
            </div>
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3 sm:p-4">
          <div className="flex items-center justify-between translate-y-0 sm:translate-y-4 sm:group-hover:translate-y-0 transition-transform duration-300" onClick={e => e.stopPropagation()}>
            <div className="flex gap-2">
              <button
                onClick={handleLiveClick}
                className="h-9 w-9 sm:h-8 sm:w-8 flex items-center justify-center rounded-lg bg-rose-500 hover:bg-rose-600 text-white backdrop-blur-sm transition-colors"
                title="View Live"
              >
                <Video size={16} />
              </button>
              <button
                onClick={handleBlurToggle}
                className="h-9 w-9 sm:h-8 sm:w-8 flex items-center justify-center rounded-lg bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm transition-colors"
                title={localBlur ? "Reveal" : "Blur"}
              >
                {localBlur ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
              <button
                onClick={handleDownloadClick}
                className="h-9 w-9 sm:h-8 sm:w-8 flex items-center justify-center rounded-lg bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm transition-colors"
                title="Download"
              >
                <Download size={16} />
              </button>
            </div>
            {onDelete && (
              <button
                onClick={handleDeleteClick}
                className="h-9 w-9 sm:h-8 sm:w-8 flex items-center justify-center rounded-lg bg-red-500/80 hover:bg-red-500 text-white backdrop-blur-sm transition-colors"
                title="Delete"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
      {/* ── Bottom Footer: Time, Project, Employee, Department (Insightful Image 3) ── */}
      <div className="p-2.5 px-3 bg-[#FBF9F5] dark:bg-[#252B20] border-t border-[#E5DED2]/80 dark:border-[#384232]/80 text-[11px] flex flex-col gap-1">
        <div className="flex items-center justify-between text-slate-400 dark:text-slate-500 font-bold">
          <span className="flex items-center gap-1">
            <Clock size={11} /> {time}
          </span>
          <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400 truncate max-w-[130px]">
            <Briefcase size={11} /> {project || task || 'Design System'}
          </span>
        </div>
        <div className="flex items-center justify-between pt-1 border-t border-slate-50 dark:border-slate-800/50">
          <span className="font-black text-slate-700 dark:text-slate-200 truncate max-w-[130px]">
            {employee || 'Unknown'}
          </span>
          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-100 dark:border-slate-700">
            {team || 'Designers'}
          </span>
        </div>
      </div>
    </div>
  );
});

            ScreenshotCard.displayName = 'ScreenshotCard';

            // --- Generic Selection Modal (Reusable for all filters) ---
            const GenericSelectionModal = memo(({
              isOpen,
              onClose,
              title,
              items,
              selectedIds,
              onSelectionChange,
              placeholder = "Search",
              emptyMessage = "No available item"
            }) => {
  const [searchQuery, setSearchQuery] = useState('');
            const [tempSelected, setTempSelected] = useState(selectedIds);

  const filteredItems = items.filter(item =>
            item.name.toLowerCase().includes(searchQuery.toLowerCase())
            );

  const handleSelectAll = () => {
              setTempSelected(items.map(i => i.id));
  };

  const handleRemoveAll = () => {
              setTempSelected([]);
  };

  const handleToggleItem = (itemId) => {
              setTempSelected(prev =>
                prev.includes(itemId)
                  ? prev.filter(id => id !== itemId)
                  : [...prev, itemId]
              );
  };

  const handleDone = () => {
              onSelectionChange(tempSelected);
            onClose();
  };

  const handleCancel = () => {
              setTempSelected(selectedIds);
            onClose();
  };

            if (!isOpen) return null;

            return (
            <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-900/50 dark:bg-black/60 backdrop-blur-sm animate-fade-in">
              <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-scale-in border border-slate-200 dark:border-slate-800">
                <div className="flex flex-col md:flex-row h-[500px]">
                  {/* Left Panel - Available Items */}
                  <div className="flex-1 border-r border-slate-200 dark:border-slate-800 flex flex-col">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-[#fcfdfe] dark:bg-slate-800/50">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">{title}</span>
                      </div>
                      <button
                        onClick={handleSelectAll}
                        className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                      >
                        Select all
                      </button>
                    </div>
                    <div className="p-3">
                      <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          placeholder={placeholder}
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-0 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500/10 dark:focus:ring-primary-500/20"
                        />
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2">
                      {filteredItems.length > 0 ? (
                        <div className="space-y-1">
                          {filteredItems.map(item => (
                            <button
                              key={item.id}
                              onClick={() => handleToggleItem(item.id)}
                              className={cn(
                                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left",
                                tempSelected.includes(item.id)
                                  ? "bg-primary-50 dark:bg-primary-500/10 border border-primary-200 dark:border-primary-500/20"
                                  : "hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent"
                              )}
                            >
                              <div className={cn(
                                "h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold",
                                tempSelected.includes(item.id)
                                  ? "bg-primary-600 dark:bg-primary-500 text-white"
                                  : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                              )}>
                                {item.name.charAt(0)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate">{item.name}</p>
                              </div>
                              {tempSelected.includes(item.id) && (
                                <Check size={16} className="text-primary-600 dark:text-primary-400 flex-shrink-0" />
                              )}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center p-4">
                          <div className="h-16 w-16 mb-3">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-slate-300 dark:text-slate-600">
                              <circle cx="12" cy="12" r="10" strokeWidth="1.5" />
                              <path d="M12 6v6l4 2" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                          </div>
                          <p className="text-sm font-bold text-slate-400 dark:text-slate-500">{emptyMessage}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Panel - Selected Items */}
                  <div className="flex-1 flex flex-col bg-[#fcfdfe] dark:bg-slate-800/30">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-slate-400 dark:text-slate-500" />
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">SELECTED</span>
                      </div>
                      <button
                        onClick={handleRemoveAll}
                        className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                      >
                        Remove all
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2">
                      {tempSelected.length > 0 ? (
                        <div className="space-y-1">
                          {items.filter(i => tempSelected.includes(i.id)).map(item => (
                            <button
                              key={item.id}
                              onClick={() => handleToggleItem(item.id)}
                              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all text-left bg-white dark:bg-slate-900 shadow-sm"
                            >
                              <div className="h-8 w-8 rounded-full bg-primary-600 dark:bg-primary-500 text-white flex items-center justify-center text-xs font-bold">
                                {item.name.charAt(0)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate">{item.name}</p>
                              </div>
                              <X size={16} className="text-slate-400 dark:text-slate-500 hover:text-rose-500 transition-colors flex-shrink-0" />
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center p-4">
                          <p className="text-sm font-bold text-slate-400 dark:text-slate-500">No available {title.toLowerCase()}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-[#fcfdfe] dark:bg-slate-800/50 flex justify-end gap-3">
                  <button
                    onClick={handleCancel}
                    className="px-6 py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDone}
                    className="px-6 py-2.5 bg-primary-600 dark:bg-primary-500 text-white rounded-xl text-sm font-bold hover:bg-primary-700 dark:hover:bg-primary-600 transition-all shadow-lg shadow-primary-600/20 dark:shadow-primary-500/20"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
            );
});

            GenericSelectionModal.displayName = 'GenericSelectionModal';

            const DeleteConfirmationModal = ({isOpen, onClose, onConfirm, isEmployee}) => {
  if (!isOpen) return null;
            return (
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm animate-fade-in">
              <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-scale-in border border-slate-200 dark:border-slate-800 p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-12 w-12 rounded-full bg-rose-100 dark:bg-rose-500/10 flex items-center justify-center text-rose-600">
                    <Trash2 size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">Delete Screenshot?</h3>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                      {isEmployee
                        ? "This will hide it from your view, but it may still be visible to admins."
                        : "This will permanently remove the screenshot from the database and disk."}
                    </p>
                  </div>
                </div>
                <div className="flex justify-end gap-3 translate-y-2">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={onConfirm}
                    className="px-6 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-rose-500/20 active:scale-95 transition-all"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
            );
};

            export function ScreenshotMonitoring() {
    const {user, role} = useAuthStore();
            const {socket, employees: contextEmployees, teams: contextTeams, projects: contextProjects, screenshots: contextScreenshots, deleteScreenshot, addNotification } = useRealTime();

            // Live Monitoring State
            const [viewingLiveEmployee, setViewingLiveEmployee] = useState(null);

            const handleStartPlayback = useCallback(({id, name, timestamp}) => {
              // 1. Set the employee filter
              setSelectedFilters(prev => ({
                ...prev,
                employees: [id]
              }));

            // 2. Set the date for that screenshot
            if (timestamp) {
              setTimelineDate(new Date(timestamp));
    }

            // 3. Start playing at the correct moment
            setIsPlaying(true);

    // Find the index of the clicked screenshot in the list
    if (timestamp && activePlaybackList.length > 0) {
        const targetTime = new Date(timestamp).getTime();
            // Find closest match or exact match
            let bestIndex = 0;
            let minDiff = Infinity;
        
        activePlaybackList.forEach((s, idx) => {
            const sTime = new Date(s.capturedAt || s.timestamp).getTime();
            const diff = Math.abs(sTime - targetTime);
            if (diff < minDiff) {
              minDiff = diff;
            bestIndex = idx;
            }
        });
            setPlaybackIndex(bestIndex);
    } else {
              setPlaybackIndex(0);
    }

            // Add notification
            if (addNotification) addNotification('Playback Started', `Reviewing activity for ${name}`, 'info');
  }, [addNotification]);
            const [backendScreenshots, setBackendScreenshots] = useState([]);
            const [videoRecordings, setVideoRecordings] = useState([]);
            const [loadingVideos, setLoadingVideos] = useState(false);
            const [activeMainTab, setActiveMainTab] = useState('screenshots'); // 'screenshots' | 'videos'
            const [videoEmployeeFilter, setVideoEmployeeFilter] = useState('All');
            const [videoDateFilter, setVideoDateFilter] = useState('');
            const [videoSearchQuery, setVideoSearchQuery] = useState('');
            const [activePlaybackVideo, setActivePlaybackVideo] = useState(null);
            const [activeVideoPlaylist, setActiveVideoPlaylist] = useState([]);
            const [activeVideoIndex, setActiveVideoIndex] = useState(0);
            const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

    const fetchVideos = useCallback(async () => {
        try {
              setLoadingVideos(true);
            const params = {limit: 100 };
            if (videoEmployeeFilter && videoEmployeeFilter !== 'All') {
              params.employeeId = videoEmployeeFilter;
            }
            if (videoDateFilter) {
              params.date = videoDateFilter;
            }
            const res = await videoService.getVideos(params);
            if (res.success && res.data) {
              setVideoRecordings(Array.isArray(res.data) ? res.data : []);
            }
        } catch (err) {
              console.error('[ScreenshotMonitoring] Failed to fetch video recordings:', err);
        } finally {
              setLoadingVideos(false);
        }
    }, [videoEmployeeFilter, videoDateFilter]);

    useEffect(() => {
              fetchVideos();
    }, [fetchVideos]);

    // Listen for real-time video recordings added or deleted via socket
    useEffect(() => {
        if (!socket) return;
        const handleNewVideo = (newVid) => {
            setVideoRecordings(prev => {
                if (prev.some(v => v.id === newVid.id)) return prev;
                return [newVid, ...prev];
            });
        };
        const handleDeletedVideo = ({ id }) => {
            setVideoRecordings(prev => prev.filter(v => v.id !== id));
        };
        socket.on('video:new', handleNewVideo);
        socket.on('video:deleted', handleDeletedVideo);
        return () => {
            socket.off('video:new', handleNewVideo);
            socket.off('video:deleted', handleDeletedVideo);
        };
    }, [socket]);

    const handleOpenVideoPlayback = useCallback((video) => {
        const empChunks = videoRecordings
            .filter(v => v.employeeId === video.employeeId)
            .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        
        const playlist = empChunks.length > 0 ? empChunks : [video];
        const idx = playlist.findIndex(v => v.id === video.id);

            setActiveVideoPlaylist(playlist);
        setActiveVideoIndex(idx >= 0 ? idx : 0);
            setActivePlaybackVideo(video);
            setIsVideoModalOpen(true);
    }, [videoRecordings]);

    const handleDeleteVideo = useCallback(async (videoId) => {
        try {
            const res = await videoService.deleteVideo(videoId);
            if (res.success) {
              toast.success('Video recording deleted successfully');
                setVideoRecordings(prev => prev.filter(v => v.id !== videoId));
            if (isVideoModalOpen && activePlaybackVideo?.id === videoId) {
              setIsVideoModalOpen(false);
            setActivePlaybackVideo(null);
                }
            }
        } catch (err) {
              console.error('Failed to delete video:', err);
            toast.error(err.response?.data?.message || 'Failed to delete video');
        }
    }, [isVideoModalOpen, activePlaybackVideo]);

    // Global Screen Recording State & Handlers (Persists across all route changes)
    const { 
        isRecording: isRecordingVideo, 
        recordingSeconds, 
        isUploading: isUploadingVideo, 
        startRecording: globalStartRecording, 
        stopRecording: globalStopRecording 
    } = useScreenRecordingStore();

    const handleStartScreenRecording = () => {
        const targetEmpId = (videoEmployeeFilter && videoEmployeeFilter !== 'All') ? videoEmployeeFilter : null;
        globalStartRecording(targetEmpId);
    };

    const handleStopScreenRecording = () => {
        globalStopRecording();
    };

    // Auto-refresh videos gallery whenever a recording finishes saving
    useEffect(() => {
        const handleVideoSaved = () => {
            fetchVideos();
        };
        window.addEventListener('video-recording-saved', handleVideoSaved);
        return () => window.removeEventListener('video-recording-saved', handleVideoSaved);
    }, [fetchVideos]);

  // Sync context screenshots (newly arrived via socket) to local state
  useEffect(() => {
    if (contextScreenshots && contextScreenshots.length > 0) {
              setBackendScreenshots(prev => {
                const newOnes = contextScreenshots.filter(cs => !prev.some(ps => ps.id === cs.id));
                if (newOnes.length === 0) return prev;
                return [...newOnes, ...prev];
              });
    }
  }, [contextScreenshots]);
            const [loadingScreenshots, setLoadingScreenshots] = useState(true);
            const [isLoadingArchive, setIsLoadingArchive] = useState(false);
            const [page, setPage] = useState(0);
            const [hasMore, setHasMore] = useState(true);
            const limit = 20;


  // Derived employee list from real backend data
  const employeesList = useMemo(() =>
    contextEmployees.filter(e => !e.isSeed).map(e => ({id: e.id, name: e.name || e.fullName })),
            [contextEmployees]
            );

  // Derived teams list from real backend data
  const teamsList = useMemo(() =>
    contextTeams.filter(t => !t.isSeed).map(t => ({id: t.id, name: t.name })),
            [contextTeams]
            );

  // Derived projects list from real backend data
  const projectsList = useMemo(() =>
    contextProjects.map(p => ({id: p.id, name: p.name })),
            [contextProjects]
            );

            // State for new controls
            const [randomScreenshots, setRandomScreenshots] = useState(true);
            const [globalBlur, setGlobalBlur] = useState(false);
            const [frequency, setFrequency] = useState('10m');
            const [captureRule, setCaptureRule] = useState('All Apps');
            const [excludeSensitive, setExcludeSensitive] = useState(true);
            const [selectedEmployee, setSelectedEmployee] = useState('All');
            const [isLoadingSettings, setIsLoadingSettings] = useState(false);

  // Fetch Screenshot Settings
  const fetchSettings = useCallback(async () => {
    try {
      const res = await screenshotService.getSettings();
            if (res.success && res.data) {
              setRandomScreenshots(res.data.randomShifts);
            setExcludeSensitive(res.data.excludeAdmin);
            setGlobalBlur(res.data.globalBlur);
            setFrequency(`${res.data.frequency}m`);
      }
    } catch (err) {
              console.error('Failed to fetch settings:', err);
    }
  }, []);

  const updateSetting = async (key, value) => {
    try {
      // Map local state keys to backend schema keys
      const backendKeyMap = {
              randomScreenshots: 'randomShifts',
            excludeSensitive: 'excludeAdmin',
            globalBlur: 'globalBlur',
            frequency: 'frequency'
      };

            const backendKey = backendKeyMap[key] || key;
            let finalValue = value;
      
            // Handle frequency conversion (e.g., '10m' -> 10)
            if (key === 'frequency') {
              finalValue = parseInt(value) || 5;
      }

            await screenshotService.updateSettings({[backendKey]: finalValue });
            if (addNotification) addNotification('Success', 'Setting updated', 'success');
    } catch (err) {
              console.error('Failed to update setting:', err);
    }
  };

            // View & Filter State
            const [viewMode, setViewMode] = useState('grid');
            const [timelineDate, setTimelineDate] = useState(new Date());
            const [isAllHistory, setIsAllHistory] = useState(true); // Permanent retention: default to all history so screenshots from previous days are never hidden
            const [showCalendar, setShowCalendar] = useState(false);
            const [viewDate, setViewDate] = useState(new Date());
            const [isPlaying, setIsPlaying] = useState(false);
            const [playbackIndex, setPlaybackIndex] = useState(0);
            const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
            const [employeeSearchQuery, setEmployeeSearchQuery] = useState('');
            const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
            const [activeFilter, setActiveFilter] = useState('All');

            // UI states
            const [selectedPreset, setSelectedPreset] = useState('All Time');
            const [sortOrder, setSortOrder] = useState('newest');
            const [searchQuery, setSearchQuery] = useState('');

            // Calendar specific states
            const [showCalendarDropdown, setShowCalendarDropdown] = useState(false);
            const calendarRef = useRef(null);

            // Loading state for fetching data
            const [isDataFetching, setIsDataFetching] = useState(false);

  const isToday = useMemo(() => {
    const today = new Date();
            return timelineDate.getDate() === today.getDate() &&
            timelineDate.getMonth() === today.getMonth() &&
            timelineDate.getFullYear() === today.getFullYear();
  }, [timelineDate]);

            // Add Filter specific states
            const [showAddFilterDropdown, setShowAddFilterDropdown] = useState(false);
            const filterRef = useRef(null);

            // Generic Filter Modal State
            const [activeFilterModal, setActiveFilterModal] = useState(null); // 'employees', 'teams', 'projects', etc.

            // Selected Filters State (Stores IDs)
            const [selectedFilters, setSelectedFilters] = useState({
              employees: [],
            teams: [],
            projects: [],
            apps: [],
            tasks: [],
            screenshotTypes: [],
            productivityTypes: [],
            category: []
  });

  // Unified fetcher for both live and historical screenshots
  const fetchScreenshots = useCallback(async (pageNum = 0, isPolling = false) => {
    if (!isPolling) setLoadingScreenshots(true);
    try {
      const params = {
        limit,
        offset: pageNum * limit
      };
      if (!isAllHistory) {
        params.date = timelineDate.toLocaleDateString('en-CA'); // Reliable YYYY-MM-DD
      }

      // If specific employees are filtered, pass the first one (backend currently supports single employeeId in query)
      if (selectedFilters.employees.length > 0) {
        params.employeeId = selectedFilters.employees[0];
      }

      // Add productivity filter for "Idle" quick filter
      if (activeFilter === 'Idle') {
        params.productivity = 'UNPRODUCTIVE';
      }

      const res = await screenshotService.getScreenshots(params);
      if (res.success && res.data) {
        if (res.data.length < limit) {
          setHasMore(false);
        } else {
          setHasMore(true);
        }
        
        setBackendScreenshots(prev => {
          if (pageNum === 0) {
             // For page 0, we want to reconcile new records without losing existing ones if polling
             const newOnes = res.data.filter(rd => !prev.some(p => p.id === rd.id));
            // If date changed, we should probably just return res.data, but this logic is mostly for polling
            return isPolling ? [...newOnes, ...prev] : res.data;
          }
            return [...prev, ...res.data];
        });
      }
    } catch (err) {
      console.error('Failed to fetch screenshots:', err);
    } finally {
      if (!isPolling) setLoadingScreenshots(false);
    }
  }, [limit, timelineDate, isAllHistory, selectedFilters, activeFilter]); // Correctly depend on filters and quick filters

  // Handle date or filter changes
  useEffect(() => {
    setPage(0);
    fetchScreenshots(0);
  }, [timelineDate, isAllHistory, selectedFilters.employees, activeFilter]);

  useEffect(() => {
              fetchSettings();
    // Periodic refresh for live updates
    const interval = setInterval(() => fetchScreenshots(0, true), 30000);
    return () => clearInterval(interval);
  }, [fetchScreenshots, fetchSettings]);


            // Deletion Modal State
            const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
            const [screenshotToDelete, setScreenshotToDelete] = useState(null);

            // Selection Mode State
            const [isSelectionMode, setIsSelectionMode] = useState(false);
            const [selectedIds, setSelectedIds] = useState([]);
            const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const toggleSelectionMode = () => {
              setIsSelectionMode(!isSelectionMode);
            setSelectedIds([]);
  };

  const onToggleSelection = (id) => {
              setSelectedIds(prev =>
                prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
              );
  };

  const handleSelectAllScreenshots = () => {
              setSelectedIds(filteredScreenshots.map(s => s.id));
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
            if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} screenshots?`)) return;

            setIsBulkDeleting(true);
            try {
      const res = await screenshotService.bulkDelete(selectedIds);
            if (res.success) {
              setBackendScreenshots(prev => prev.filter(s => !selectedIds.includes(s.id)));
            setSelectedIds([]);
            setIsSelectionMode(false);
            if (addNotification) addNotification('Success', `${res.message}`, 'success');
      }
    } catch (err) {
              console.error('Bulk delete failed:', err);
            if (addNotification) addNotification('Error', 'Bulk delete failed', 'error');
    } finally {
              setIsBulkDeleting(false);
    }
  };

  // Outside click handlers
  useEffect(() => {
              function handleClickOutside(event) {
                if (calendarRef.current && !calendarRef.current.contains(event.target)) {
                  setShowCalendarDropdown(false);
                }
                if (filterRef.current && !filterRef.current.contains(event.target)) {
                  setShowAddFilterDropdown(false);
                }
              }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

            const [showAddFilter, setShowAddFilter] = useState(false);
            const [selectedFilterCategory, setSelectedFilterCategory] = useState(null);
            const [selectedFilterValue, setSelectedFilterValue] = useState('');

  // Use backend screenshots as the primary source
  const localScreenshots = useMemo(() => {
              let filtered = backendScreenshots;

    // Only show real screenshots from DB/uploads/Cloudinary/blobs (no mock picsum data)
    filtered = filtered.filter(s =>
      s.imageUrl &&
      !s.imageUrl.includes('picsum.photos') &&
      (
        s.imageUrl.startsWith('/uploads') ||
        s.imageUrl.startsWith('blob:') ||
        s.imageUrl.startsWith('data:image/') ||
        s.imageUrl.startsWith('https://') ||
        s.imageUrl.startsWith('http://')
      )
    );

    return filtered.map(s => ({
              ...s,
              id: s.id,
            employee: s.employee?.fullName || s.employee || 'Unknown',
            team: s.employee?.team?.name || 'General',
            image: s.imageUrl?.startsWith('/') ? `${API_BASE_URL.replace(/\/api\/?$/, '')}${s.imageUrl}` : s.imageUrl,
            timestamp: s.capturedAt || s.createdAt,
            time: new Date(s.capturedAt || s.createdAt).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit' }),
            productivity: (s.productivity || 'NEUTRAL').toLowerCase() === 'unproductive' ? 'idle' : (s.productivity || 'NEUTRAL').toLowerCase(),
            isBlurred: s.blurred || false,
            type: 'automatic',
    }));
  }, [backendScreenshots]);

  const setLocalScreenshots = () => { }; // No-op — we'll reload from backend

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchQuery(employeeSearchQuery), 300);
    return () => clearTimeout(timer);
  }, [employeeSearchQuery]);

            // Functional states for modals
            const [showRestrictedApps, setShowRestrictedApps] = useState(false);
            const [showCaptureRules, setShowCaptureRules] = useState(false);
            const [restrictedApps, setRestrictedApps] = useState(['Telegram', 'WhatsApp', 'Facebook', 'Steam']);
            const [newApp, setNewApp] = useState('');
            const [rules, setRules] = useState([
            {id: 1, name: 'Work Hours Only', enabled: true, desc: '9 AM - 6 PM' },
            {id: 2, name: 'Keypad Monitoring', enabled: false, desc: 'Capture on activity' },
            {id: 3, name: 'Idle Timeout', enabled: true, desc: 'Pause after 5m idle' },
            ]);

            // Detail View & Selection State
            const [selectedScreenshot, setSelectedScreenshot] = useState(null);

  // 2. Filter & Derived Logic (Optimized with useMemo)
  const uniqueEmployees = useMemo(() => ['All', ...new Set(localScreenshots.map(s => s.employee))], [localScreenshots]);

  const filteredVideoRecordings = useMemo(() => {
    return videoRecordings.filter(v => {
      if (videoSearchQuery) {
        const query = videoSearchQuery.toLowerCase();
            const empName = (v.employee?.fullName || '').toLowerCase();
            if (!empName.includes(query)) return false;
      }
            return true;
    });
  }, [videoRecordings, videoSearchQuery]);

  const filteredScreenshots = useMemo(() => {
              let result = localScreenshots.filter(s => {
      // Generic Filter Logic based on selectedFilters state
      if (selectedFilters.employees.length > 0 && !selectedFilters.employees.includes(s.employeeId)) return false;
      if (selectedFilters.teams.length > 0 && !selectedFilters.teams.some(tid => s.team?.toLowerCase().includes(contextTeams.find(t => t.id === tid)?.name.toLowerCase() || ''))) return false;
      if (selectedFilters.projects.length > 0 && !selectedFilters.projects.some(pid => s.project?.toLowerCase().includes(contextProjects.find(p => p.id === pid)?.name.toLowerCase() || ''))) return false;
      if (selectedFilters.apps.length > 0 && !selectedFilters.apps.some(aid => s.app?.toLowerCase().includes(appsList.find(a => a.id === aid)?.name.toLowerCase() || ''))) return false;
      if (selectedFilters.tasks.length > 0 && !selectedFilters.tasks.some(tid => s.task?.toLowerCase().includes(tasksList.find(t => t.id === tid)?.name.toLowerCase() || ''))) return false;
      if (selectedFilters.screenshotTypes.length > 0 && !selectedFilters.screenshotTypes.includes(s.type)) return false;
      if (selectedFilters.productivityTypes.length > 0 && !selectedFilters.productivityTypes.includes(s.productivity)) return false;
      if (selectedFilters.category.length > 0 && !selectedFilters.category.includes(s.category)) return false;

            // Note: Date filtering is now handled by the backend via timelineDate

            // Text search (Search bar)
            if (searchQuery) {
        const q = searchQuery.toLowerCase();
            const matches =
            s.employee?.toLowerCase().includes(q) ||
            s.app?.toLowerCase().includes(q) ||
            s.project?.toLowerCase().includes(q) ||
            s.task?.toLowerCase().includes(q);
            if (!matches) return false;
      }

            // Dropdown Filter Category
            if (selectedFilterCategory && selectedFilterValue) {
        const val = selectedFilterValue.toLowerCase();
            if (selectedFilterCategory === 'Employees' && !s.employee?.toLowerCase().includes(val)) return false;
            if (selectedFilterCategory === 'Teams' && !s.team?.toLowerCase().includes(val)) return false;
            if (selectedFilterCategory === 'Apps & Websites' && !s.app?.toLowerCase().includes(val)) return false;
            if (selectedFilterCategory === 'Projects' && !s.project?.toLowerCase().includes(val)) return false;
            if (selectedFilterCategory === 'Tasks' && !s.task?.toLowerCase().includes(val)) return false;
            if (selectedFilterCategory === 'Category' && !s.category?.toLowerCase().includes(val)) return false;
            if (selectedFilterCategory === 'Screenshot types' && !s.type?.toLowerCase().includes(val)) return false;
            if (selectedFilterCategory === 'Productivity types' && !s.productivity?.toLowerCase().includes(val)) return false;
      }

            // Quick Filters
            if (selectedEmployee !== 'All' && s.employee !== selectedEmployee) return false;
            if (activeFilter === 'Flagged' && !s.isBlurred) return false;
            if (activeFilter === 'Idle' && s.productivity !== 'idle') return false;
            if (excludeSensitive && s.employee === 'John Doe') return false;

            return true;
    });

    // Sorting
    return result.sort((a, b) => {
      const timeA = new Date(a.timestamp || a.date).getTime();
            const timeB = new Date(b.timestamp || b.date).getTime();
            return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
    });
  }, [localScreenshots, selectedEmployee, activeFilter, excludeSensitive, selectedPreset, sortOrder, searchQuery, selectedFilterCategory, selectedFilterValue, selectedFilters]);

            // Playback Logic
            const [playbackScreenshots, setPlaybackScreenshots] = useState([]);
            const [isLoadingPlayback, setIsLoadingPlayback] = useState(false);

  useEffect(() => {
              let refreshInterval;
            if (isPlaying && selectedFilters.employees.length === 1) {
        const fetchPlayback = async () => {
              setIsLoadingPlayback(true);
            try {
                const dateStr = timelineDate.toISOString().split('T')[0];
            const res = await screenshotService.getPlaybackScreenshots(selectedFilters.employees[0], dateStr);
            if (res.success) {
              setPlaybackScreenshots(res.data.map(s => ({
                ...s,
                id: s.id,
                employee: s.employee?.fullName || s.employee || 'Unknown',
                image: s.imageUrl?.startsWith('/') ? `${API_BASE_URL.replace(/\/api\/?$/, '')}${s.imageUrl}` : s.imageUrl,
                time: new Date(s.capturedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                timestamp: s.capturedAt,
                productivity: (s.productivity || 'NEUTRAL').toLowerCase(),
                isBlurred: s.blurred || false
              })));
                }
            } catch (err) {
              console.error('Failed to fetch playback screenshots:', err);
            } finally {
              setIsLoadingPlayback(false);
            }
        };

            fetchPlayback();
            // Refresh every 30 seconds for live feel
            refreshInterval = setInterval(fetchPlayback, 30000);
    } else if (!isPlaying) {
              setPlaybackScreenshots([]);
            if (refreshInterval) clearInterval(refreshInterval);
    }
    return () => {
        if (refreshInterval) clearInterval(refreshInterval);
    };
  }, [isPlaying, selectedFilters.employees, timelineDate]);

  const activePlaybackList = useMemo(() => {
    const list = playbackScreenshots.length > 0 ? playbackScreenshots : filteredScreenshots;
    // Always sort ASC for a natural forward video experience
    return [...list].sort((a, b) =>
            new Date(a.capturedAt || a.timestamp || a.date).getTime() - new Date(b.capturedAt || b.timestamp || b.date).getTime()
            );
  }, [playbackScreenshots, filteredScreenshots]);

  const progress = useMemo(() =>
    activePlaybackList.length > 0 ? ((playbackIndex + 1) / activePlaybackList.length) * 100 : 0
            , [playbackIndex, activePlaybackList]);

  const currentPlaybackTime = useMemo(() =>
            activePlaybackList[playbackIndex]?.time || "09:00 AM"
            , [playbackIndex, activePlaybackList]);

  useEffect(() => {
              let interval;
    if (isPlaying && activePlaybackList.length > 0) {
      // Auto-open modal on first play if not already open
      const currentItem = activePlaybackList[playbackIndex];
            if (currentItem) {
              setSelectedScreenshot({
                ...currentItem,
                effectiveBlur: globalBlur || currentItem.isBlurred
              });
      }

      interval = setInterval(() => {
              setPlaybackIndex((prev) => {
                const next = prev + 1;
                if (next >= activePlaybackList.length) {
                  // Stay at the end, but KEEP isPlaying = true so it waits for new screenshots
                  return prev;
                }
                // Update modal content for next item
                const nextItem = activePlaybackList[next];
                if (nextItem) {
                  setSelectedScreenshot({
                    ...nextItem,
                    effectiveBlur: globalBlur || nextItem.isBlurred
                  });
                }
                return next;
              });
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, activePlaybackList, globalBlur]);

  // 3. Optimized Handlers (useCallback)
  const handleCloseModal = useCallback(() => {
              setSelectedScreenshot(null);
            setIsPlaying(false);
  }, []);

  const handleNext = useCallback(() => {
    if (filteredScreenshots.length === 0) return;
            const nextIndex = (playbackIndex + 1) % filteredScreenshots.length;
            setPlaybackIndex(nextIndex);
            const nextItem = filteredScreenshots[nextIndex];
            setSelectedScreenshot({
              ...nextItem,
              effectiveBlur: globalBlur || nextItem.isBlurred
    });
  }, [filteredScreenshots, playbackIndex, globalBlur]);

  const handlePrev = useCallback(() => {
    if (filteredScreenshots.length === 0) return;
            const prevIndex = (playbackIndex - 1 + filteredScreenshots.length) % filteredScreenshots.length;
            setPlaybackIndex(prevIndex);
            const prevItem = filteredScreenshots[prevIndex];
            setSelectedScreenshot({
              ...prevItem,
              effectiveBlur: globalBlur || prevItem.isBlurred
    });
  }, [filteredScreenshots, playbackIndex, globalBlur]);

  const handleLoadArchive = useCallback(async () => {
    if (isLoadingArchive) return;
    setIsLoadingArchive(true);
    try {
      const nextPage = page + 1;
      await fetchScreenshots(nextPage);
      setPage(nextPage);
    } catch (err) {
      console.error('Failed to load archive screenshots:', err);
    } finally {
      setIsLoadingArchive(false);
    }
  }, [isLoadingArchive, page, fetchScreenshots]);

  const handleDelete = useCallback((id) => {
              setScreenshotToDelete(id);
            setIsDeleteModalOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!screenshotToDelete) return;
            try {
              await deleteScreenshot(screenshotToDelete);
        setBackendScreenshots(prev => prev.filter(s => s.id !== screenshotToDelete));
            setIsDeleteModalOpen(false);
            setScreenshotToDelete(null);
            if (addNotification) addNotification('Success', 'Screenshot deleted successfully', 'success');
    } catch (err) {
              console.error('Failed to delete screenshot:', err);
            if (addNotification) addNotification('Error', 'Failed to delete screenshot', 'error');
    }
  }, [deleteScreenshot, screenshotToDelete, addNotification]);

  const handleBlurToggleBackend = useCallback(async (id) => {
    try {
              await screenshotService.toggleBlur(id);
      // Update local state to reflect change
      setBackendScreenshots(prev => prev.map(s => s.id === id ? {...s, blurred: !s.blurred } : s));
    } catch (err) {
              console.error('Failed to toggle blur:', err);
    }
  }, []);

  const handleDownload = useCallback(async (url) => {
    if (!url) return;
            try {
      const baseUrl = API_BASE_URL.replace('/api', '');
            const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;

            const response = await fetch(fullUrl);
            if (!response.ok) throw new Error('Network response was not ok');

            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = url.split('/').pop() || 'screenshot.png';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);

            if (addNotification) addNotification('Downloading...', 'Your screenshot download has started.', 'info');
    } catch (err) {
              console.error('Download failed:', err);
            if (addNotification) addNotification('Error', 'Failed to download screenshot. Check your connection.', 'error');
    }
  }, [addNotification]);

  const handleViewScreenshot = useCallback((screenshot) => {
    const idx = activePlaybackList.findIndex(s => s.id === screenshot.id);
            if (idx !== -1) {
              setPlaybackIndex(idx);
    }
            setSelectedScreenshot({
              ...screenshot,
              effectiveBlur: globalBlur || screenshot.isBlurred
    });
            // Start auto-play from this moment as requested
            setIsPlaying(true);
  }, [activePlaybackList, globalBlur]);

  const handleDateSelect = useCallback((date) => {
    if (date > new Date()) return;
            setTimelineDate(new Date(date));
            setShowCalendar(false);
            setPlaybackIndex(0);
            setIsPlaying(false);
  }, []);

  const handleCaptureRealScreen = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({video: true });
            const video = document.createElement('video');
            video.srcObject = stream;
            video.play();
      
      await new Promise(resolve => {video.onplaying = resolve; });

            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      stream.getTracks().forEach(track => track.stop());

      canvas.toBlob(async (blob) => {
        if (!blob) return;
            const formData = new FormData();
            formData.append('image', blob, 'real-screenshot.png');
         
         const validEmployeeId = 
           (selectedFilters.employees.length > 0 && selectedFilters.employees[0]) ||
           user?.employeeId ||
           (employeesList.length > 0 ? employeesList[0].id : null) ||
           (contextEmployees.length > 0 ? contextEmployees[0].id : null);

         if (!validEmployeeId) {
           toast.error('No employee found to attach this screenshot to!');
           return;
         }

         formData.append('employeeId', validEmployeeId);
         formData.append('productivity', 'PRODUCTIVE');
         formData.append('blurred', 'false');

         const res = await screenshotService.uploadRealScreenshot(formData);
         if (res && res.success) {
           toast.success('Real screen captured and saved to database!');
           if (addNotification) addNotification('Success', 'Real screenshot saved!', 'success');
           fetchScreenshots(0);
         } else {
           toast.error(res?.message || 'Error saving screenshot.');
         }
      }, 'image/png');
    } catch (err) {
              console.error('Failed to capture screen:', err);
    }
  };





  const handleLoadMore = () => {
    const nextPage = page + 1;
            setPage(nextPage);
            fetchScreenshots(nextPage);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selectedScreenshot) return;
            if (e.key === 'ArrowRight') handleNext();
            if (e.key === 'ArrowLeft') handlePrev();
            if (e.key === 'Escape') handleCloseModal();
    };
            window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedScreenshot, handleNext, handlePrev, handleCloseModal]);


  // Helper for filter display labels
  const getFilterLabel = (id) => {
    switch (id) {
      case 'employees': return 'Employees';
            case 'teams': return 'Teams';
            case 'projects': return 'Projects';
            case 'apps': return 'Apps & Websites';
            case 'tasks': return 'Tasks';
            case 'screenshotTypes': return 'Screenshot types';
            case 'productivityTypes': return 'Productivity types';
            case 'category': return 'Category';
            default: return id;
    }
  };

  const getFilterList = (id) => {
    switch (id) {
      case 'employees': return employeesList;
            case 'teams': return teamsList;
            case 'projects': return projectsList;
            case 'apps': return appsList;
            case 'tasks': return tasksList;
            case 'screenshotTypes': return screenshotTypesList;
            case 'productivityTypes': return productivityTypesList;
            case 'category': return categoryList;
            default: return [];
    }
  };

  const handleFilterSelection = (type, selectedIds) => {
              setSelectedFilters(prev => ({
                ...prev,
                [type]: selectedIds
              }));
  };

  const getEmptyMessage = (type) => {
    switch (type) {
      case 'employees': return 'No available employee';
            case 'teams': return 'No available team';
            case 'projects': return 'No available project';
            case 'apps': return 'No available app';
            case 'tasks': return 'No available task';
            case 'screenshotTypes': return 'No available type';
            case 'productivityTypes': return 'No available productivity type';
            case 'category': return 'No available category';
            default: return 'No available item';
    }
  };

            return (
    <>
              <div className="min-h-screen bg-[#fcfdfe] dark:bg-slate-950 space-y-6 sm:space-y-8 pb-20 px-2 sm:px-4 lg:px-8 max-w-full overflow-x-hidden box-border animate-fade-in">
                {/* Header */}
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 py-6 sm:py-8">
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">Screenshots & Screen Recording</h1>

                    {/* Main Navigation Tabs (Phase 2) */}
                    <div className="flex items-center gap-1.5 bg-[#EEE8DD] dark:bg-[#252B20] p-1.5 rounded-xl border border-[#D6CDBC] dark:border-[#384232]">
                      <button
                        onClick={() => setActiveMainTab('screenshots')}
                        className={cn(
                          "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer",
                          activeMainTab === 'screenshots'
                            ? "bg-[#30382B] text-[#FDFBF7] shadow-warm-xs"
                            : "text-[#777367] hover:text-[#29291F] dark:hover:text-[#F5F1E9]"
                        )}
                      >
                        <Camera size={15} className={activeMainTab === 'screenshots' ? "text-[#D3B98D]" : ""} />
                        <span>Screenshots</span>
                        <span className={cn(
                          "text-[10px] px-2 py-0.5 rounded-full font-bold",
                          activeMainTab === 'screenshots' ? "bg-[#3C4536] text-[#D3B98D]" : "bg-[#D6CDBC]/50 text-[#777367]"
                        )}>
                          {filteredScreenshots.length}
                        </span>
                      </button>

                      <button
                        onClick={() => {
                          setActiveMainTab('videos');
                          fetchVideos();
                        }}
                        className={cn(
                          "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer",
                          activeMainTab === 'videos'
                            ? "bg-[#30382B] text-[#FDFBF7] shadow-warm-xs"
                            : "text-[#777367] hover:text-[#29291F] dark:hover:text-[#F5F1E9]"
                        )}
                      >
                        <Video size={15} className={activeMainTab === 'videos' ? "text-[#D3B98D]" : ""} />
                        <span>Video Recordings</span>
                        <span className={cn(
                          "text-[10px] px-2 py-0.5 rounded-full font-bold",
                          activeMainTab === 'videos' ? "bg-[#3C4536] text-[#D3B98D]" : "bg-[#D6CDBC]/50 text-[#777367]"
                        )}>
                          {videoRecordings.length}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Top Controls (Screenshots tab only) */}
                  {activeMainTab === 'screenshots' && (
                    <div className="flex items-center gap-2.5 flex-nowrap shrink-0">
                      {role === 'EMPLOYEE' && (
                        <button
                          onClick={handleCaptureRealScreen}
                          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-2"
                          title="Capture and upload your actual screen as a demo"
                        >
                          <Camera size={16} />
                          <span>Capture Real Screen</span>
                        </button>
                      )}

                      {/* Active Filter Tags */}
                      {Object.entries(selectedFilters).map(([key, value]) => {
                        if (value.length === 0) return null;
                        return (
                          <div key={key} className="flex items-center gap-2 bg-primary-50 dark:bg-primary-500/10 border border-primary-200 dark:border-primary-500/20 rounded-xl px-3 py-2 shadow-sm animate-in fade-in zoom-in duration-200">
                            <span className="text-xs font-bold text-primary-700 dark:text-primary-400">{getFilterLabel(key)} <span className="text-primary-400 dark:text-primary-500">({value.length})</span></span>
                            <button onClick={() => handleClearFilter(key)} className="p-0.5 hover:bg-primary-200 dark:hover:bg-primary-500/20 rounded-md text-primary-400 dark:text-primary-500 hover:text-primary-700 dark:hover:text-primary-300 transition-colors">
                              <X size={14} />
                            </button>
                          </div>
                        );
                      })}

                      {/* Add Filter Dropdown */}
                      {role !== 'EMPLOYEE' && (
                        <div className="relative" ref={filterRef}>
                          <button
                            onClick={() => setShowAddFilterDropdown(!showAddFilterDropdown)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-primary-600 dark:text-primary-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-primary-50 dark:hover:bg-primary-500/10 transition-all shadow-sm"
                          >
                            <Plus size={16} />
                            <span>Add Filter</span>
                          </button>

                          {showAddFilterDropdown && (
                            <div className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 overflow-hidden py-1 animate-in fade-in zoom-in duration-200 origin-top-left">
                              <div className="px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 mb-1">Filter By</div>
                              {[
                                { id: 'employees', label: 'Employees' },
                                { id: 'teams', label: 'Teams' },
                                { id: 'projects', label: 'Projects' },
                                { id: 'apps', label: 'Apps & Websites' },
                                { id: 'tasks', label: 'Tasks' },
                                { id: 'category', label: 'Category' },
                                { id: 'screenshotTypes', label: 'Screenshot types' },
                                { id: 'productivityTypes', label: 'Productivity types' }
                              ].map(f => (
                                <button
                                  key={f.id}
                                  onClick={() => {
                                    setActiveFilterModal(f.id);
                                    setShowAddFilterDropdown(false);
                                  }}
                                  className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-bold transition-colors"
                                >
                                  {f.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      <div data-date-sort-group="true" className="flex items-center gap-2 flex-nowrap shrink-0">
{/* Calendar Date Picker */}
                      <div className="relative" ref={calendarRef}>
                        <button
                          onClick={() => setShowCalendarDropdown(!showCalendarDropdown)}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm"
                        >
                          <Calendar size={16} className="text-primary-500" />
                          <span>
                            {isAllHistory ? 'All History' : isToday ? 'Today' : timelineDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                          <ChevronDown size={14} className={cn("transition-transform duration-200", showCalendarDropdown && "rotate-180")} />
                        </button>

                        {showCalendarDropdown && (
                          <div className="absolute top-full right-0 mt-2 w-[320px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-[100] overflow-hidden animate-in fade-in zoom-in duration-200 origin-top-right p-4">
                            <div className="space-y-4">
                              <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 block">Quick Select</label>
                                <div className="grid grid-cols-3 gap-2">
                                  <button
                                    onClick={() => { setTimelineDate(new Date()); setIsAllHistory(false); setShowCalendarDropdown(false); }}
                                    className={cn(
                                      "px-2.5 py-2 rounded-lg text-xs font-bold transition-all border",
                                      isToday && !isAllHistory ? "bg-primary-600 text-white border-primary-600" : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-transparent hover:border-slate-200"
                                    )}
                                  >
                                    Today
                                  </button>
                                  <button
                                    onClick={() => {
                                      const yesterday = new Date();
                                      yesterday.setDate(yesterday.getDate() - 1);
                                      setTimelineDate(yesterday);
                                      setIsAllHistory(false);
                                      setShowCalendarDropdown(false);
                                    }}
                                    className="px-2.5 py-2 rounded-lg text-xs font-bold bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-transparent hover:border-slate-200 transition-all"
                                  >
                                    Yesterday
                                  </button>
                                  <button
                                    onClick={() => {
                                      setIsAllHistory(true);
                                      setShowCalendarDropdown(false);
                                    }}
                                    className={cn(
                                      "px-2.5 py-2 rounded-lg text-xs font-bold transition-all border",
                                      isAllHistory ? "bg-primary-600 text-white border-primary-600" : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-transparent hover:border-slate-200"
                                    )}
                                  >
                                    All History
                                  </button>
                                </div>
                              </div>

                              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                                <div className="flex items-center justify-between mb-4">
                                  <button onClick={() => {
                                    const newDate = new Date(viewDate);
                                    newDate.setMonth(newDate.getMonth() - 1);
                                    setViewDate(newDate);
                                  }} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors">
                                    <ChevronLeft size={16} />
                                  </button>
                                  <span className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                    {viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                                  </span>
                                  <button onClick={() => {
                                    const newDate = new Date(viewDate);
                                    newDate.setMonth(newDate.getMonth() + 1);
                                    setViewDate(newDate);
                                  }} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors">
                                    <ChevronRight size={16} />
                                  </button>
                                </div>

                                <div className="grid grid-cols-7 gap-1 text-center mb-2">
                                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                                    <span key={d} className="text-[10px] font-black text-slate-400 uppercase">{d}</span>
                                  ))}
                                </div>

                                <div className="grid grid-cols-7 gap-1">
                                  {Array.from({ length: new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay() }).map((_, i) => (
                                    <div key={`empty-${i}`} />
                                  ))}
                                  {Array.from({ length: new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate() }).map((_, i) => {
                                    const day = i + 1;
                                    const currentDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
                                    const isSelected = timelineDate.toDateString() === currentDay.toDateString();
                                    const isTodayCircle = new Date().toDateString() === currentDay.toDateString();
                                    const isFuture = currentDay > new Date();

                                    return (
                                      <button
                                        key={day}
                                        disabled={isFuture}
                                        onClick={() => {
                                          setTimelineDate(currentDay);
                                          setIsAllHistory(false);
                                          setShowCalendarDropdown(false);
                                        }}
                                        className={cn(
                                          "h-8 w-8 rounded-lg text-xs font-bold flex items-center justify-center transition-all",
                                          isSelected ? "bg-primary-600 text-white shadow-lg shadow-primary-600/20 scale-110 z-10" :
                                            isFuture ? "text-slate-200 dark:text-slate-800 cursor-not-allowed" :
                                              isTodayCircle ? "text-primary-600 border border-primary-200 dark:border-primary-500/20" :
                                                "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                                        )}
                                      >
                                        {day}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Sort Dropdown */}
                      <div className="relative">
                        <select
                          value={sortOrder}
                          onChange={(e) => setSortOrder(e.target.value)}
                          className="appearance-none pl-4 pr-10 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-primary-600 dark:text-primary-400 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-primary-500/10"
                        >
                          <option value="newest">Newest</option>
                          <option value="oldest">Oldest</option>
                        </select>
                        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-600 dark:text-primary-400 pointer-events-none" />
                      </div>
</div>
                    </div>
                  )}

                  {/* Top Controls (Videos Tab) */}
                  {activeMainTab === 'videos' && (
                    <div className="flex items-center gap-2.5 flex-nowrap shrink-0">
                      {role === 'EMPLOYEE' && (
                        <>
                          {!isRecordingVideo ? (
                            <button
                              onClick={handleStartScreenRecording}
                              disabled={isUploadingVideo}
                              className="px-4 py-2 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-lg shadow-rose-500/20 active:scale-95 transition-all flex items-center gap-2 animate-in fade-in cursor-pointer whitespace-nowrap shrink-0"
                              title="Start screen recording to capture and save video session"
                            >
                              {isUploadingVideo ? (
                                <>
                                  <Loader2 size={16} className="animate-spin" />
                                  <span>Saving Video...</span>
                                </>
                              ) : (
                                <>
                                  <Video size={16} />
                                  <span>Record Screen Video</span>
                                </>
                              )}
                            </button>
                          ) : (
                            <button
                              onClick={handleStopScreenRecording}
                              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-rose-600/30 active:scale-95 transition-all flex items-center gap-2 animate-pulse whitespace-nowrap shrink-0"
                              title="Stop recording and save video"
                            >
                              <span className="h-2 w-2 rounded-full bg-white animate-ping" />
                              <Square size={14} className="fill-current" />
                              <span>Stop Recording ({formatRecordingTimer(recordingSeconds)})</span>
                            </button>
                          )}
                        </>
                      )}

                      <button
                        onClick={fetchVideos}
                        disabled={loadingVideos}
                        className="p-2.5 bg-[#FBF9F5] dark:bg-[#252B20] border border-[#E5DED2] dark:border-[#384232] hover:bg-[#EEE8DD] dark:hover:bg-[#30382B] text-[#777367] dark:text-[#F5F1E9] rounded-xl transition-all shadow-warm-xs cursor-pointer shrink-0"
                        title="Refresh video list"
                      >
                        <RefreshCw size={16} className={cn(loadingVideos && "animate-spin text-[#B9955B]")} />
                      </button>
                    </div>
                  )}
                </div>

                {/* ── Screenshots Tab View ────────────────────────────────────────── */}
                {activeMainTab === 'screenshots' && (
                  <>
                    {/* Selection & Bulk Actions Bar */}
                    {role !== 'EMPLOYEE' && (
                      <div className="flex flex-wrap items-center gap-4 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-[1.5rem] border border-slate-200 dark:border-slate-800 shadow-sm animate-in slide-in-from-top duration-300">
                        {role === 'ADMIN' && (
                          <>
                            <button
                              onClick={toggleSelectionMode}
                              className={cn(
                                "px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 border",
                                isSelectionMode
                                  ? "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/20 shadow-inner"
                                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm"
                              )}
                            >
                              <CheckSquare size={18} />
                              <span>{isSelectionMode ? 'Cancel Selection' : 'Select Mode'}</span>
                            </button>

                            {isSelectionMode && (
                              <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left duration-300 w-full sm:w-auto">
                                <button
                                  onClick={handleSelectAllScreenshots}
                                  className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-transparent shadow-sm"
                                >
                                  Select All
                                </button>
                                <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-800 mx-1" />
                                <span className="text-sm font-bold text-slate-500 dark:text-slate-400">
                                  {selectedIds.length} Selected
                                </span>
                                <button
                                  onClick={handleBulkDelete}
                                  disabled={selectedIds.length === 0 || isBulkDeleting}
                                  className="ml-auto px-6 py-2.5 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-lg shadow-rose-500/20 transition-all flex items-center gap-2 active:scale-95"
                                >
                                  {isBulkDeleting ? <RefreshCw size={18} className="animate-spin" /> : <Trash2 size={18} />}
                                  <span>Delete Selected</span>
                                </button>
                              </div>
                            )}
                          </>
                        )}

                        {role !== 'EMPLOYEE' && (
                          <div className="ml-auto flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 min-h-[40px]">
                            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Global Blur</span>
                            <button
                              onClick={() => { setGlobalBlur(!globalBlur); updateSetting('globalBlur', !globalBlur); }}
                              className={cn(
                                "relative h-5 w-9 flex-shrink-0 rounded-full transition-colors duration-300 focus:outline-none",
                                globalBlur ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-700"
                              )}
                            >
                              <span
                                className={cn(
                                  "block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform duration-300",
                                  globalBlur ? "translate-x-4" : "translate-x-0.5"
                                )}
                              />
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Empty State or Content */}
                    {loadingScreenshots ? (
                      <div className="flex flex-col items-center justify-center py-32 px-4 space-y-4">
                        <div className="relative">
                          <div className="h-16 w-16 border-4 border-primary-500/10 border-t-primary-500 rounded-full animate-spin" />
                          <Calendar size={24} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary-500 animate-pulse" />
                        </div>
                        <div className="text-center">
                          <h3 className="text-lg font-black text-slate-800 dark:text-white mb-1">Loading {isToday ? 'Today' : 'Archive'}</h3>
                          <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Fetching screenshots for {timelineDate.toLocaleDateString([], { month: 'long', day: 'numeric' })}</p>
                        </div>
                      </div>
                    ) : filteredScreenshots.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-24 px-4">
                        <div className="w-48 h-48 mb-6">
                          <svg viewBox="0 0 200 200" className="w-full h-full">
                            <circle cx="100" cy="100" r="80" fill="#F1F5F9" stroke="#CBD5E1" strokeWidth="2" />
                            <circle cx="85" cy="90" r="5" fill="#94A3B8" />
                            <circle cx="115" cy="90" r="5" fill="#94A3B8" />
                            <path d="M 85 115 Q 100 125 115 115" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
                            <path d="M 130 130 L 160 160" stroke="#CBD5E1" strokeWidth="8" strokeLinecap="round" />
                            <circle cx="165" cy="165" r="20" fill="none" stroke="#CBD5E1" strokeWidth="8" />
                          </svg>
                        </div>
                        <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2 text-center">No screenshots found for the selected period</h3>
                        <p className="text-slate-500 dark:text-slate-400 font-medium text-center max-w-md">
                          Try to change the period or go to the settings and check if screenshots are enabled.
                        </p>
                      </div>
                    ) : (
                      <>




                        {/* 4. Screenshot Grid Grouped by Date (Insightful Image 3) */}
                        <div className="space-y-8">
                                {Object.entries(
                                  filteredScreenshots.reduce((acc, s) => {
                                    const d = new Date(s.timestamp || s.capturedAt);
                                    const dayKey = isNaN(d.getTime()) ? 'Recent Captures' : d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: '2-digit' });
                                    if (!acc[dayKey]) acc[dayKey] = [];
                                    acc[dayKey].push(s);
                                    return acc;
                                  }, {})
                                ).map(([dayLabel, shots]) => (
                                  <div key={dayLabel} className="space-y-4">
                                    {/* Insightful Day Header */}
                                    <div className="flex items-center gap-2.5 pb-1 border-b border-slate-100 dark:border-slate-800/80">
                                      <span className="w-2.5 h-2.5 rounded-full bg-slate-400 dark:bg-slate-500" />
                                      <h3 className="text-sm font-black text-slate-700 dark:text-slate-300">
                                        {dayLabel}
                                      </h3>
                                      <span className="text-[11px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                                        {shots.length} {shots.length === 1 ? 'screenshot' : 'screenshots'}
                                      </span>
                                    </div>

                                    {/* Grid for this day */}
                                    <div className={cn(
                                      "grid gap-6 transition-all duration-500",
                                      viewMode === 'grid' ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1 max-w-4xl mx-auto"
                                    )}>
                                      {shots.map((s, index) => (
                                        <div key={s.id || s.id_val} className={cn("transition-all duration-500", isPlaying && index === playbackIndex && viewMode === 'grid' ? "scale-105 ring-4 ring-amber-500/20 rounded-2xl z-10" : "")}>
                                          <ScreenshotCard
                                            {...s}
                                            viewMode={viewMode}
                                            globalBlur={globalBlur}
                                            onDelete={role === 'ADMIN' ? handleDelete : null}
                                            onDownload={handleDownload}
                                            onBlurToggle={handleBlurToggleBackend}
                                            onView={(data) => handleViewScreenshot(data, index)}
                                            onViewLive={handleStartPlayback}
                                            isSelectionMode={isSelectionMode}
                                            isSelected={selectedIds.includes(s.id)}
                                            onToggleSelection={onToggleSelection}
                                          />
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {hasMore && filteredScreenshots.length > 0 && (
                                <div className="flex justify-center mt-6">
                                  <button
                                    onClick={handleLoadMore}
                                    disabled={loadingScreenshots}
                                    className="px-8 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-sm flex items-center gap-2 active:scale-95 disabled:opacity-50"
                                  >
                                    {loadingScreenshots ? <RefreshCw size={16} className="animate-spin" /> : <ChevronDown size={16} />}
                                    <span>{loadingScreenshots ? 'Loading...' : 'Load More'}</span>
                                  </button>
                                </div>
                              )}


                            </>
                          )}
                        </>
      )}

                        {/* ── Video Recordings Tab View (Phase 2) ─────────────────────────── */}
                        {activeMainTab === 'videos' && (
                          <div className="space-y-6 animate-in fade-in duration-300">
                            {/* Filter & Control Bar */}
                            <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-[1.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
                              <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
                                {/* Search input */}
                                <div className="relative flex-1 min-w-[200px] max-w-sm">
                                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                  <input
                                    type="text"
                                    value={videoSearchQuery}
                                    onChange={(e) => setVideoSearchQuery(e.target.value)}
                                    placeholder="Search recordings by employee..."
                                    className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl text-xs font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                                  />
                                  {videoSearchQuery && (
                                    <button onClick={() => setVideoSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                      <X size={14} />
                                    </button>
                                  )}
                                </div>

                                {/* Employee Filter Dropdown */}
                                {role !== 'EMPLOYEE' && (
                                  <div className="relative">
                                    <select
                                      value={videoEmployeeFilter}
                                      onChange={(e) => setVideoEmployeeFilter(e.target.value)}
                                      className="appearance-none pl-3 pr-8 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                                    >
                                      <option value="All">All Employees ({contextEmployees.length})</option>
                                      {contextEmployees.map(emp => (
                                        <option key={emp.id} value={emp.id}>{emp.name || emp.fullName}</option>
                                      ))}
                                    </select>
                                    <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                  </div>
                                )}

                                {/* Date Filter Input */}
                                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 px-3 py-1.5 rounded-xl">
                                  <Calendar size={14} className="text-primary-500" />
                                  <input
                                    type="date"
                                    value={videoDateFilter}
                                    onChange={(e) => setVideoDateFilter(e.target.value)}
                                    className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
                                  />
                                  {videoDateFilter && (
                                    <button
                                      onClick={() => setVideoDateFilter('')}
                                      className="text-slate-400 hover:text-slate-600 text-xs font-bold ml-1"
                                      title="Clear date filter"
                                    >
                                      <X size={12} />
                                    </button>
                                  )}
                                </div>

                                {/* Quick Today Filter */}
                                <button
                                  onClick={() => {
                                    const todayStr = new Date().toISOString().slice(0, 10);
                                    setVideoDateFilter(videoDateFilter === todayStr ? '' : todayStr);
                                  }}
                                  className={cn(
                                    "px-3 py-2 rounded-xl text-xs font-bold transition-all border",
                                    videoDateFilter === new Date().toISOString().slice(0, 10)
                                      ? "bg-primary-600 text-white border-primary-600"
                                      : "bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700/60 hover:bg-slate-100"
                                  )}
                                >
                                  Today
                                </button>
                              </div>

                              {/* Refresh & Summary Counter */}
                              <div className="flex items-center gap-3">
                                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                                  {filteredVideoRecordings.length} {filteredVideoRecordings.length === 1 ? 'recording' : 'recordings'}
                                </span>
                                <button
                                  onClick={fetchVideos}
                                  disabled={loadingVideos}
                                  className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition-all disabled:opacity-50"
                                  title="Refresh video list"
                                >
                                  <RefreshCw size={16} className={cn(loadingVideos && "animate-spin text-primary-500")} />
                                </button>
                              </div>
                            </div>

                            {/* Content: Loading, Empty, or Video Cards Grid */}
                            {loadingVideos ? (
                              <div className="flex flex-col items-center justify-center py-28 px-4 space-y-4">
                                <div className="h-14 w-14 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin" />
                                <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Loading video recordings...</p>
                              </div>
                            ) : filteredVideoRecordings.length === 0 ? (
                              <div className="flex flex-col items-center justify-center py-24 px-4 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 text-center">
                                <div className="h-20 w-20 rounded-3xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center text-primary-600 dark:text-primary-400 mb-4 shadow-inner">
                                  <Video size={36} />
                                </div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">No Video Recordings Found</h3>
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 max-w-md mb-6 leading-relaxed">
                                  Screen video recordings are captured in 5-minute chunks when employees run the Screen Tracker, or you can record a real screen session right now.
                                </p>
                                <div className="flex flex-wrap items-center justify-center gap-3">
                                  {role !== 'EMPLOYEE' && (
                                    <>
                                      {!isRecordingVideo ? (
                                        <button
                                          onClick={handleStartScreenRecording}
                                          disabled={isUploadingVideo}
                                          className="px-5 py-2.5 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-2 cursor-pointer"
                                        >
                                          {isUploadingVideo ? (
                                            <>
                                              <Loader2 size={16} className="animate-spin" />
                                              <span>Saving Video...</span>
                                            </>
                                          ) : (
                                            <>
                                              <Video size={16} />
                                              <span>Record Screen Video Now</span>
                                            </>
                                          )}
                                        </button>
                                      ) : (
                                        <button
                                          onClick={handleStopScreenRecording}
                                          className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-2 animate-pulse"
                                        >
                                          <Square size={14} className="fill-current" />
                                          <span>Stop & Save Recording ({formatRecordingTimer(recordingSeconds)})</span>
                                        </button>
                                      )}
                                    </>
                                  )}
                                  {(videoEmployeeFilter !== 'All' || videoDateFilter || videoSearchQuery) && (
                                    <button
                                      onClick={() => {
                                        setVideoEmployeeFilter('All');
                                        setVideoDateFilter('');
                                        setVideoSearchQuery('');
                                      }}
                                      className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
                                    >
                                      Clear All Filters
                                    </button>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                                {filteredVideoRecordings.map((recording) => {
                                  const recDate = new Date(recording.createdAt);
                                  const dateStr = recDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
                                  const timeStr = recDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                  const empName = recording.employee?.fullName || 'Employee';
                                  const initial = empName.charAt(0).toUpperCase();

                                  return (
                                    <div
                                      key={recording.id}
                                      className="group bg-white dark:bg-slate-900 rounded-[1.75rem] border border-slate-200 dark:border-slate-800/80 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col hover:-translate-y-1"
                                    >
                                      {/* Video Thumbnail / Preview Area */}
                                      <div
                                        onClick={() => handleOpenVideoPlayback(recording)}
                                        className="relative aspect-video bg-slate-950 flex items-center justify-center cursor-pointer overflow-hidden group/thumb"
                                      >
                                        <video
                                          src={`${getImageUrl(recording.fileUrl)}#t=0.5`}
                                          preload="metadata"
                                          className="w-full h-full object-cover opacity-70 group-hover/thumb:opacity-90 group-hover/thumb:scale-105 transition-all duration-300"
                                        />

                                        {/* Status Chip (Top Left) */}
                                        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-white text-[10px] font-black uppercase tracking-wider">
                                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                          <span>5m Chunk</span>
                                        </div>

                                        {/* Size Badge (Top Right) */}
                                        <div className="absolute top-3 right-3 px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-white/90 text-[10px] font-bold">
                                          {recording.sizeMb ? `${recording.sizeMb} MB` : 'WebM'}
                                        </div>

                                        {/* Play Button Overlay */}
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover/thumb:bg-black/10 transition-colors">
                                          <div className="h-12 w-12 rounded-full bg-white/90 dark:bg-primary-600 text-slate-900 dark:text-white flex items-center justify-center shadow-2xl transform group-hover/thumb:scale-110 transition-transform">
                                            <Play size={20} className="translate-x-0.5" />
                                          </div>
                                        </div>

                                        {/* Timestamp Overlay (Bottom) */}
                                        <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center text-[11px] text-white/80 font-bold bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-md">
                                          <span>{timeStr}</span>
                                          <span className="text-emerald-400">Recorded</span>
                                        </div>
                                      </div>

                                      {/* Card Body */}
                                      <div className="p-4 flex flex-col flex-1 justify-between gap-3">
                                        {/* Employee info */}
                                        <div className="flex items-center gap-2.5">
                                          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary-500 to-indigo-600 text-white font-black text-xs flex items-center justify-center shadow-sm">
                                            {initial}
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                              {empName}
                                            </h4>
                                            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                              {dateStr}
                                            </p>
                                          </div>
                                        </div>

                                        {/* Action buttons */}
                                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                                          <button
                                            onClick={() => handleOpenVideoPlayback(recording)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 dark:bg-primary-500/10 hover:bg-primary-100 dark:hover:bg-primary-500/20 text-primary-600 dark:text-primary-400 rounded-xl text-xs font-bold transition-colors"
                                          >
                                            <Play size={14} />
                                            <span>Play</span>
                                          </button>

                                          <div className="flex items-center gap-1">
                                            <a
                                              href={getImageUrl(recording.fileUrl)}
                                              download={`recording-${recording.id.slice(0, 8)}.webm`}
                                              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                              title="Download Recording"
                                            >
                                              <Download size={15} />
                                            </a>

                                            {role === 'ADMIN' && (
                                              <button
                                                onClick={() => {
                                                  if (window.confirm("Are you sure you want to delete this video recording?")) {
                                                    handleDeleteVideo(recording.id);
                                                  }
                                                }}
                                                className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors"
                                                title="Delete Recording"
                                              >
                                                <Trash2 size={15} />
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}

                      </div>

                    {/* ── Live Stream Viewer Modal ─────────────────────────────────────────── */}
                    <LiveStreamModal
                      isOpen={!!viewingLiveEmployee}
                      onClose={() => setViewingLiveEmployee(null)}
                      employee={viewingLiveEmployee}
                      socket={socket}
                    />

                    {/* ── Video Playback Modal (Phase 2) ─────────────────────────────────── */}
                    <VideoPlaybackModal
                      isOpen={isVideoModalOpen}
                      onClose={() => {
                        setIsVideoModalOpen(false);
                        setActivePlaybackVideo(null);
                      }}
                      playlist={activeVideoPlaylist}
                      initialIndex={activeVideoIndex}
                      onDeleteVideo={handleDeleteVideo}
                      canDelete={role === 'ADMIN'}
                    />

                    {/* Generic Selection Modal (Handles all filter types) */}
                    {activeFilterModal && (
                      <GenericSelectionModal
                        isOpen={!!activeFilterModal}
                        onClose={() => setActiveFilterModal(null)}
                        title={getFilterLabel(activeFilterModal).toUpperCase()}
                        items={getFilterList(activeFilterModal)}
                        selectedIds={selectedFilters[activeFilterModal]}
                        onSelectionChange={(ids) => handleFilterSelection(activeFilterModal, ids)}
                        placeholder="Search"
                        emptyMessage={getEmptyMessage(activeFilterModal)}
                      />
                    )}

                    {/* Restricted Apps Modal */}
                    {showRestrictedApps && (
                      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm animate-fade-in">
                        <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-scale-in border border-slate-200 dark:border-slate-800">
                          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-[#fcfdfe] dark:bg-slate-800/50">
                            <div>
                              <h3 className="text-lg font-black text-slate-900 dark:text-white">Restricted Apps</h3>
                              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Auto-pause tracking</p>
                            </div>
                            <button onClick={() => setShowRestrictedApps(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-all">
                              <X size={20} className="text-slate-500 dark:text-slate-400" />
                            </button>
                          </div>
                          <div className="p-6 space-y-4">
                            <div className="flex flex-col sm:flex-row gap-2">
                              <input
                                type="text"
                                placeholder="Add app (e.g. Netflix)"
                                value={newApp}
                                onChange={(e) => setNewApp(e.target.value)}
                                className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary-500/10 min-h-[44px] text-slate-700 dark:text-slate-300 placeholder:text-slate-400"
                              />
                              <button
                                onClick={() => {
                                  if (newApp) {
                                    setRestrictedApps([...restrictedApps, newApp]);
                                    setNewApp('');
                                  }
                                }}
                                className="px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-sm font-bold hover:bg-slate-800 dark:hover:bg-slate-100 transition-all min-h-[44px]"
                              >
                                Add
                              </button>
                            </div>
                            <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                              {restrictedApps.map(app => (
                                <div key={app} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 group">
                                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{app}</span>
                                  <button
                                    onClick={() => setRestrictedApps(restrictedApps.filter(a => a !== app))}
                                    className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="p-6 bg-[#fcfdfe] dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
                            <button onClick={() => setShowRestrictedApps(false)} className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-sm font-bold shadow-lg shadow-slate-900/20 dark:shadow-white/20 active:scale-95 transition-all">Save Changes</button>
                          </div>
                        </div>
                      </div>
                    )}

                    {showCaptureRules && (
                      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm animate-fade-in">
                        <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-scale-in border border-slate-200 dark:border-slate-800">
                          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-[#fcfdfe] dark:bg-slate-800/50">
                            <div>
                              <h3 className="text-lg font-black text-slate-900 dark:text-white">Capture Rules</h3>
                              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Global engine behavior</p>
                            </div>
                            <button onClick={() => setShowCaptureRules(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-all">
                              <X size={20} className="text-slate-500 dark:text-slate-400" />
                            </button>
                          </div>
                          <div className="p-6 space-y-3">
                            {rules.map(rule => (
                              <button
                                key={rule.id}
                                onClick={() => setRules(rules.map(r => r.id === rule.id ? { ...r, enabled: !r.enabled } : r))}
                                className={cn(
                                  "w-full flex items-center justify-between p-4 rounded-2xl border transition-all text-left",
                                  rule.enabled ? "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20" : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 grayscale opacity-60"
                                )}
                              >
                                <div>
                                  <h4 className="text-sm font-black text-slate-900 dark:text-white">{rule.name}</h4>
                                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{rule.desc}</p>
                                </div>
                                <div className={cn(
                                  "h-6 w-11 rounded-full relative transition-all duration-300",
                                  rule.enabled ? "bg-amber-500" : "bg-slate-300 dark:bg-slate-600"
                                )}>
                                  <div className={cn(
                                    "absolute top-1 h-4 w-4 bg-white rounded-full transition-all duration-300 shadow-sm",
                                    rule.enabled ? "left-6" : "left-1"
                                  )} />
                                </div>
                              </button>
                            ))}
                          </div>
                          <div className="p-6 bg-[#fcfdfe] dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
                            <button onClick={() => setShowCaptureRules(false)} className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-sm font-bold shadow-lg shadow-slate-900/20 dark:shadow-white/20 active:scale-95 transition-all">Apply Policy</button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Detail View Modal */}
                    {selectedScreenshot && (
                      <div
                        className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-10 bg-slate-900/95 dark:bg-black/95 backdrop-blur-xl animate-fade-in"
                        onClick={handleCloseModal}
                      >
                        <div
                          className="relative w-full max-w-6xl aspect-video bg-black rounded-3xl shadow-2xl overflow-hidden animate-scale-in border border-white/10"
                          onClick={e => e.stopPropagation()}
                        >
                          {/* Header Actions */}
                          <div className="absolute top-0 inset-x-0 p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 z-50 bg-gradient-to-b from-black/80 to-transparent pointer-events-auto">
                            <div className="flex items-center gap-3 sm:gap-4">
                              <div className="h-10 w-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white backdrop-blur-md flex-shrink-0">
                                {selectedScreenshot.employee.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <h3 className="text-white font-black text-base sm:text-lg leading-none mb-1 truncate">{selectedScreenshot.employee}</h3>
                                <p className="text-white/60 text-[10px] sm:text-xs font-bold uppercase tracking-widest">{selectedScreenshot.time}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                              <button
                                onClick={() => handleDownload(selectedScreenshot.image || selectedScreenshot.url)}
                                className="flex-1 sm:flex-none h-10 sm:h-12 px-4 sm:px-6 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl sm:rounded-2xl flex items-center justify-center gap-2 transition-all backdrop-blur-md font-bold text-xs sm:text-sm"
                              >
                                <Download size={16} className="sm:w-[18px] sm:h-[18px]" />
                                <span>Download</span>
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleCloseModal(); }}
                                className="h-10 w-10 sm:h-12 sm:w-12 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all backdrop-blur-md cursor-pointer group flex-shrink-0"
                                title="Close View"
                              >
                                <X size={20} className="sm:w-6 sm:h-6 group-hover:rotate-90 transition-transform duration-300" />
                              </button>
                            </div>
                          </div>

                          {/* Navigation Buttons */}
                          <div className="absolute inset-y-0 left-0 flex items-center p-4 z-40 pointer-events-none">
                            <button
                              onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                              className="h-14 w-14 rounded-full bg-white/5 hover:bg-white/10 text-white flex items-center justify-center border border-white/10 backdrop-blur-md transition-all active:scale-90 pointer-events-auto"
                            >
                              <ChevronLeft size={32} />
                            </button>
                          </div>
                          <div className="absolute inset-y-0 right-0 flex items-center p-4 z-40 pointer-events-none">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleNext(); }}
                              className="h-14 w-14 rounded-full bg-white/5 hover:bg-white/10 text-white flex items-center justify-center border border-white/10 backdrop-blur-md transition-all active:scale-90 pointer-events-auto"
                            >
                              <ChevronRight size={32} />
                            </button>
                          </div>

                          {/* Image */}
                          <img
                            src={getImageUrl(selectedScreenshot.image || selectedScreenshot.url || selectedScreenshot.imageUrl)}
                            alt="Full View"
                            className={cn(
                              "w-full h-full object-contain transition-all duration-1000",
                              selectedScreenshot.effectiveBlur ? "blur-3xl scale-125 opacity-30" : "scale-100"
                            )}
                          />

                          {/* Privacy Warning Overlay */}
                          {selectedScreenshot.effectiveBlur && (
                            <div className="absolute inset-0 flex items-center justify-center z-20">
                              <div className="max-w-md text-center p-8 bg-black/40 backdrop-blur-2xl rounded-[3rem] border border-white/10 shadow-2xl">
                                <div className="h-20 w-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/30">
                                  <Shield size={40} className="text-emerald-400" />
                                </div>
                                <h4 className="text-2xl font-black text-white mb-2 tracking-tight">Content Restricted</h4>
                                <p className="text-white/60 font-medium text-sm leading-relaxed mb-8">
                                  This screenshot contains sensitive information and has been automatically blurred per company policy.
                                </p>
                                <button
                                  onClick={() => setSelectedScreenshot({ ...selectedScreenshot, effectiveBlur: false })}
                                  className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-bold rounded-2xl transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                                >
                                  Override Blur (Audit Only)
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Footer Info */}
                          <div className="absolute bottom-0 inset-x-0 p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-3 z-30 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
                            <div className="flex items-center gap-3">
                              <span className="text-white text-xs sm:text-sm font-bold">
                                {selectedScreenshot.time} • {selectedScreenshot.employee}
                              </span>
                              {selectedScreenshot.productivity && (
                                <span className={cn(
                                  "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider",
                                  selectedScreenshot.productivity === 'productive' ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                )}>
                                  {selectedScreenshot.productivity}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-white/60 font-medium">
                              Use <span className="text-white font-bold">←</span> / <span className="text-white font-bold">→</span> arrows or side buttons to browse
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    <DeleteConfirmationModal
                      isOpen={isDeleteModalOpen}
                      onClose={() => setIsDeleteModalOpen(false)}
                      onConfirm={handleConfirmDelete}
                      isEmployee={role === 'EMPLOYEE'}
                    />
                  </>
                );
}