import re

with open('src/features/ai/chat/AIChatPage.tsx', 'r') as f:
    content = f.read()

# 1. Add state for autoScroll
state_pattern = r"(const \[isVoiceMenuOpen, setIsVoiceMenuOpen\] = useState\(false\);)"
state_replacement = r"\1\n    const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);\n    const [showScrollButton, setShowScrollButton] = useState(false);\n    const chatScrollContainerRef = useRef<HTMLDivElement>(null);"

content = re.sub(state_pattern, state_replacement, content)

# 2. Add scroll handler
scroll_handler = """
    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const target = e.target as HTMLDivElement;
        const { scrollTop, scrollHeight, clientHeight } = target;
        // Check if user is near the bottom (within 100px)
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;

        setAutoScrollEnabled(isNearBottom);
        setShowScrollButton(!isNearBottom);
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        setAutoScrollEnabled(true);
        setShowScrollButton(false);
    };

    // Auto-scroll logic when new messages arrive or loading state changes
    useEffect(() => {
        if (autoScrollEnabled) {
            // Using a slight delay ensures DOM has updated with new content before scrolling
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 50);
        }
    }, [messages, isLoading, autoScrollEnabled]);
"""

# replace existing scrollToBottom and useEffect
old_scroll = """    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);"""

content = content.replace(old_scroll, scroll_handler)


# 3. Add ref and onScroll to container
container_pattern = r'<div className="flex-1 overflow-y-auto overflow-x-hidden">'
container_replacement = r'<div ref={chatScrollContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto overflow-x-hidden relative scroll-smooth">'
content = content.replace(container_pattern, container_replacement)

# 4. Add floating button
button_html = """
                {/* Scroll to Bottom Button */}
                <AnimatePresence>
                    {showScrollButton && messages.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="absolute bottom-24 left-1/2 -translate-x-1/2 z-40 pointer-events-none"
                        >
                            <button
                                onClick={scrollToBottom}
                                className="pointer-events-auto flex items-center gap-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-full shadow-lg hover:bg-gray-50 dark:hover:bg-slate-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-sm font-medium"
                            >
                                <ArrowLeft className="w-4 h-4 -rotate-90 animate-bounce" />
                                Jump to Bottom
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Input Area */}
"""
content = content.replace('{/* Input Area */}', button_html)


with open('src/features/ai/chat/AIChatPage.tsx', 'w') as f:
    f.write(content)
