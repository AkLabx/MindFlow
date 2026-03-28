import re

with open('src/features/auth/components/ProfilePage.tsx', 'r') as f:
    content = f.read()

# Make sure we imported ModeSelector
if "import { ModeSelector }" not in content:
    content = content.replace("import React, { useEffect, useState } from 'react';", "import React, { useEffect, useState } from 'react';\nimport { ModeSelector } from '../../../components/ModeSelector';\n")

# Make sure we import useSettingsStore
if "import { useSettingsStore }" not in content:
    content = content.replace("import { useAuth } from '../context/AuthContext';", "import { useAuth } from '../context/AuthContext';\nimport { useSettingsStore } from '../../../stores/useSettingsStore';\n")

if "const { targetAudience } = useSettingsStore();" not in content:
    content = content.replace("const { user, signOut, session } = useAuth();", "const { user, signOut, session } = useAuth();\n  const { targetAudience } = useSettingsStore();\n")

with open('src/features/auth/components/ProfilePage.tsx', 'w') as f:
    f.write(content)
