with open("src/features/quiz/components/QuizConfig.tsx", "r") as f:
    content = f.read()

# Add padding to the footer container to push the button up on mobile.
old_footer = """      {/* Footer */}
      <div className="border-t border-gray-200 dark:border-gray-700 dark:border-gray-700 dark:border-slate-800 bg-white dark:bg-gray-800 dark:bg-slate-900 p-6">"""

new_footer = """      {/* Footer */}
      <div className="border-t border-gray-200 dark:border-gray-700 dark:border-gray-700 dark:border-slate-800 bg-white dark:bg-gray-800 dark:bg-slate-900 p-6 pb-24 md:pb-6">"""

if old_footer in content:
    content = content.replace(old_footer, new_footer)
    with open("src/features/quiz/components/QuizConfig.tsx", "w") as f:
        f.write(content)
    print("Successfully patched QuizConfig footer padding.")
else:
    print("Error: Could not find the target code in QuizConfig.")
