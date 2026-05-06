const fs = require('fs');
const file = 'src/layouts/MainLayout.tsx';
let data = fs.readFileSync(file, 'utf8');

// Import useSocialStore
data = data.replace(
  "import { useSettingsStore } from '../stores/useSettingsStore';",
  "import { useSettingsStore } from '../stores/useSettingsStore';\nimport { useSocialStore } from '../stores/useSocialStore';"
);

// Add isSocialMode extraction
data = data.replace(
  "const { isDarkMode, toggleDarkMode } = useSettingsStore();",
  "const { isDarkMode, toggleDarkMode } = useSettingsStore();\n  const { isSocialMode, toggleSocialMode } = useSocialStore();"
);

// We need to modify the condition to determine if we are in social mode
data = data.replace(
  "const isAIFullScreen = location.pathname.startsWith('/ai/chat') || location.pathname.startsWith('/ai/talk') || location.pathname.startsWith('/tools/text-exporter') || location.pathname.startsWith('/tools/flashcard-maker');",
  "const isAIFullScreen = location.pathname.startsWith('/ai/chat') || location.pathname.startsWith('/ai/talk') || location.pathname.startsWith('/tools/text-exporter') || location.pathname.startsWith('/tools/flashcard-maker');\n  \n  // Auto toggle based on pathname if user lands directly on a social route\n  useEffect(() => {\n    if (location.pathname.startsWith('/community') || location.pathname.startsWith('/messages')) {\n      if (!isSocialMode) toggleSocialMode(true);\n    } else if (isSocialMode && !location.pathname.startsWith('/community') && !location.pathname.startsWith('/messages')) {\n      toggleSocialMode(false);\n    }\n  }, [location.pathname]);\n"
);


fs.writeFileSync(file, data);
