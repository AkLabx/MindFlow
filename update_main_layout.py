import re

with open('src/layouts/MainLayout.tsx', 'r') as f:
    content = f.read()

# Add imports
if 'NotificationBell' not in content:
    content = content.replace(
        "import { ClaymorphismSwitch } from '../features/quiz/components/ui/ClaymorphismSwitch';",
        "import { ClaymorphismSwitch } from '../features/quiz/components/ui/ClaymorphismSwitch';\nimport { NotificationBell } from '../features/notifications/components/NotificationBell';"
    )

# Find the header section to inject the bell
header_search = r'(<button[^>]*onClick=\{onOpenSettings\}[^>]*>[\s\S]*?<Settings className="w-5 h-5" />[\s\S]*?</button>)'
header_match = re.search(header_search, content)

if header_match and '<NotificationBell />' not in content:
    replacement = f"""<NotificationBell />
              {header_match.group(1)}"""
    content = content.replace(header_match.group(1), replacement)

with open('src/layouts/MainLayout.tsx', 'w') as f:
    f.write(content)
