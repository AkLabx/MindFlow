import re

with open('src/features/ai/chat/AIChatPage.tsx', 'r') as f:
    content = f.read()

# Make sure chatScrollContainerRef is properly placed in the Component (it was put above the functional component definition or inside state block?)
# Let's ensure it's in the right place.
if 'chatScrollContainerRef = useRef<HTMLDivElement>(null)' not in content:
    state_pattern = r"(const \[isVoiceMenuOpen, setIsVoiceMenuOpen\] = useState\(false\);)"
    state_replacement = r"\1\n    const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);\n    const [showScrollButton, setShowScrollButton] = useState(false);\n    const chatScrollContainerRef = useRef<HTMLDivElement>(null);"
    content = re.sub(state_pattern, state_replacement, content)

with open('src/features/ai/chat/AIChatPage.tsx', 'w') as f:
    f.write(content)
