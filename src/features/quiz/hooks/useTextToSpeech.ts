import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * Hook return interface.
 */
interface UseTextToSpeechReturn {
  /** Function to trigger text-to-speech. */
  speak: (text: string) => Promise<void>;
  /** Function to stop playback immediately. */
  stop: () => void;
  /** Whether audio is currently playing. */
  isPlaying: boolean;
  /** Whether the audio is being fetched/generated. */
  isLoading: boolean;
  /** Error message if generation fails. */
  error: string | null;
}

/**
 * Adds a standard WAV header to raw PCM audio data.
 *
 * The Gemini Native Audio API returns raw PCM data (Linear 16-bit) which browsers
 * cannot play directly via the Audio element without a container format. This function
 * wraps the PCM bytes in a WAV container.
 *
 * @param {Uint8Array} pcmData - The raw PCM audio bytes.
 * @param {number} [sampleRate=24000] - Sample rate in Hz (Gemini defaults to 24kHz).
 * @param {number} [numChannels=1] - Number of channels (Gemini is Mono).
 * @returns {ArrayBuffer} The complete WAV file buffer.
 */
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

/**
 * Helper to write ASCII strings to a DataView.
 */
function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

/**
 * Custom hook for Text-to-Speech using Google's Gemini Native Audio API.
 *
 * This hook bypasses intermediate backends by calling the Gemini API directly from the client.
 * It handles:
 * 1. API authentication (via environment key).
 * 2. Request construction for the `gemini-2.5-flash-preview-tts` model.
 * 3. Base64 decoding of the response.
 * 4. Conversion of raw PCM to WAV format.
 * 5. Audio playback management (Play/Stop/Loading).
 *
 * @returns {UseTextToSpeechReturn} Control methods and state.
 */
export function useTextToSpeech(): UseTextToSpeechReturn {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Cleanup audio on unmount to prevent leaks or background playing
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

      // Confirmed model ID from documentation for TTS
      const model = "gemini-2.5-flash-preview-tts";
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      // Payload structure for Gemini 1.5/2.0 API
      const payload = {
        contents: [{
          parts: [{ text: text }]
        }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: "Algenib" // Specific voice suitable for clear reading
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

      // Gemini Native Audio is 24kHz PCM, wrap in WAV for browser compatibility
      const wavBuffer = addWavHeader(bytes, 24000, 1);
      const audioBlob = new Blob([wavBuffer], { type: 'audio/wav' });

      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl); // Clean up memory
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
