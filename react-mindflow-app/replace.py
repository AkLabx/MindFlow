import re

with open('src/features/quiz/components/SavedQuizzes.tsx', 'r') as f:
    content = f.read()

# Remove inline top button
pattern1 = r'''\s*<button\s*onClick=\{\(\) => navigate\('/quiz/config'\)\}\s*className="px-4 py-2\.5 bg-indigo-50.*?<PlusCircle className="w-5 h-5" />\s*Create New Quiz\s*</button>'''

content = re.sub(pattern1, '', content, flags=re.DOTALL)

# Rename Attempted Quizzes to View Attempted quizzes
content = content.replace("Attempted Quizzes", "View Attempted quizzes")

# Rename the central Create Quiz button to Create New Quiz
pattern3 = r'''(<button\s*onClick=\{\(\) => navigate\('/quiz/config'\)\}\s*className="px-6 py-3 bg-indigo-50.*?)Create Quiz(\s*</button>)'''
content = re.sub(pattern3, r'\g<1>Create New Quiz\g<2>', content, flags=re.DOTALL)

with open('src/features/quiz/components/SavedQuizzes.tsx', 'w') as f:
    f.write(content)
