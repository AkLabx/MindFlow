import re

with open('src/features/ai/chat/AIChatPage.tsx', 'r') as f:
    content = f.read()

# Refine input container frosted glass in AIChatPage.tsx
old_input_container = """                {/* Input Area */}
                <div className="bg-gradient-to-t from-white via-white to-transparent pt-4 pb-2 dark:from-slate-950 dark:via-slate-950 px-2 shrink-0">"""

new_input_container = """                {/* Input Area */}
                <div className="relative pt-4 pb-2 px-2 shrink-0 before:absolute before:inset-0 before:bg-gradient-to-t before:from-white/95 before:via-white/90 before:to-transparent before:backdrop-blur-md dark:before:from-slate-950/95 dark:before:via-slate-950/90 before:-z-10 z-30 shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.05)] dark:shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.2)]">"""

content = content.replace(old_input_container, new_input_container)

with open('src/features/ai/chat/AIChatPage.tsx', 'w') as f:
    f.write(content)


with open('src/features/ai/chat/ChatInput.tsx', 'r') as f:
    content_input = f.read()

# Enhance input area styling and add transition for height auto-sizing
old_textarea_container = """            <div className="relative flex w-full flex-col gap-1 rounded-[24px] bg-gray-100 dark:bg-slate-800/80 px-4 py-2 focus-within:ring-2 focus-within:ring-indigo-500/50">
                <textarea
                    ref={textareaRef}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask Mindflow"
                    className="max-h-[200px] min-h-[44px] w-full resize-none border-0 bg-transparent py-2 text-gray-900 placeholder:text-gray-500 focus:ring-0 outline-none focus:outline-none dark:text-white dark:placeholder:text-gray-400 sm:text-base leading-relaxed"
                    rows={1}
                    disabled={isLoading || disabled}
                />"""

new_textarea_container = """            <div className="relative flex w-full flex-col gap-1 rounded-[24px] bg-white dark:bg-slate-800/90 px-4 py-2 ring-1 ring-gray-200 dark:ring-gray-700/50 focus-within:ring-2 focus-within:ring-indigo-500/50 shadow-sm transition-shadow">
                <textarea
                    ref={textareaRef}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask MindFlow..."
                    className="max-h-[200px] min-h-[44px] w-full resize-none border-0 bg-transparent py-2 text-gray-900 placeholder:text-gray-500 focus:ring-0 outline-none focus:outline-none dark:text-white dark:placeholder:text-gray-400 sm:text-base leading-relaxed transition-[height] duration-100 ease-out scrollbar-hide"
                    rows={1}
                    disabled={isLoading || disabled}
                />"""

content_input = content_input.replace(old_textarea_container, new_textarea_container)

with open('src/features/ai/chat/ChatInput.tsx', 'w') as f:
    f.write(content_input)
