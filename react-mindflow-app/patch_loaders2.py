import re

files = [
    'src/features/quiz/components/BlueprintPreview.tsx',
    'src/features/quiz/components/BlueprintPreviewWrapper.tsx',
    'src/features/quiz/components/ExamBlueprintsHub.tsx'
]

for file in files:
    with open(file, 'r') as f:
        content = f.read()

    content = content.replace("<CookingLoader />", "<CookingLoader progress={1} syncedItems={1} totalItems={1} />")

    with open(file, 'w') as f:
        f.write(content)
