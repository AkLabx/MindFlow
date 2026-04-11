import re

files_to_patch = ['src/features/quiz/components/GodQuizResult.tsx', 'src/features/quiz/components/MockQuizResult.tsx']

for filepath in files_to_patch:
    with open(filepath, 'r') as f:
        content = f.read()

    # The property on Question is 'question', not 'content.question' nor 'text'
    content = content.replace('{q.content.question}', '{q.question}')

    with open(filepath, 'w') as f:
        f.write(content)
