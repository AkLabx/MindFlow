import re

files_to_patch = ['src/features/quiz/components/GodQuizResult.tsx', 'src/features/quiz/components/MockQuizResult.tsx']

for filepath in files_to_patch:
    with open(filepath, 'r') as f:
        content = f.read()

    # The Button component doesn't accept 'icon'. We should just put the icon inside children

    # Old MockQuizResult Button
    # <Button
    #   variant="outline"
    #   onClick={onRestart}
    #   className="flex-1 py-3"
    #   icon={<RotateCcw className="w-5 h-5" />}
    # >
    #   Retake Exam
    # </Button>

    # Needs to be:
    # <Button variant="..." onClick={...} className="... flex items-center justify-center gap-2">
    #   <RotateCcw className="w-5 h-5" /> Retake Exam
    # </Button>

    content = re.sub(
        r'<Button([^>]+)icon=\{<RotateCcw([^>]+)>\}\s*>([^<]+)</Button>',
        r'<Button\1>\n  <span className="flex items-center justify-center gap-2"><RotateCcw\2/>\3</span>\n</Button>',
        content
    )

    content = re.sub(
        r'<Button([^>]+)icon=\{<Home([^>]+)>\}\s*>([^<]+)</Button>',
        r'<Button\1>\n  <span className="flex items-center justify-center gap-2"><Home\2/>\3</span>\n</Button>',
        content
    )

    with open(filepath, 'w') as f:
        f.write(content)
