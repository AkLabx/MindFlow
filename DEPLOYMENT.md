# Deployment Instructions for Gemini TTS Edge Function

## 1. Prerequisites

Ensure you have the Supabase CLI installed and logged in.

## 2. Set Secrets

You need to set the `GOOGLE_AI_KEY` secret in your Supabase project. This key should be a Google Cloud API Key with the "Cloud Text-to-Speech API" enabled.

Run the following command in your terminal:

```bash
supabase secrets set GOOGLE_AI_KEY=your_google_api_key_here
```

## 3. Deploy the Function

Deploy the function to your Supabase project using the following command:

```bash
supabase functions deploy gemini-tts
```

## 4. Verify

Once deployed, the frontend application will be able to call this function securely without exposing your API key.

## Troubleshooting

-   **Error 403/401**: Check if your `GOOGLE_AI_KEY` is valid and has "Cloud Text-to-Speech API" enabled in the Google Cloud Console.
-   **Error 500**: Check the Supabase Edge Function logs in the dashboard for server-side errors.
-   **Model Not Found**: Ensure you are using the correct model name. Currently configured for `gemini-2.5-flash-tts` via the standard Text-to-Speech API endpoint.
