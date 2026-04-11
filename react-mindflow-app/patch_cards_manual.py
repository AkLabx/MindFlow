import re

with open('src/features/quiz/components/Dashboard.tsx', 'r') as f:
    content = f.read()

# Let's replace each card's structure manually for precision

def process_card(match):
    card_html = match.group(0)

    # 1. Update the outer container class to be a square and use flex-col
    card_html = re.sub(
        r'className="([^"]*?) flex items-center justify-between ([^"]*?)"',
        r'className="\1 flex flex-col items-start justify-between p-4 sm:p-6 aspect-square \2"',
        card_html
    )
    # Remove existing p-6 to avoid conflicts
    card_html = card_html.replace(' p-6 ', ' p-4 sm:p-6 ')

    # Remove col-span classes to make all cards fit grid normally
    card_html = card_html.replace('sm:col-span-2 lg:col-span-1', '')

    # 2. Update the inner container class to be flex-col, full height
    card_html = re.sub(
        r'<div className={`flex items-center gap-4 flex-1 transition-opacity (.*?)`}>',
        r'<div className={`flex flex-col items-start gap-3 w-full h-full transition-opacity \1`}>',
        card_html
    )

    # 3. Update the text container class to fill remaining space and align left
    card_html = re.sub(
        r'<div className="flex-1 pr-2">',
        r'<div className="flex flex-col justify-end h-full w-full text-left mt-2 pb-1">',
        card_html
    )

    # 4. Make text responsive for smaller square cards
    card_html = re.sub(
        r'<h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">',
        r'<h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white leading-tight mb-1 line-clamp-2">',
        card_html
    )
    card_html = re.sub(
        r'<p className="text-gray-600 dark:text-gray-400 text-xs font-medium">',
        r'<p className="text-gray-500 dark:text-gray-400 text-[10px] sm:text-xs font-medium leading-tight line-clamp-2 hidden sm:block">',
        card_html
    )

    # 5. Remove ChevronRight
    card_html = re.sub(
        r'<ChevronRight className={`[^`]+`} />',
        '',
        card_html
    )

    return card_html

# Apply substitution to all cards
# A card starts with `<div` then `onClick={() => handleNavigation`
pattern = r'<div\s+onClick=\{\(\) => handleNavigation.*?</div>\s*</div>'

new_content = re.sub(pattern, process_card, content, flags=re.DOTALL)

with open('src/features/quiz/components/Dashboard.tsx', 'w') as f:
    f.write(new_content)
