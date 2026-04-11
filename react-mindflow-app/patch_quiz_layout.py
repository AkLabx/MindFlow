import re

with open('src/features/quiz/QuizLayout.tsx', 'r') as f:
    content = f.read()

# Add ENTER_BLUEPRINTS action to the store types if needed or just handle state navigation
# Actually, wait, let's look at how QuizLayout routes 'status'
