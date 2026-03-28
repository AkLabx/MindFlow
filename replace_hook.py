import os

def replace_in_file(filepath, search, replace):
    with open(filepath, 'r') as f:
        content = f.read()

    content = content.replace(search, replace)

    with open(filepath, 'w') as f:
        f.write(content)

replace_in_file("src/hooks/useQuizSounds.ts",
    "import { SettingsContext } from '../context/SettingsContext';\nimport { SettingsContextType } from '../features/quiz/types';",
    "import { useSettingsStore } from '../stores/useSettingsStore';")

replace_in_file("src/hooks/useQuizSounds.ts",
    "const { isSoundEnabled } = useContext(SettingsContext) as SettingsContextType;",
    "const isSoundEnabled = useSettingsStore(state => state.isSoundEnabled);")

replace_in_file("src/hooks/useSound.ts",
    "import { SettingsContext } from '../context/SettingsContext';\nimport { SettingsContextType } from '../features/quiz/types';",
    "import { useSettingsStore } from '../stores/useSettingsStore';")

replace_in_file("src/hooks/useSound.ts",
    "const { isSoundEnabled } = useContext(SettingsContext) as SettingsContextType;",
    "const isSoundEnabled = useSettingsStore(state => state.isSoundEnabled);")
