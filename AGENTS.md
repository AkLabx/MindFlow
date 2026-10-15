## STRICT GUARDRAIL ON HASH ROUTING & OAUTH

Our app is deployed on GitHub Pages at a subpath (\`https://aklabx.github.io/MindFlow/\`) and wrapped in Capacitor for Android.
1. **DO NOT remove or replace \`<HashRouter>\`** in \`src/App.tsx\`.
2. **DO NOT remove or alter the OAuth hash interception logic** in \`src/hooks/useAppBootstrap.ts\` (where \`access_token\` and \`refresh_token\` are parsed from \`window.location.hash\`, passed to \`supabase.auth.setSession()\`, and cleaned via \`window.history.replaceState\`).
