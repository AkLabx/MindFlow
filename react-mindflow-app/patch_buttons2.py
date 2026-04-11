import re

files_to_patch = ['src/features/quiz/components/GodQuizResult.tsx', 'src/features/quiz/components/MockQuizResult.tsx']

for filepath in files_to_patch:
    with open(filepath, 'r') as f:
        content = f.read()

    # Fix the weird comment-like trailing bracket: <RotateCcw className="w-5 h-5" //>
    content = content.replace('<RotateCcw className="w-5 h-5" //>', '<RotateCcw className="w-5 h-5" />')
    content = content.replace('<Home className="w-5 h-5" //>', '<Home className="w-5 h-5" />')

    with open(filepath, 'w') as f:
        f.write(content)
