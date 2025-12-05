import { useState, useRef, useEffect, useCallback } from 'react';

interface UseTextToSpeechReturn {
  speak: (text: string) => Promise<void>;
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

  const speak = useCallback(async (text: string) => {
    // If already playing, stop current
    stop();

    setIsLoading(true);
    setError(null);

    const apiKey = process.env.GOOGLE_AI_KEY;
    if (!apiKey) {
      console.error("GOOGLE_AI_KEY is missing in frontend.");
      setError("Audio service configuration missing.");
      return;
    }

    try {
      console.log('Requesting Gemini Native Audio (Direct) for:', text.substring(0, 20) + '...');

      const model = "gemini-2.5-flash-preview-tts";
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const payload = {
        contents: [{
          parts: [{ text: text }]
        }],
        systemInstruction: {
          parts: [{
            text: `You are a precise Text-to-Speech engine.
        Your ONLY task is to read the user's input exactly as written, word for word.
        1. Do NOT answer the question.
        2. Do NOT provide hints.
        3. Do NOT add conversational filler like "Here is the question."
        4. Maintain a neutral, clear, and professional reading pace.`
          }]
        },
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: "Algenib"
              }
            }
          }
        }
      };

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Gemini API Error (${response.status}):`, errorText);
        throw new Error(`Audio service error (${response.status})`);
      }

      const data = await response.json();
      const part = data.candidates?.[0]?.content?.parts?.[0];

      if (!part || !part.inlineData) {
        throw new Error("No audio data received.");
      }

      const audioBase64 = part.inlineData.data;

      // Convert base64 to binary
      const binaryString = atob(audioBase64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Gemini Native Audio is 24kHz PCM, wrap in WAV
      const wavBuffer = addWavHeader(bytes, 24000, 1);
      const audioBlob = new Blob([wavBuffer], { type: 'audio/wav' });

      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
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
