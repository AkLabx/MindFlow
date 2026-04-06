with open('vite.config.ts', 'r') as f:
    content = f.read()

content = content.replace("registerType: 'autoUpdate',", "registerType: 'prompt',")

with open('vite.config.ts', 'w') as f:
    f.write(content)
