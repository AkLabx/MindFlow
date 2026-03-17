with open('src/features/ai/chat/ChatInput.tsx', 'r') as f:
    content = f.read()

# Replace background classes with backdrop blur and semi-transparent backgrounds
# Original: className="relative flex w-full flex-col gap-1 rounded-[24px] bg-white dark:bg-slate-800/90 px-4 py-2 ring-1 ring-gray-200 dark:ring-gray-700/50 focus-within:ring-2 focus-within:ring-indigo-500/50 shadow-sm transition-shadow">
target_class = 'className="relative flex w-full flex-col gap-1 rounded-[24px] bg-white dark:bg-slate-800/90 px-4 py-2 ring-1 ring-gray-200 dark:ring-gray-700/50 focus-within:ring-2 focus-within:ring-indigo-500/50 shadow-sm transition-shadow"'
new_class = 'className="relative flex w-full flex-col gap-1 rounded-[24px] bg-white/70 dark:bg-slate-800/70 backdrop-blur-md px-4 py-2 ring-1 ring-gray-200/50 dark:ring-gray-700/50 focus-within:ring-2 focus-within:ring-indigo-500/50 shadow-sm transition-shadow"'

content = content.replace(target_class, new_class)

with open('src/features/ai/chat/ChatInput.tsx', 'w') as f:
    f.write(content)
