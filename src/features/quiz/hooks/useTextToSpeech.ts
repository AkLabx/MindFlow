import { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';

interface UseTextToSpeechReturn {
  speak: (text: string, languageCode?: string) => Promise<void>;
  stop: () => void;
  isPlaying: boolean;
  isLoading: boolean;
  error: string | null;
}

// Helper to add WAV header to raw PCM data
// Gemini Native Audio is 24kHz, 1 channel, 16-bit PCM (usually)
function addWavHeader(pcmData: Uint8Array, sampleRate: number = 24000, numChannels: number = 1): ArrayBuffer {
  const header = new ArrayBuffer(44);
  const view = new DataView(header);
  const dataLen = pcmData.length;

  // RIFF chunk descriptor
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataLen, true);
  writeString(view, 8, 'WAVE');

  // fmt sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
  view.setUint16(22, numChannels, true); // NumChannels
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, sampleRate * numChannels * 2, true); // ByteRate
  view.setUint16(32, numChannels * 2, true); // BlockAlign
  view.setUint16(34, 16, true); // BitsPerSample

  // data sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataLen, true);

  // Concatenate header and data
  const wavFile = new Uint8Array(header.byteLength + pcmData.byteLength);
  wavFile.set(new Uint8Array(header), 0);
  wavFile.set(pcmData, header.byteLength);

  return wavFile.buffer;
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
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
      console.log('Requesting Gemini Native Audio for:', text.substring(0, 20) + '...');

      const { data, error: functionError } = await supabase.functions.invoke('gemini-tts', {
        body: { text, languageCode },
      });

      if (functionError) {
        console.warn('Supabase Function Invocation Failed:', functionError);
        throw new Error(functionError.message || 'Failed to invoke TTS function');
      }

      if (!data || !data.audioContent) {
        throw new Error('No audio content received from service');
      }

      // Convert base64 to binary
      const binaryString = atob(data.audioContent);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      let audioBlob: Blob;

      // Check if we need to wrap PCM in WAV container
      // The Edge Function returns 'isRawPcm: true' if it detected/assumed PCM
      if (data.isRawPcm || data.mimeType === 'audio/pcm') {
          console.log("Wrapping raw PCM in WAV header (24kHz)...");
          const wavBuffer = addWavHeader(bytes, 24000, 1);
          audioBlob = new Blob([wavBuffer], { type: 'audio/wav' });
      } else {
          // Assume it's already a playable format like MP3
          audioBlob = new Blob([bytes], { type: 'audio/mp3' });
      }

      const url = URL.createObjectURL(audioBlob);

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

    } finally {
      setIsLoading(false);
    }
  }, [stop]);

  return { speak, stop, isPlaying, isLoading, error };
}
