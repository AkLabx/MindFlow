import os

def replace_in_file(filepath, search, replace):
    with open(filepath, 'r') as f:
        content = f.read()

    content = content.replace(search, replace)

    with open(filepath, 'w') as f:
        f.write(content)

# Providers
replace_in_file("src/providers/AppProvider.tsx",
    "import { SettingsProvider } from '../context/SettingsContext';\n",
    "")
replace_in_file("src/providers/AppProvider.tsx",
    "<SettingsProvider>\n",
    "")
replace_in_file("src/providers/AppProvider.tsx",
    "    </SettingsProvider>\n",
    "")

# MainLayout
replace_in_file("src/layouts/MainLayout.tsx",
    "import { SettingsContext } from '../context/SettingsContext';",
    "import { useSettingsStore } from '../stores/useSettingsStore';")
replace_in_file("src/layouts/MainLayout.tsx",
    "const { isDarkMode, toggleDarkMode } = useContext(SettingsContext);",
    "const { isDarkMode, toggleDarkMode } = useSettingsStore();")

# LandingPage
replace_in_file("src/features/quiz/components/LandingPage.tsx",
    "import { SettingsContext } from '../../../context/SettingsContext';",
    "import { useSettingsStore } from '../../../stores/useSettingsStore';")
replace_in_file("src/features/quiz/components/LandingPage.tsx",
    "const { isDarkMode, toggleDarkMode } = useContext(SettingsContext);",
    "const { isDarkMode, toggleDarkMode } = useSettingsStore();")

# SettingsModal
replace_in_file("src/features/quiz/components/ui/SettingsModal.tsx",
    "import { SettingsContext } from '../../../../context/SettingsContext';",
    "import { useSettingsStore } from '../../../../stores/useSettingsStore';")
replace_in_file("src/features/quiz/components/ui/SettingsModal.tsx",
    "  } = useContext(SettingsContext);",
    "  } = useSettingsStore();")

# LearningSession
replace_in_file("src/features/quiz/learning/LearningSession.tsx",
    "import { SettingsContext } from '../../../context/SettingsContext';\nimport { SettingsContextType } from '../types';",
    "import { useSettingsStore } from '../../../stores/useSettingsStore';")
replace_in_file("src/features/quiz/learning/LearningSession.tsx",
    "const { isHapticEnabled } = useContext(SettingsContext) as SettingsContextType;",
    "const isHapticEnabled = useSettingsStore(state => state.isHapticEnabled);")

# MockSession
replace_in_file("src/features/quiz/mock/MockSession.tsx",
    "import { SettingsContext } from '../../../context/SettingsContext';\nimport { SettingsContextType } from '../types';",
    "import { useSettingsStore } from '../../../stores/useSettingsStore';")
replace_in_file("src/features/quiz/mock/MockSession.tsx",
    "const { isHapticEnabled } = useContext(SettingsContext) as SettingsContextType;",
    "const isHapticEnabled = useSettingsStore(state => state.isHapticEnabled);")

# QuizLayout
replace_in_file("src/features/quiz/QuizLayout.tsx",
    "import { SettingsContext } from '../../context/SettingsContext';",
    "import { useSettingsStore } from '../../stores/useSettingsStore';")
replace_in_file("src/features/quiz/QuizLayout.tsx",
    "const { areBgAnimationsEnabled } = useContext(SettingsContext);",
    "const areBgAnimationsEnabled = useSettingsStore(state => state.areBgAnimationsEnabled);")
