import re

with open('src/features/quiz/components/LandingPage.tsx', 'r') as f:
    lines = f.readlines()
    for i, line in enumerate(lines):
        if "Sparkles" in line:
            print(f"Line {i+1}: {line}")
