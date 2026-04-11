import re

with open('src/routes/AppRoutes.tsx', 'r') as f:
    content = f.read()

# I need to wrap BlueprintPreview into a Route that gets the blueprint by ID,
# or better yet, since we have an `ExamBlueprintsHub` which launches it...
# Ah, I built `BlueprintPreview` to accept a `blueprint` prop, but from the hub, we just navigate to `/quiz/blueprint/:id`!
# Let's create a Wrapper for BlueprintPreview
if 'BlueprintPreviewWrapper' not in content:
    wrapper_html = """
const BlueprintPreviewWrapper = lazy(() => import('../features/quiz/components/BlueprintPreviewWrapper').then(m => ({ default: m.BlueprintPreviewWrapper })));
"""
    content = content.replace("const ExamBlueprintsHub = ", wrapper_html + "const ExamBlueprintsHub = ")

    route_html = """
                <Route path="/quiz/blueprint/:id" element={<BlueprintPreviewWrapper />} />
"""
    content = content.replace('<Route path="/blueprints" element={<ExamBlueprintsHub', route_html + '                <Route path="/blueprints" element={<ExamBlueprintsHub')

with open('src/routes/AppRoutes.tsx', 'w') as f:
    f.write(content)
