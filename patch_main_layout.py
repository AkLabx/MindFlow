import re

with open('src/layouts/MainLayout.tsx', 'r') as f:
    content = f.read()

# Replace isAIChat declaration to include /ai/talk
content = re.sub(
    r'const isAIChat = location\.pathname\.startsWith\(\'/ai/chat\'\);',
    r"const isAIFullScreen = location.pathname.startsWith('/ai/chat') || location.pathname.startsWith('/ai/talk');",
    content
)

# Replace usage of isAIChat with isAIFullScreen
content = content.replace('isAIChat', 'isAIFullScreen')

with open('src/layouts/MainLayout.tsx', 'w') as f:
    f.write(content)

print("MainLayout patched successfully.")
