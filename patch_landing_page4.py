import re

with open('src/features/quiz/components/LandingPage.tsx', 'r') as f:
    content = f.read()

# Add version to the 'v2.0 Live' section
search_str = """            <span className="group-hover:tracking-widest transition-all duration-300">v2.0 Live</span>"""

replace_str = """            <span className="group-hover:tracking-widest transition-all duration-300">v{import.meta.env.VITE_APP_VERSION} Live</span>"""

content = content.replace(search_str, replace_str)

with open('src/features/quiz/components/LandingPage.tsx', 'w') as f:
    f.write(content)
