import re

with open('src/features/quiz/components/QuizConfig.tsx', 'r') as f:
    content = f.read()

# Replace sticky with fixed and update bottom classes
# Original: className="sticky bottom-0 left-0 w-full z-[40] border-t border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md px-4 py-3 pb-safe md:px-6 md:py-4 shadow-[0_-4px_15px_-5px_rgba(0,0,0,0.1)] dark:shadow-none"
# New: className="fixed bottom-0 left-0 w-full z-[40] border-t border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md px-4 py-3 pb-safe md:px-6 md:py-4 shadow-[0_-4px_15px_-5px_rgba(0,0,0,0.1)] dark:shadow-none"

content = content.replace(
    'className="sticky bottom-0 left-0 w-full z-[40]',
    'className="fixed bottom-0 left-0 w-full z-[40]'
)

# We should also update the padding of the scrolling container to prevent the footer from hiding the last items.
# Original: className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900/50 flex-1 overflow-y-auto"
# New: className="p-6 pb-32 space-y-6 bg-gray-50 dark:bg-gray-900/50 flex-1 overflow-y-auto"

content = content.replace(
    'className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900/50 flex-1 overflow-y-auto"',
    'className="p-6 pb-32 space-y-6 bg-gray-50 dark:bg-gray-900/50 flex-1 overflow-y-auto"'
)

with open('src/features/quiz/components/QuizConfig.tsx', 'w') as f:
    f.write(content)
