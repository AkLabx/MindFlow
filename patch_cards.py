import re

with open('src/features/quiz/components/Dashboard.tsx', 'r') as f:
    content = f.read()

# Make cards square, change layout to flex-col, left-aligned, remove ChevronRight

def update_card(match):
    full_card = match.group(0)

    # 1. Add square aspect ratio to main div
    # Find the main div classes: className="bg-indigo-50 ... active:border-b flex items-center justify-between ..."
    full_card = re.sub(
        r'className="(.*?) flex items-center justify-between (.*?)"',
        r'className="\1 flex flex-col items-start justify-between aspect-square \2"',
        full_card
    )

    # 2. Update inner flex container (change to flex-col items-start, gap-4 to gap-3, add h-full)
    # <div className={`flex items-center gap-4 flex-1 transition-opacity ...`}>
    full_card = re.sub(
        r'<div className={`flex items-center gap-4 flex-1 transition-opacity (.*?)`}>',
        r'<div className={`flex flex-col items-start gap-3 flex-1 h-full w-full transition-opacity \1`}>',
        full_card
    )

    # 3. Update text container
    # <div className="flex-1 pr-2">
    full_card = re.sub(
        r'<div className="flex-1 pr-2">',
        r'<div className="flex-1 w-full text-left mt-auto flex flex-col justify-end pb-1">',
        full_card
    )

    # Update text sizes specifically for mobile square fit
    full_card = re.sub(
        r'<h3 className="text-lg font-bold',
        r'<h3 className="text-base sm:text-lg font-bold leading-tight',
        full_card
    )

    full_card = re.sub(
        r'<p className="text-gray-600 dark:text-gray-400 text-xs font-medium">',
        r'<p className="text-gray-600 dark:text-gray-400 text-[10px] sm:text-xs font-medium leading-tight mt-1 line-clamp-2">',
        full_card
    )

    # 4. Remove ChevronRight
    full_card = re.sub(
        r'<ChevronRight className={`[^`]+`} />',
        '',
        full_card
    )

    # Also fix col-span for specific cards if any
    full_card = re.sub(r'sm:col-span-2 lg:col-span-1', '', full_card)

    return full_card

# Apply the regex to all cards
# Card pattern: <div onClick={...} className="bg-[color]-50 ... group relative ..."> ... </div>
import re

content = re.sub(
    r'(<div\s+onClick=\{\(\) => handleNavigation[^\n]*\s+className="bg-[a-z]+-50.*?)(?=</div\s*>\s*<div\s+onClick|\{/\* Card|<div className="w-full text-center pb-4">)',
    update_card,
    content,
    flags=re.DOTALL
)

with open('src/features/quiz/components/Dashboard.tsx', 'w') as f:
    f.write(content)
