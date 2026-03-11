with open("src/features/quiz/components/QuizConfig.tsx", "r") as f:
    content = f.read()

# Make sure we actually hit the exact formatting of the component
old_comp = """        <ActiveFiltersBar
          filters={filters}
          onRemoveFilter={removeFilter}
        />"""

new_comp = """        <ActiveFiltersBar
          filters={filters}
          onRemoveFilter={removeFilter}
          onClearAll={() => setFilters(emptyFilters)}
        />"""

content = content.replace(old_comp, new_comp)

with open("src/features/quiz/components/QuizConfig.tsx", "w") as f:
    f.write(content)
