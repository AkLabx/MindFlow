import { SUPABASE_URL } from './supabase';

export const RUNTIME_CONFIG = {
    LIVE_PROXY_URL: 'wss://mindflow-live-proxy.onrender.com',
    CHAT_AI_URL: `${SUPABASE_URL}/functions/v1/chat-ai`,
    TTS_AI_URL: `${SUPABASE_URL}/functions/v1/tts-gateway`,
};
