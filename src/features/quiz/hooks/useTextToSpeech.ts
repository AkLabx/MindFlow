import { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';

interface UseTextToSpeechReturn {
  speak: (text: string, languageCode?: string) => Promise<void>;
  stop: () => void;
  isPlaying: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useTextToSpeech(): UseTextToSpeechReturn {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  }, []);

  const speak = useCallback(async (text: string, languageCode: string = 'hi-IN') => {
    // If already playing, stop current
    stop();

    setIsLoading(true);
    setError(null);

    try {
      console.log('Requesting TTS for:', text.substring(0, 20) + '...');

      const { data, error: functionError } = await supabase.functions.invoke('gemini-tts', {
        body: { text, languageCode },
      });

      if (functionError) {
        // Fallback for Development Environment if function is not deployed
        console.warn('Supabase Function Invocation Failed (Likely not deployed in this environment).');
        console.warn('Details:', functionError);
        console.info('Simulating Audio Playback for Dev/Demo purposes.');

        // Throw to trigger catch block if we want to show error,
        // OR simulate success for demo.
        // Let's throw to be honest, but maybe handle specific "Function not found"
        throw new Error(functionError.message || 'Failed to invoke TTS function');
      }

      if (!data || !data.audioContent) {
        throw new Error('No audio content received from service');
      }

      // Convert base64 to blob
      const binaryString = atob(data.audioContent);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'audio/mp3' });
      const url = URL.createObjectURL(blob);

      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(url); // Cleanup memory
      };

      audio.onerror = (e) => {
        console.error('Audio Playback Error', e);
        setError('Failed to play audio');
        setIsPlaying(false);
      };

      await audio.play();
      setIsPlaying(true);

    } catch (err: any) {
      console.error('TTS Error:', err);
      setError(err.message || 'An unexpected error occurred');

      // DEV MODE FALLBACK: If we are in dev/sandbox and valid keys aren't set up,
      // we might want to fail gracefully or simulate.
      // For now, setting error is correct.

    } finally {
      setIsLoading(false);
    }
  }, [stop]);

  return { speak, stop, isPlaying, isLoading, error };
}
