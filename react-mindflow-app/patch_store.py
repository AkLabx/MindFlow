import re

with open('src/features/quiz/stores/useQuizSessionStore.ts', 'r') as f:
    content = f.read()

# Make sure 'enterBlueprints' action exists
if 'enterBlueprints:' not in content:
    content = content.replace('enterConfig: () => void;', 'enterConfig: () => void;\n  enterBlueprints: () => void;')
    content = content.replace("enterConfig: () => set({ status: 'config' }),", "enterConfig: () => set({ status: 'config' }),\n  enterBlueprints: () => set({ status: 'blueprints' as any }),")

with open('src/features/quiz/stores/useQuizSessionStore.ts', 'w') as f:
    f.write(content)
