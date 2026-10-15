# Final Investigation Report: "Ask AI Tutor" Failure

## 1. Initial State: The `UNAUTHORIZED_LEGACY_JWT` Blockade
When the issue was first reported, the UI was throwing a `network_error`.
Direct invocation via standard authenticated HTTP requests revealed that the Supabase Edge Function gateway was rejecting the requests entirely with a `401 Unauthorized: UNAUTHORIZED_LEGACY_JWT` error.
**Root Cause:** When the team modified/disabled API keys previously, the project's JWT configuration or Edge Function runtime was rotated, but the `ask-ai-tutor` edge function was never redeployed to pick up the new JWT secret.
**Resolution:** Redeploying the Edge Function successfully refreshed the environment, allowing requests to pass the gateway and execute the code.

## 2. Second Failure: Scheduler `get_execution_plan`
After fixing the gateway, the edge function started returning a 500 error:
`{"success":false,"error":"Scheduler failed or no models available for ask_ai_tutor"}`

By analyzing the `get_execution_plan` source code and adding debug logs directly to the Edge Function, we proved conclusively that:
- The task `ask_ai_tutor` **was successfully found** in `ai_task_config` (bypassing the `Task not found` branch).
- The scheduler successfully reached the model selection query (`WITH ranked_models AS...`).
- The query returned `[]` (zero models), triggering the `No healthy models available for this task` error.

**Root Cause:** The SQL query filters out models where `amr.rpd_exhausted = false`. A check of `ai_model_runtime` revealed that every single API key mapped to `gemini-3.1-flash-lite` had `rpd_exhausted = true`. The scheduler was correctly quarantining them and refusing to attempt connections.
**Resolution:** We manually executed `UPDATE public.ai_model_runtime SET rpd_exhausted = false;` to force the scheduler to retry the keys.

## 3. Third Failure: The Underlying Provider Rejection (429 Quota Exceeded)
With the scheduler unblocked, the Edge Function correctly retrieved the API keys, built the payload, and sent the request to the Google Gemini API.
The fallback loop executed against all 4 configured API keys:
- `GEMINI_API_KEY_FALLBACK_v1`
- `enrich-ques-api_v1`
- `enrich-ques-api-fallback_v1`
- `GEMINI_API_KEY_v1`

For every single key, Google returned:
`Status 429: You exceeded your current quota, please check your plan and billing details.`

**The Provider Lifecycle Verification:**
We verified that the Edge Function correctly handles this failure:
1. It catches the 429 response.
2. It continues the fallback loop until all keys are exhausted.
3. It calls `reportExecution` (which maps to the `report_execution_result` RPC).
4. Inside `report_execution_result`, the logic correctly parses the Google error (`%quota%`), immediately flags the key with `rpd_exhausted = true`, and applies a health penalty.

## 4. Edge Function Secret Verification
To eliminate the possibility that the Edge Function was reading stale or malformed secrets, we deployed a temporary endpoint to echo the masked values of `Deno.env.get(keyName)`.
The results proved that the secrets **are exactly mapped to the correct names** and are successfully injected into the Deno runtime:
```json
{
  "GEMINI_API_KEY_v1": "AQ.Ab...xoewQ",
  "GEMINI_API_KEY_FALLBACK_v1": "AQ.Ab...El8vA",
  "enrich-ques-api_v1": "AQ.Ab...lzS1Q",
  "enrich-ques-api-fallback_v1": "AQ.Ab...tbC6w"
}
```

## Conclusion
The system is behaving exactly as designed. The edge function executes, the scheduler routes traffic, and the governance tables accurately record failures.

**The only remaining issue is entirely external to the codebase and database:** The specific "fresh" Gemini API keys currently installed in the Supabase Edge Function Secrets are genuinely being rejected by Google Cloud for exhausting their quota (likely because they belong to a Free Tier project that has hit its 15 RPD or 15 RPM limit).

**Next Action Required by User:**
1. Log into Google Cloud Console or Google AI Studio.
2. Verify the quota usage and billing status for the projects associated with those 4 API keys.
3. If necessary, generate new keys on a project with available quota, update the Supabase Edge Function Secrets, and run `UPDATE public.ai_model_runtime SET rpd_exhausted = false;` to re-enable them.
