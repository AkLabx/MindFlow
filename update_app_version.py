import re

with open('vite.config.ts', 'r') as f:
    content = f.read()

# Very basic version bump for testing. Let's do something simpler if version string exists.
match = re.search(r'process\.env\.VITE_APP_VERSION = "(\d+)\.(\d+)\.(\d+)"', content)
if match:
    major, minor, patch = match.groups()
    new_version = f'{major}.{minor}.{int(patch) + 1}'
    content = re.sub(r'process\.env\.VITE_APP_VERSION = "(\d+)\.(\d+)\.(\d+)"', f'process.env.VITE_APP_VERSION = "{new_version}"', content)
    with open('vite.config.ts', 'w') as f:
        f.write(content)
    print(f"Updated vite.config.ts to version {new_version}")
else:
    print("VITE_APP_VERSION not found in vite.config.ts")
