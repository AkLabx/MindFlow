
import { useCallback, useContext, useRef, useEffect } from 'react';
import { SettingsContext } from '../context/SettingsContext';
import { SettingsContextType } from '../features/quiz/types';

export const useQuizSounds = () => {
  const { isSoundEnabled } = useContext(SettingsContext) as SettingsContextType;
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Initialize AudioContext lazily
  const getContext = () => {
    if (!audioCtxRef.current) {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) {
        audioCtxRef.current = new AudioContext();
      }
    }
    // Resume context if suspended (common browser policy requirement)
    if (audioCtxRef.current?.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  // 1. CORRECT (Ding! - Sine Wave)
  const playCorrect = useCallback(() => {
    if (!isSoundEnabled) return;
    const ctx = getContext();
    if (!ctx) return;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // Start at 800Hz, ramp up to 1200Hz for a "cheerful" lift
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);

    // Fade out smoothly
    gain.gain.setValueAtTime(0.1, ctx.currentTime); // Moderate volume
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  }, [isSoundEnabled]);

  // 2. WRONG (Buzzer! - Sawtooth Wave)
  const playWrong = useCallback(() => {
    if (!isSoundEnabled) return;
    const ctx = getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth'; // Harsh sound
    // Start low (150Hz) and drop to 50Hz (sad trombone effect)
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(50, ctx.currentTime + 0.3);

    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  }, [isSoundEnabled]);

  // 3. TICK (Clock Ticking - Square Wave)
  const playTick = useCallback(() => {
    if (!isSoundEnabled) return;
    const ctx = getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Square wave gives a crisp "digital" click
    osc.type = 'square'; 
    
    // High pitch (1000Hz) for a sharp click
    osc.frequency.setValueAtTime(1000, ctx.currentTime);

    // Very short duration (0.05s)
    gain.gain.setValueAtTime(0.05, ctx.currentTime); // Quiet tick
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  }, [isSoundEnabled]);

  return { playCorrect, playWrong, playTick };
};
