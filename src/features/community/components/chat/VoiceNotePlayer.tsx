import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Mic } from 'lucide-react';
import { PresenceAvatar } from '../../../../components/ui/PresenceAvatar';

interface VoiceNotePlayerProps {
  audioUrl: string;
  duration?: number | null;
  senderAvatar?: string | null;
  senderId?: string;
  senderName?: string;
  isMine: boolean;
}

export const VoiceNotePlayer: React.FC<VoiceNotePlayerProps> = ({
  audioUrl,
  duration = 0,
  senderAvatar,
  senderId = '',
  senderName = 'User',
  isMine,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration || 0);
  const [playbackRate, setPlaybackRate] = useState<1 | 1.5 | 2>(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (duration && duration > 0) {
      setTotalDuration(Math.round(duration));
    }
  }, [duration]);

  useEffect(() => {
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    audio.onloadedmetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setTotalDuration(Math.round(audio.duration));
      } else if (duration && duration > 0) {
        setTotalDuration(Math.round(duration));
      }
    };

    audio.ontimeupdate = () => {
      setCurrentTime(audio.currentTime);
      if (!isFinite(totalDuration) || totalDuration <= 0) {
        if (audio.duration && isFinite(audio.duration)) {
          setTotalDuration(Math.round(audio.duration));
        } else if (duration && duration > 0) {
          setTotalDuration(Math.round(duration));
        }
      }
    };

    audio.onended = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, [audioUrl, duration, totalDuration]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.playbackRate = playbackRate;
      audioRef.current.play().catch(console.error);
      setIsPlaying(true);
    }
  };

  const cycleSpeed = () => {
    const nextRate: 1 | 1.5 | 2 = playbackRate === 1 ? 1.5 : playbackRate === 1.5 ? 2 : 1;
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !totalDuration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const targetTime = pos * totalDuration;
    audioRef.current.currentTime = targetTime;
    setCurrentTime(targetTime);
  };

  const formatSecs = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // 24 simulated audio waveform bars
  const bars = [
    30, 45, 80, 60, 40, 75, 90, 65, 50, 85, 100, 70, 55, 90, 65, 45, 80, 50, 40, 70, 85, 60, 40,
    30,
  ];

  const progressPercent = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  return (
    <div className="flex items-center gap-2.5 py-1 min-w-[220px] max-w-[280px] select-none">
      {/* Sender Avatar with Microphone badge */}
      <div className="relative w-10 h-10 rounded-full shrink-0">
        <PresenceAvatar
          userId={senderId}
          avatarUrl={senderAvatar}
          altText={senderName}
          className="w-full h-full rounded-full object-cover"
        />
        <div className={`absolute -bottom-1 -right-1 w-4.5 h-4.5 rounded-full ${isMine ? 'bg-indigo-700 text-white' : 'bg-indigo-600 text-white'} flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-xs`}>
          <Mic size={10} strokeWidth={2.5} />
        </div>
      </div>

      {/* Play/Pause Button */}
      <button
        type="button"
        onClick={togglePlay}
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm active:scale-95 transition-all ${
          isMine
            ? 'bg-white text-indigo-600 hover:bg-white/90'
            : 'bg-indigo-600 text-white hover:bg-indigo-700'
        }`}
        aria-label={isPlaying ? 'Pause voice message' : 'Play voice message'}
      >
        {isPlaying ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" className="ml-0.5" />}
      </button>

      {/* Waveform Scrubber & Timer */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <div
          onClick={handleSeek}
          className="flex items-center gap-[2.5px] h-6 cursor-pointer relative py-1"
          title="Seek voice message"
        >
          {bars.map((barHeight, idx) => {
            const barProgress = (idx / bars.length) * 100;
            const isFilled = barProgress <= progressPercent;

            return (
              <div
                key={idx}
                style={{ height: `${barHeight}%` }}
                className={`w-[3px] rounded-full transition-colors ${
                  isFilled
                    ? isMine
                      ? 'bg-white'
                      : 'bg-indigo-600 dark:bg-indigo-400'
                    : isMine
                    ? 'bg-white/30'
                    : 'bg-slate-300 dark:bg-slate-700'
                }`}
              />
            );
          })}
        </div>

        <div className={`flex items-center justify-between text-[11px] font-medium ${isMine ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'}`}>
          <span>{isPlaying ? formatSecs(currentTime) : formatSecs(totalDuration)}</span>
          <button
            type="button"
            onClick={cycleSpeed}
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full transition-colors ${
              isMine
                ? 'bg-white/20 text-white hover:bg-white/30'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            {playbackRate}x
          </button>
        </div>
      </div>
    </div>
  );
};
