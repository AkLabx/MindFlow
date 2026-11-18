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
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    audio.onloadedmetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setTotalDuration(Math.round(audio.duration));
      }
    };

    audio.ontimeupdate = () => {
      setCurrentTime(audio.currentTime);
    };

    audio.onended = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, [audioUrl]);

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
    <div className="flex items-center gap-3 py-1 min-w-[220px] max-w-[280px] select-none">
      {/* Sender Avatar with Microphone badge */}
      <div className="relative w-11 h-11 rounded-full shrink-0">
        <PresenceAvatar
          userId={senderId}
          avatarUrl={senderAvatar}
          altText={senderName}
          className="w-full h-full rounded-full object-cover"
        />
        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#00A884] text-white flex items-center justify-center border-2 border-white dark:border-[#1F2C34] shadow-sm">
          <Mic size={11} strokeWidth={2.5} />
        </div>
      </div>

      {/* Play/Pause Button */}
      <button
        type="button"
        onClick={togglePlay}
        className="w-8 h-8 rounded-full bg-[#00A884] text-white flex items-center justify-center shrink-0 shadow-sm active:scale-95 transition-transform"
        aria-label={isPlaying ? 'Pause voice message' : 'Play voice message'}
      >
        {isPlaying ? <Pause size={16} fill="white" /> : <Play size={16} fill="white" className="ml-0.5" />}
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
                    ? 'bg-[#00A884]'
                    : isMine
                    ? 'bg-[#111B21]/30 dark:bg-white/30'
                    : 'bg-gray-400 dark:bg-slate-600'
                }`}
              />
            );
          })}
        </div>

        <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-slate-400 font-medium">
          <span>{isPlaying ? formatSecs(currentTime) : formatSecs(totalDuration)}</span>
          <button
            type="button"
            onClick={cycleSpeed}
            className="text-[10px] font-bold bg-black/5 dark:bg-white/10 hover:bg-black/10 px-1.5 py-0.5 rounded-full text-[#111B21] dark:text-slate-200 transition-colors"
          >
            {playbackRate}x
          </button>
        </div>
      </div>
    </div>
  );
};
