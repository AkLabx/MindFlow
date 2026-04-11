import re

with open('src/features/quiz/components/ui/SegmentedControl.tsx', 'r') as f:
    content = f.read()

# Replace `flex p-1 bg-gray-100` with `flex flex-wrap p-1 bg-gray-100`
content = content.replace(
    'className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-xl gap-1"',
    'className="flex flex-wrap p-1 bg-gray-100 dark:bg-gray-800 rounded-xl gap-1"'
)

# And we might also want to add min-w-max or min-w-[fit-content] to the button so they wrap correctly, but flex-1 will just wrap when it cannot fit the word.
# Let's see if we need more classes on the buttons to handle wrap nicely. "flex-1 min-w-[80px]" or similar?
# Maybe "flex-auto" or just "flex-1 min-w-fit" or "whitespace-nowrap"

# Let's add whitespace-nowrap to the button text? No, it's just text and span.

with open('src/features/quiz/components/ui/SegmentedControl.tsx', 'w') as f:
    f.write(content)

print("Patched.")
