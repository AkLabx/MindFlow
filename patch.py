import re

with open('src/features/quiz/components/SavedQuizzes.tsx', 'r') as f:
    content = f.read()

# 1. Remove the top inline "Create New Quiz" button.
content = re.sub(
    r'<button\s+onClick=\{\(\)\s*=>\s*navigate\(\'/quiz/config\'\)\}\s+className="px-4 py-2\.5 bg-indigo-50.*?<PlusCircle className="w-5 h-5"\s*/>\s*Create New Quiz\s*</button>',
    '',
    content,
    flags=re.DOTALL
)

# 2. Rename Attempted Quizzes to View Attempted quizzes
content = re.sub(
    r'Attempted Quizzes',
    'View Attempted quizzes',
    content
)

# 3. Rename "Create Quiz" to "Create New Quiz" in the empty state
content = re.sub(
    r'(<button\s+onClick=\{\(\)\s*=>\s*navigate\(\'/quiz/config\'\)\}\s+className="px-6 py-3 bg-indigo-50.*?<PlusCircle className="w-5 h-5"\s*/>\s*)Create Quiz(\s*</button>)',
    r'\1Create New Quiz\2',
    content,
    flags=re.DOTALL
)

with open('src/features/quiz/components/SavedQuizzes.tsx', 'w') as f:
    f.write(content)
