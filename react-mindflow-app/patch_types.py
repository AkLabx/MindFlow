import re

with open('src/features/quiz/types/store.ts', 'r') as f:
    content = f.read()

if "'blueprints'" not in content:
    content = content.replace("type QuizStatus = 'idle' | 'config'", "type QuizStatus = 'idle' | 'config' | 'blueprints'")

with open('src/features/quiz/types/store.ts', 'w') as f:
    f.write(content)
