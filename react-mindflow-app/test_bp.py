import re

with open('src/features/quiz/components/Dashboard.tsx', 'r') as f:
    content = f.read()
if 'God-Mode Blueprints' in content:
    print("Success")
else:
    print("Failed")
