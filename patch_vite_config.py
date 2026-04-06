with open('vite.config.ts', 'r') as f:
    content = f.read()

content = content.replace("""      define: {
        // Expose environment variables to the client-side code
        // Handles fallback logic to ensure keys are populated
        'process.env.API_KEY': JSON.stringify(env.API_KEY || env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || env.API_KEY),
        'process.env.GOOGLE_AI_KEY': JSON.stringify(env.API_KEY || env.GEMINI_API_KEY),
        'process.env.SUPABASE_URL': JSON.stringify(env.SUPABASE_URL),
        'process.env.SUPABASE_ANON_KEY': JSON.stringify(env.SUPABASE_ANON_KEY)
      },""", """      define: {
        // Expose environment variables to the client-side code
        // Handles fallback logic to ensure keys are populated
        'process.env.API_KEY': JSON.stringify(env.API_KEY || env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || env.API_KEY),
        'process.env.GOOGLE_AI_KEY': JSON.stringify(env.API_KEY || env.GEMINI_API_KEY),
        'process.env.SUPABASE_URL': JSON.stringify(env.SUPABASE_URL),
        'process.env.SUPABASE_ANON_KEY': JSON.stringify(env.SUPABASE_ANON_KEY),
        'import.meta.env.VITE_APP_VERSION': JSON.stringify(process.env.npm_package_version)
      },""")

with open('vite.config.ts', 'w') as f:
    f.write(content)
