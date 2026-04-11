import re

files_to_patch = ['src/features/quiz/components/GodQuizResult.tsx', 'src/features/quiz/components/MockQuizResult.tsx']

for filepath in files_to_patch:
    with open(filepath, 'r') as f:
        content = f.read()

    # Fix q.text -> q.content.question (which is standard for this app based on other components)
    content = content.replace('{q.text}', '{q.content.question}')

    # Fix QuizReview props (remove answers if it doesn't accept it, or we can check what QuizReview takes)
    # Let's check QuizReview first

    with open(filepath, 'w') as f:
        f.write(content)
