import re

files_to_patch = ['src/features/quiz/components/GodQuizResult.tsx', 'src/features/quiz/components/MockQuizResult.tsx']

for filepath in files_to_patch:
    with open(filepath, 'r') as f:
        content = f.read()

    # The Button component doesn't accept 'icon'. We should just put the icon inside children or check the actual Button implementation

    with open(filepath, 'w') as f:
        f.write(content)
