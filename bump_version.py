import re

with open('vite.config.ts', 'r') as f:
    content = f.read()

# Usually there is an import.meta.env.VITE_APP_VERSION, but let's check how it's defined
# The memory says: "Every Time You Create a PR update the App Version by Increasing it by 0.0.1 value. In import.meta.env.VITE_APP_VERSION file vite.config.ts ."
