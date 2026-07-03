import { supabase } from '../../../lib/supabase';
import { RUNTIME_CONFIG } from '../../../lib/runtimeConfig';

export interface LiveConnectionConfig {
    onMessage: (msg: any) => void;
    onStatusChange: (status: 'disconnected' | 'connecting' | 'connected', reason?: string) => void;
    onError: (err: string) => void;
}

export class LiveConnection {
    private ws: WebSocket | null = null;
    private config: LiveConnectionConfig;
    private pingTimer: number | null = null;

    private retryCount = 0;
    private maxRetries = 6; // 1s, 2s, 4s, 8s, 16s, 32s
    private retryTimer: number | null = null;

    public status: 'disconnected' | 'connecting' | 'connected' = 'disconnected';

    constructor(config: LiveConnectionConfig) {
        this.config = config;
    }

    async connect(isRetry = false) {
        if (!isRetry) {
            this.retryCount = 0;
        }

        if (this.status === 'connected' || (this.status === 'connecting' && !isRetry)) return;
        this.updateStatus('connecting');

        try {
            const { data, error } = await supabase.auth.getSession();
            if (error || !data.session) {
                throw new Error("Authentication required");
            }

            const proxyUrl = RUNTIME_CONFIG.LIVE_PROXY_URL;
            this.ws = new WebSocket(proxyUrl);

            this.ws.onopen = () => {
                this.retryCount = 0; // Reset retries on successful connection
                if (this.retryTimer) {
                    window.clearTimeout(this.retryTimer);
                    this.retryTimer = null;
                }
                this.ws?.send(JSON.stringify({
                    type: 'auth',
                    token: data.session?.access_token
                }));
            };

            this.ws.onmessage = (event) => {
                try {
                    const msg = JSON.parse(event.data);

                    if (msg.type === 'system') {
                        if (msg.status === 'connected' || msg.status === 'reconnected') {
                            this.updateStatus('connected');
                            this.startHeartbeat();
                        } else if (msg.status === 'closed') {
                            this.disconnect(msg.reason);
                        }
                    } else if (msg.type === 'error') {
                        this.config.onError(msg.error);
                        this.disconnect(msg.error);
                    } else if (msg.type === 'ping') {
                        this.ws?.send(JSON.stringify({ type: 'pong' }));
                    } else {
                        this.config.onMessage(msg);
                    }
                } catch (e) {
                    console.error("WebSocket message parse error", e);
                }
            };

            this.ws.onerror = (e) => {
                console.error("WebSocket error", e);
                this.config.onError("Network error occurred.");
            };

            this.ws.onclose = (event) => {
                this.stopHeartbeat();
                if (this.status !== 'disconnected') {
                    // Exponential backoff logic
                    if (this.retryCount < this.maxRetries && event.code !== 1000) { // 1000 is normal closure
                        const timeoutMs = Math.pow(2, this.retryCount) * 1000;
                        console.log(`Live Connection closed. Retrying in ${timeoutMs}ms...`);
                        this.retryCount++;
                        this.retryTimer = window.setTimeout(() => this.connect(true), timeoutMs);
                    } else {
                        this.updateStatus('disconnected', 'Network disconnect');
                    }
                }
            };
        } catch (e: any) {
            this.config.onError(e.message);
            this.updateStatus('disconnected', e.message);
        }
    }

    sendAudioChunk(base64Data: string) {
        if (this.status === 'connected' && this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                realtimeInput: {
                    audio: {
                        mimeType: "audio/pcm;rate=16000",
                        data: base64Data
                    }
                }
            }));
        }
    }

    sendTextMessage(text: string) {
        if (this.status === 'connected' && this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                clientContent: {
                    turns: [{
                        role: "user",
                        parts: [{ text }]
                    }],
                    turnComplete: true
                }
            }));
        }
    }

    private startHeartbeat() {
        this.stopHeartbeat();
        this.pingTimer = window.setInterval(() => {
            if (this.ws?.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({ type: 'ping' }));
            }
        }, 15000);
    }

    private stopHeartbeat() {
        if (this.pingTimer) {
            clearInterval(this.pingTimer);
            this.pingTimer = null;
        }
    }

    disconnect(reason?: string) {
        this.stopHeartbeat();
        if (this.retryTimer) {
            window.clearTimeout(this.retryTimer);
            this.retryTimer = null;
        }
        this.updateStatus('disconnected', reason);
        if (this.ws) {
            this.ws.close(1000); // 1000 = Normal closure, avoids triggering retry
            this.ws = null;
        }
    }

    private updateStatus(newStatus: 'disconnected' | 'connecting' | 'connected', reason?: string) {
        this.status = newStatus;
        this.config.onStatusChange(newStatus, reason);
    }
}
