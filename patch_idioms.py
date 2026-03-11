import re

with open("src/features/idioms/IdiomsConfig.tsx", "r") as f:
    content = f.read()

# We need to make sure we replace the multiline version if it exists
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
    with open("src/features/idioms/IdiomsConfig.tsx", "w") as f:
        f.write(content)
    print("Successfully patched IdiomsConfig.")
else:
    print("Error: Could not find the multiline format in IdiomsConfig.")

    # Try inline format
    if "<ActiveFiltersBar filters={filters} onRemoveFilter={removeFilter} />" in content:
        content = content.replace(
            "<ActiveFiltersBar filters={filters} onRemoveFilter={removeFilter} />",
            "<ActiveFiltersBar filters={filters} onRemoveFilter={removeFilter} onClearAll={() => setFilters(emptyFilters)} />"
        )
        with open("src/features/idioms/IdiomsConfig.tsx", "w") as f:
            f.write(content)
        print("Successfully patched inline IdiomsConfig.")
