import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_PAYLOAD_SIZE = 100000; // ~100k chars to prevent oversized prompt attacks

interface GovernanceConfig {
    is_enabled: boolean;
    free_daily_limit: number;
    premium_daily_limit: number;
    model_chain: string[];
    cache_enabled: boolean;
}

async function checkQuotaAndConfig(
    supabaseAdmin: SupabaseClient,
    userId: string,
    featureName: string
): Promise<{ config: GovernanceConfig, isPremium: boolean }> {
    const { data, error } = await supabaseAdmin
        .rpc('check_and_increment_ai_quota', {
            p_user_id: userId,
            p_feature: featureName
        });

    if (error) {
        if (error.message.includes('quota_exceeded')) {
            throw new Error("quota_exceeded");
        }
        if (error.message.includes('kill_switch_active')) {
            throw new Error("kill_switch_active");
        }
        console.error(`Quota RPC error for ${featureName}:`, error);
        throw new Error("system_configuration_error");
    }

    if (!data || !data.config) {
        throw new Error("system_configuration_error");
    }

    return {
        config: data.config as GovernanceConfig,
        isPremium: data.isPremium as boolean
    };
}

interface TelemetryData {
    user_id: string | null;
    feature: string;
    provider: string | null;
    model: string | null;
    input_tokens: number;
    output_tokens: number;
    latency_ms: number;
    cache_hit: boolean;
    fallback_depth: number;
    error_type: string | null;
    estimated_cost_usd: number;
    request_type: string;
    response_status: string;
    session_id?: string | null;
}

async function logTelemetry(
    supabaseAdmin: SupabaseClient,
    data: TelemetryData
) {
    try {
        const { error } = await supabaseAdmin
            .from('ai_request_logs')
            .insert({
                user_id: data.user_id,
                feature: data.feature,
                provider: data.provider,
                model: data.model,
                input_tokens: data.input_tokens,
                output_tokens: data.output_tokens,
                latency_ms: data.latency_ms,
                cache_hit: data.cache_hit,
                fallback_depth: data.fallback_depth,
                error_type: data.error_type,
                estimated_cost_usd: data.estimated_cost_usd,
                request_type: data.request_type,
                response_status: data.response_status,
                session_id: data.session_id || null
            });

        if (error) {
            console.error("Failed to insert telemetry log:", error);
        }
    } catch (e) {
        console.error("Telemetry error:", e);
    }
}

interface GeminiRequestOptions {
    apiKey: string;
    model: string;
    body: any;
    signal?: AbortSignal;
}

async function fetchGeminiStream(options: GeminiRequestOptions): Promise<Response> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${options.model}:streamGenerateContent?key=${options.apiKey}&alt=sse`;
    return fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(options.body),
        signal: options.signal
    });
}

async function reportExecution(
    supabaseAdmin: any,
    p_model: string,
    p_api_key_name: string,
    p_status_code: number,
    p_latency_ms: number,
    p_provider_reason: string | null,
    p_provider_message: string | null
) {
    try {
        await supabaseAdmin.rpc('report_execution_result', {
            p_model,
            p_api_key_name,
            p_status_code,
            p_latency_ms,
            p_provider_reason,
            p_provider_message
        });
    } catch (e) {
        console.warn("Failed to report execution result:", e);
    }
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    if (req.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
    }

    let parsedBody: any = {};
    const requestStartTime = Date.now();

    let telemetryData: TelemetryData = {
        user_id: null,
        feature: 'chat',
        provider: 'google',
        model: null,
        input_tokens: 0,
        output_tokens: 0,
        latency_ms: 0,
        cache_hit: false,
        fallback_depth: 0,
        error_type: null,
        estimated_cost_usd: 0,
        request_type: 'streaming',
        response_status: 'failure',
        session_id: null
    };

    let supabaseAdmin: any = null;

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        );

        supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        const { data: { user } } = await supabaseClient.auth.getUser();

        if (!user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 });
        }

        telemetryData.user_id = user.id;

        const textBody = await req.text();
        if (textBody.length > MAX_PAYLOAD_SIZE) {
            return new Response(JSON.stringify({ error: 'Payload too large' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 413 });
        }
        parsedBody = JSON.parse(textBody);
        const { messages, sessionId, requestedModel } = parsedBody;

        if (!messages || !Array.isArray(messages)) {
            return new Response(JSON.stringify({ error: 'Invalid payload: messages required' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
        }

        telemetryData.session_id = sessionId;

        let config;
        try {
            const governanceResult = await checkQuotaAndConfig(supabaseAdmin, user.id, 'chat');
            config = governanceResult.config;
        } catch (error: any) {
            telemetryData.error_type = error.message;
            telemetryData.response_status = 'quota_rejected';
            logTelemetry(supabaseAdmin, telemetryData).catch(() => {});

            return new Response(JSON.stringify({ success: false, error: error.message }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: error.message === 'quota_exceeded' ? 429 : 503,
            });
        }

        const geminiMessages = messages.map((msg: any) => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
        }));

        const systemInstruction = "You are MindFlow AI, a highly adaptive, knowledgeable, and helpful assistant.";
        const requestBody = {
            contents: geminiMessages,
            systemInstruction: { parts: [{ text: systemInstruction }] },
        };

        const { data: planData, error: planError } = await supabaseAdmin.rpc("get_execution_plan", { p_task: 'chat' });

        if (planError || !planData || !planData.success || !planData.models || planData.models.length === 0) {
            throw new Error("Scheduler failed or no models available for chat");
        }

        // Prioritize requested model if available in plan, but keep all healthy candidates as guaranteed fallbacks
        let candidateList = [...planData.models];
        if (requestedModel) {
            const matching = candidateList.filter((c: any) => c.model === requestedModel);
            const others = candidateList.filter((c: any) => c.model !== requestedModel);
            candidateList = [...matching, ...others];
        }

        let geminiResponse: Response | null = null;
        let finalModelUsed = "";

        for (let i = 0; i < candidateList.length; i++) {
            const candidate = candidateList[i];
            const modelToTry = candidate.model;
            const keyName = candidate.api_key_name;

            const apiKey = Deno.env.get(keyName);
            if (!apiKey) {
                console.warn(`API Key mapping not found for logical name: ${keyName}`);
                continue;
            }

            let resStatus = 500;
            let providerReason: string | null = null;
            let providerMessage: string | null = null;
            const reqStart = performance.now();

            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s strict budget per provider

                geminiResponse = await fetchGeminiStream({
                    apiKey: apiKey,
                    model: modelToTry,
                    body: requestBody,
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                resStatus = geminiResponse.status;

                if (geminiResponse.ok) {
                    finalModelUsed = modelToTry;
                    telemetryData.fallback_depth = i;
                    await reportExecution(supabaseAdmin, modelToTry, keyName, resStatus, Math.round(performance.now() - reqStart), null, null);
                    break;
                } else {
                    const errBodyText = await geminiResponse.text();
                    try {
                        const errBody = JSON.parse(errBodyText);
                        if (errBody && errBody.error) {
                            providerMessage = errBody.error.message;
                            providerReason = errBody.error.status;
                        }
                    } catch (_) {
                        providerMessage = errBodyText;
                    }
                    console.warn(`Model ${modelToTry} (${keyName}) failed with status ${resStatus}: ${providerMessage}`);
                }
            } catch (e: any) {
                console.warn(`Model ${modelToTry} (${keyName}) exception: ${e.message}`);
                providerMessage = e.message;
            }

            if (!geminiResponse || !geminiResponse.ok) {
                await reportExecution(supabaseAdmin, modelToTry, keyName, resStatus, Math.round(performance.now() - reqStart), providerReason, providerMessage);
            }
        }

        if (!geminiResponse || !geminiResponse.ok) {
            throw new Error(`All scheduled models failed. Tried ${candidateList.length} candidate(s). Primary requested: ${requestedModel || candidateList[0]?.model}`);
        }

        telemetryData.model = finalModelUsed;
        telemetryData.response_status = 'success';
        telemetryData.latency_ms = Date.now() - requestStartTime;

        logTelemetry(supabaseAdmin, telemetryData).catch(() => {});

        return new Response(geminiResponse.body, {
            headers: {
                ...corsHeaders,
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive'
            },
            status: 200
        });

    } catch (error: any) {
        console.error("Chat Gateway Error:", error);

        if (supabaseAdmin) {
            telemetryData.error_type = error.message.substring(0, 255);
            telemetryData.response_status = 'failure';
            logTelemetry(supabaseAdmin, telemetryData).catch(() => {});
        }

        return new Response(JSON.stringify({ success: false, error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }
});
