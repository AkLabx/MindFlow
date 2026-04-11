import re

files = [
    'src/features/quiz/components/BlueprintPreview.tsx',
    'src/features/quiz/components/BlueprintPreviewWrapper.tsx',
    'src/features/quiz/components/ExamBlueprintsHub.tsx'
]

for file in files:
    with open(file, 'r') as f:
        content = f.read()

    # We replaced `<CookingLoader message="Loading..." />` with `<CookingLoader "Loading..." />`
    # That is invalid JSX. We need `<CookingLoader />`
    content = re.sub(r'<CookingLoader "[^"]*" />', '<CookingLoader />', content)

    with open(file, 'w') as f:
        f.write(content)
