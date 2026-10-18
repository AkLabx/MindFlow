import re

with open("src/features/auth/components/AuthPage.tsx", "r") as f:
    content = f.read()

# Remove the useEffect hook containing the redirect logic
pattern_useeffect = r"  useEffect\(\(\) => \{\n    console\.log\(\"\[AuthPage Debug\] Rendered AuthPage\. Current user from context:\"(.*?)\}, \[user, navigate, location\.search\]\);\n"
content = re.sub(pattern_useeffect, "", content, flags=re.DOTALL)

# Remove the "Back to Dashboard" button
pattern_button = r"        <button\n         onClick=\{onBack\}\n         className=\"self-start mb-4 z-20 flex items-center justify-center p-2 rounded-full bg-white/50 dark:bg-gray-800/50 hover:bg-white/80 dark:hover:bg-gray-700/80 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 transition-all shadow-sm backdrop-blur-sm border border-white/20 dark:border-gray-700/30\"\n         title=\"Back to Dashboard\"\n        aria-label=\"Go back\">\n         <ArrowLeft className=\"w-5 h-5\" />\n       </button>\n"
content = re.sub(pattern_button, "", content)

with open("src/features/auth/components/AuthPage.tsx", "w") as f:
    f.write(content)
