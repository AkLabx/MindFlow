import re

with open('src/features/quiz/engine/blueprintMath.ts', 'r') as f:
    content = f.read()

content = content.replace("export interface BlueprintNode {", "export interface BlueprintNode {\n  _calculatedCount?: number;")
content = content.replace("distributeByLargestRemainder(targetTotal: number, nodes: { node: BlueprintNode, decimalLimit: number }[]) {", "distributeByLargestRemainder(targetTotal: number, nodes: { node: any, decimalLimit: number }[]) {")
content = content.replace("nodes.forEach(n => {", "nodes.forEach((n: any) => {")

with open('src/features/quiz/engine/blueprintMath.ts', 'w') as f:
    f.write(content)

with open('src/features/quiz/components/BlueprintPreview.tsx', 'r') as f:
    content = f.read()
content = content.replace("<CookingLoader message=", "<CookingLoader ")

with open('src/features/quiz/components/BlueprintPreview.tsx', 'w') as f:
    f.write(content)

with open('src/features/quiz/components/BlueprintPreviewWrapper.tsx', 'r') as f:
    content = f.read()
content = content.replace("<CookingLoader message=", "<CookingLoader ")
with open('src/features/quiz/components/BlueprintPreviewWrapper.tsx', 'w') as f:
    f.write(content)

with open('src/features/quiz/components/ExamBlueprintsHub.tsx', 'r') as f:
    content = f.read()
content = content.replace("<CookingLoader message=", "<CookingLoader ")
with open('src/features/quiz/components/ExamBlueprintsHub.tsx', 'w') as f:
    f.write(content)
