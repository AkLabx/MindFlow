with open('src/features/ai/chat/AIChatPage.tsx', 'r') as f:
    content = f.read()

# I mistakenly placed the new state outside the component or it got overwritten.
# Let's check where setIsSettingsOpen is.
import re

# Find: const [isSettingsOpen, setIsSettingsOpen] = useState(false);
pattern = r'(const \[isSettingsOpen, setIsSettingsOpen\] = useState\(false\);)'
replacement = r'\1\n    const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);'

# Only replace once to be safe
content = re.sub(pattern, replacement, content, count=1)

with open('src/features/ai/chat/AIChatPage.tsx', 'w') as f:
    f.write(content)
