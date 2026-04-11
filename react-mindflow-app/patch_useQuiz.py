import re

filepath = 'src/features/quiz/hooks/useQuiz.ts'

with open(filepath, 'r') as f:
    content = f.read()

# Replace the specific line reading time
search_text = "const time = useAnalyticsStore.getState().timeTaken[q.id] || 0;"
replace_text = "const time = results.timeTaken[q.id] || useAnalyticsStore.getState().timeTaken[q.id] || 0;"

if search_text in content:
    content = content.replace(search_text, replace_text)

    with open(filepath, 'w') as f:
        f.write(content)
    print("Successfully patched useQuiz.ts")
else:
    print("Search text not found in useQuiz.ts")
