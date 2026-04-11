import re

with open("src/features/ai/chat/AIChatPage.tsx", "r") as f:
    content = f.read()

# Locate the header element inside the Live Talk Overlay
# We're looking for: <header className="flex h-14 items-center justify-between border-b border-stone-800 bg-stone-900/80 px-2 sm:px-4 backdrop-blur-sm shrink-0 relative">
search_str = r'<header className="flex h-14 items-center justify-between border-b border-stone-800 bg-stone-900/80 px-2 sm:px-4 backdrop-blur-sm shrink-0 relative">'
replace_str = '<header className="flex h-14 items-center justify-between border-b border-stone-800 bg-stone-900/80 px-2 sm:px-4 backdrop-blur-sm shrink-0 relative z-50">'

if search_str in content:
    content = content.replace(search_str, replace_str)
    with open("src/features/ai/chat/AIChatPage.tsx", "w") as f:
        f.write(content)
    print("Successfully updated the header className.")
else:
    print("Could not find the target header string.")
