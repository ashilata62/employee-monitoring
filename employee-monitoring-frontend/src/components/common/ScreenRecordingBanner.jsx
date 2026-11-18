import React from 'react';
import { Square, Loader2, X } from 'lucide-react';
import { useScreenRecordingStore, formatRecordingTimer } from '../../store/screenRecordingStore';

export function ScreenRecordingBanner() {
    const { isRecording, recordingSeconds, isUploading, stopRecording, forceReset } = useScreenRecordingStore();

    if (!isRecording && !isUploading) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-[#30382B] text-[#FDFBF7] px-4 py-2.5 rounded-2xl shadow-warm-lg border border-[#D3B98D]/40 backdrop-blur-md animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center gap-2.5">
                <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
                </span>
                <div className="flex flex-col">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#D3B98D]">
                        {isUploading ? "Saving Video..." : "Screen Recording Active"}
                    </span>
                    <span className="font-mono text-xs font-bold text-[#FDFBF7]">
                        {formatRecordingTimer(recordingSeconds)}
                    </span>
                </div>
            </div>

            <button
                onClick={stopRecording}
                disabled={isUploading}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#8C4A38] hover:bg-[#A35642] disabled:opacity-50 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-sm transition-all active:scale-95 ml-2"
                title="Stop recording and save video"
            >
                {isUploading ? (
                    <>
                        <Loader2 size={13} className="animate-spin" />
                        <span>Saving...</span>
                    </>
                ) : (
                    <>
                        <Square size={12} className="fill-current" />
                        <span>Stop & Save</span>
                    </>
                )}
            </button>

            {isUploading && (
                <button
                    onClick={forceReset}
                    className="p-1 hover:bg-white/10 rounded-lg text-[#FDFBF7]/60 hover:text-white transition-colors cursor-pointer ml-1"
                    title="Cancel and dismiss"
                >
                    <X size={14} />
                </button>
            )}
        </div>
    );
}
