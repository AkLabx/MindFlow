import re

with open('vite.config.ts', 'r') as f:
    content = f.read()

# Try to find and increment the VITE_APP_VERSION
match = re.search(r"import\.meta\.env\.VITE_APP_VERSION\s*=\s*'(\d+\.\d+\.\d+)'", content)
if match:
    version_str = match.group(1)
    parts = version_str.split('.')
    parts[2] = str(int(parts[2]) + 1)
    new_version_str = '.'.join(parts)
    content = content.replace(f"import.meta.env.VITE_APP_VERSION = '{version_str}'", f"import.meta.env.VITE_APP_VERSION = '{new_version_str}'")
    with open('vite.config.ts', 'w') as f:
        f.write(content)
