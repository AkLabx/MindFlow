import re

with open('src/features/quiz/components/ui/SettingsModal.tsx', 'r') as f:
    content = f.read()

# Add imports
if 'NotificationSettings' not in content:
    content = content.replace(
        "import { ClaymorphismSwitch } from './ClaymorphismSwitch';",
        "import { ClaymorphismSwitch } from './ClaymorphismSwitch';\nimport { NotificationSettings } from '../../../notifications/components/NotificationSettings';"
    )

# Find the place to inject NotificationSettings
# Let's inject it after the PWA install section or before the Close button
inject_point = r'(</div>\s*<div className="mt-8 flex justify-end">)'
match = re.search(inject_point, content)

if match and '<NotificationSettings />' not in content:
    replacement = f"""  <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <NotificationSettings />
          </div>
{match.group(1)}"""
    content = content.replace(match.group(1), replacement)

with open('src/features/quiz/components/ui/SettingsModal.tsx', 'w') as f:
    f.write(content)
