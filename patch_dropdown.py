with open("src/features/quiz/components/ui/MultiSelectDropdown.tsx", "r") as f:
    content = f.read()

old_filter_logic = """  // Filter options based on search term
  const filteredOptions = useMemo(() => {
      if (!searchTerm) return options;
      return options.filter(opt => opt.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [options, searchTerm]);"""

new_filter_logic = """  // Filter options based on search term and sort by availability
  const filteredOptions = useMemo(() => {
      let result = options;
      if (searchTerm) {
          result = options.filter(opt => opt.toLowerCase().includes(searchTerm.toLowerCase()));
      }

      // Sort options: available (count > 0) first, alphabetically within groups
      return [...result].sort((a, b) => {
          const countA = counts?.[a] || 0;
          const countB = counts?.[b] || 0;

          if (countA > 0 && countB === 0) return -1;
          if (countA === 0 && countB > 0) return 1;

          // If both have counts > 0 or both have counts === 0, sort alphabetically
          return a.localeCompare(b);
      });
  }, [options, searchTerm, counts]);"""

if old_filter_logic in content:
    content = content.replace(old_filter_logic, new_filter_logic)
    with open("src/features/quiz/components/ui/MultiSelectDropdown.tsx", "w") as f:
        f.write(content)
    print("Successfully patched MultiSelectDropdown.")
else:
    print("Error: Could not find the target code in MultiSelectDropdown.")
