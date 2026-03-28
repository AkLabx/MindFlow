import re

with open("src/stores/useSettingsStore.ts", "r") as f:
    content = f.read()

# Add new interface properties
interface_replacement = """  targetAudience: 'competitive' | 'school' | null;
  setTargetAudience: (audience: 'competitive' | 'school') => void;

  schoolOnboardingSeen: boolean;
  setSchoolOnboardingSeen: (seen: boolean) => void;
  schoolBoard: string | null;
  setSchoolBoard: (board: string) => void;
  schoolClass: string | null;
  setSchoolClass: (cls: string) => void;
}"""

content = content.replace(
    "  targetAudience: 'competitive' | 'school' | null;\n  setTargetAudience: (audience: 'competitive' | 'school') => void;\n}",
    interface_replacement
)

# Add default values
defaults_replacement = """      // Default values
      isDarkMode: false,
      isSoundEnabled: true,
      isHapticEnabled: true,
      areBgAnimationsEnabled: true,
      targetAudience: null,
      schoolOnboardingSeen: false,
      schoolBoard: null,
      schoolClass: null,"""

content = content.replace(
    "      // Default values\n      isDarkMode: false,\n      isSoundEnabled: true,\n      isHapticEnabled: true,\n      areBgAnimationsEnabled: true,\n      targetAudience: null,",
    defaults_replacement
)

# Add setters
setters_replacement = """      setTargetAudience: (audience) => {
        set({ targetAudience: audience });

        // When setting audience, we also want to optionally sync to DB if user is logged in
        // However, Zustand should mostly handle client-side. We will trigger the DB sync
        // from the component/hook that calls this to avoid cyclic dependencies with Supabase.
      },

      setSchoolOnboardingSeen: (seen) => set({ schoolOnboardingSeen: seen }),
      setSchoolBoard: (board) => set({ schoolBoard: board }),
      setSchoolClass: (cls) => set({ schoolClass: cls })
    }),"""

content = content.replace(
    "      setTargetAudience: (audience) => {\n        set({ targetAudience: audience });\n\n        // When setting audience, we also want to optionally sync to DB if user is logged in\n        // However, Zustand should mostly handle client-side. We will trigger the DB sync\n        // from the component/hook that calls this to avoid cyclic dependencies with Supabase.\n      }\n    }),",
    setters_replacement
)

with open("src/stores/useSettingsStore.ts", "w") as f:
    f.write(content)
