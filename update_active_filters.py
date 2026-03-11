import re

with open("src/features/quiz/components/ui/ActiveFiltersBar.tsx", "r") as f:
    content = f.read()

# Add onClearAll to props
content = content.replace(
    "onRemoveFilter: (key: keyof InitialFilters, value?: string) => void;",
    "onRemoveFilter: (key: keyof InitialFilters, value?: string) => void;\n  /** Callback to clear all filters. */\n  onClearAll: () => void;"
)

content = content.replace(
    "export const ActiveFiltersBar: React.FC<ActiveFiltersBarProps> = ({ filters, onRemoveFilter }) => {",
    "export const ActiveFiltersBar: React.FC<ActiveFiltersBarProps> = ({ filters, onRemoveFilter, onClearAll }) => {"
)

# Unhide and wire up the Clear All button
old_button = """              <button
                onClick={() => {
                    // We can add a clear all handler in parent, or loop here.
                    // For now relying on parent passing a specific remove function or user clearing one by one,
                    // but usually a "Reset" is available in the footer of Config page.
                }}
                className="text-xs text-gray-400 hover:text-red-500 hidden"
              >
                  Clear All
              </button>"""

new_button = """              <button
                onClick={onClearAll}
                className="text-xs font-semibold text-gray-500 hover:text-red-500 transition-colors"
              >
                  Clear All
              </button>"""

content = content.replace(old_button, new_button)

with open("src/features/quiz/components/ui/ActiveFiltersBar.tsx", "w") as f:
    f.write(content)
