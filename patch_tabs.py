import re

with open('src/components/common/CentralizedTabbedPage.tsx', 'r') as f:
    content = f.read()

# Replace header padding/margins and tab padding to compress
content = re.sub(
    r'<header className="flex flex-col gap-4 mb-4">',
    r'<header className="flex flex-col gap-2 mb-2">',
    content
)

content = re.sub(
    r'px-2 sm:px-4 lg:px-6 py-6',
    r'px-0 py-2',
    content
)

content = re.sub(
    r'z-50 py-2 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8',
    r'z-50 py-1 px-1',
    content
)

content = re.sub(
    r'rounded-xl p-1',
    r'rounded-lg p-0.5',
    content
)

content = re.sub(
    r'gap-2 px-4 py-2\.5 sm:px-6 rounded-lg transition-all text-sm sm:text-base whitespace-nowrap min-w-\[120px\]',
    r'gap-1.5 px-3 py-1.5 rounded-md transition-all text-xs sm:text-sm whitespace-nowrap min-w-[90px]',
    content
)

# Add swipe logic using simple touch events
swipe_logic = """
    // Swipe logic
    const touchStartX = useRef<number | null>(null);
    const minSwipeDistance = 50;

    const onTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
    };

    const onTouchEnd = (e: React.TouchEvent) => {
        if (!touchStartX.current) return;
        const touchEndX = e.changedTouches[0].clientX;
        const distance = touchStartX.current - touchEndX;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe || isRightSwipe) {
            const tabKeys = Object.keys(tabs);
            const currentIndex = tabKeys.indexOf(activeTabKey);

            if (isLeftSwipe && currentIndex < tabKeys.length - 1) {
                handleTabChange(tabKeys[currentIndex + 1]);
            }
            if (isRightSwipe && currentIndex > 0) {
                handleTabChange(tabKeys[currentIndex - 1]);
            }
        }
        touchStartX.current = null;
    };
"""

# Insert swipe logic before return
content = content.replace('const ActiveComponent = tabs[activeTabKey]?.component;', 'const ActiveComponent = tabs[activeTabKey]?.component;\n' + swipe_logic)

# Add touch handlers to content area
content = content.replace(
    '<div className="flex-1 w-full animate-fade-in relative min-h-[400px]">',
    '<div className="flex-1 w-full animate-fade-in relative min-h-[400px]" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>'
)

with open('src/components/common/CentralizedTabbedPage.tsx', 'w') as f:
    f.write(content)

print("Patched CentralizedTabbedPage")
