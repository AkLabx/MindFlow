import re

with open('src/features/ai/talk/AITalkPage.tsx', 'r') as f:
    content = f.read()

# Replace min-h-[100dvh] with h-full w-full (since it's now wrapped in a fixed h-[100dvh] container)
content = re.sub(
    r'className="min-h-\[100dvh\]',
    r'className="h-full w-full',
    content
)

with open('src/features/ai/talk/AITalkPage.tsx', 'w') as f:
    f.write(content)

print("AITalkPage patched successfully.")
