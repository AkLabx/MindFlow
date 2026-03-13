import re

with open('src/features/quiz/components/QuizConfig.tsx', 'r') as f:
    content = f.read()

# Let's check the main wrapper div
# <div className="bg-white dark:bg-gray-800 min-h-screen md:min-h-0 md:h-auto md:rounded-3xl shadow-sm md:border border-gray-200 dark:border-gray-700 flex flex-col max-w-6xl mx-auto animate-fade-in overflow-hidden relative">

print("Wrapper matched:", 'min-h-screen md:min-h-0' in content)
