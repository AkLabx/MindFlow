/**
 * Audio Helpers for Gemini Multimodal Live API.
 *
 * CRITICAL REQUIREMENTS:
 * - Google's Gemini Live API requires **input** audio (Microphone) to be 16-bit PCM at 16kHz.
 * - The API **returns** audio (AI Voice) as 16-bit PCM at 24kHz.
 * - Browsers use Float32 arrays for Web Audio. We must manually convert between Float32 and Int16 PCM.
 */

/**
 * Converts a Base64 encoded string from the Server into a Uint8Array byte buffer.
 * Required before decoding the 24kHz PCM audio sent by Gemini.
 *
 * @param base64 - The Base64 string from `message.serverContent.modelTurn.parts[...].inlineData.data`.
 * @returns The resulting Uint8Array.
 */
export function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Converts browser-native Float32 audio data (from the Microphone) to 16-bit PCM ArrayBuffer.
 * This shrinks the dynamic range from [-1.0, 1.0] to [-32768, 32767].
 *
 * @param float32Array - The float audio data captured from the AudioWorklet.
 * @returns The 16-bit PCM buffer ready for encoding.
 */
export function floatTo16BitPCM(float32Array: Float32Array): ArrayBuffer {
  const buffer = new ArrayBuffer(float32Array.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < float32Array.length; i++) {
    let s = Math.max(-1, Math.min(1, float32Array[i]));
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
  return buffer;
}

/**
 * Converts an ArrayBuffer (16-bit PCM) to a Base64 string.
 * This format is required by `session.sendRealtimeInput({ media: { data: base64Data } })`.
 *
 * @param buffer - The buffer to convert.
 * @returns The Base64 string payload.
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * AudioWorklet Processor Code (stored as a string to avoid separate file serving issues).
 *
 * WHY USE A WORKLET?:
 * `ScriptProcessorNode` is deprecated and causes main-thread lag resulting in choppy audio.
 * AudioWorklets run on a separate thread, providing seamless capture of microphone chunks.
 * We accumulate ~2048 samples and send them back to the main thread for encoding.
 */
export const AudioRecorderWorkletCode = `
class RecorderProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.bufferSize = 2048; // Send chunks of ~2048 samples to balance latency/performance
    this.buffer = new Float32Array(this.bufferSize);
    this.index = 0;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (input && input.length > 0) {
      const channelData = input[0];
      for (let i = 0; i < channelData.length; i++) {
        this.buffer[this.index++] = channelData[i];
        if (this.index >= this.bufferSize) {
          // Post full buffer to main thread via MessagePort
          this.port.postMessage(this.buffer);
          this.index = 0;
        }
      }
    }
    // Return true to keep the processor alive
    return true;
  }
}

registerProcessor('recorder-worklet', RecorderProcessor);
`;
