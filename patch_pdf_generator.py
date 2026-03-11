with open("src/features/tools/quiz-pdf-ppt-generator/QuizPdfPptGenerator.tsx", "r") as f:
    content = f.read()

old_comp = """        <ActiveFiltersBar
          filters={filters}
          onRemoveFilter={removeFilter}
        />"""

new_comp = """        <ActiveFiltersBar
          filters={filters}
          onRemoveFilter={removeFilter}
          onClearAll={() => setFilters(emptyFilters)}
        />"""

if old_comp in content:
    content = content.replace(old_comp, new_comp)
    with open("src/features/tools/quiz-pdf-ppt-generator/QuizPdfPptGenerator.tsx", "w") as f:
        f.write(content)
    print("Successfully patched QuizPdfPptGenerator.")
else:
    print("Error: Could not find the target code in QuizPdfPptGenerator.")
