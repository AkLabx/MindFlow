import re
with open('src/features/auth/components/ProfilePage.tsx', 'r') as f:
    content = f.read()

print("ModeSelector import check:")
print("import { ModeSelector }" in content)
print("useSettingsStore check:")
print("import { useSettingsStore }" in content)
