import re

with open('src/features/quiz/stores/useQuizSessionStore.ts', 'r') as f:
    content = f.read()

if 'blueprints' not in content:
    content = content.replace("status: 'idle' | 'config'", "status: 'idle' | 'config' | 'blueprints'")
    with open('src/features/quiz/stores/useQuizSessionStore.ts', 'w') as f:
        f.write(content)
