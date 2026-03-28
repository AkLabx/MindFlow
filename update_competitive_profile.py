import re

with open('src/features/auth/components/ProfilePage.tsx', 'r') as f:
    content = f.read()

# Add ModeSelector import
import_statement = "import { ModeSelector } from '../../../components/ModeSelector';\n"
if "ModeSelector" not in content:
    content = content.replace("import React, { useEffect, useState } from 'react';", "import React, { useEffect, useState } from 'react';\n" + import_statement)

# Locate the space-y-2 inside 4. Settings & More
settings_section = r"""(<div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-4 transition-colors duration-300">\s*<div className="space-y-2">)"""

# Add our Switch button right there using ModeSelector logic
# Since ModeSelector already gives a beautiful dropdown & handles popup + DB,
# we can actually just render the ModeSelector but styled as a full block,
# OR implement the same popup logic specifically.
# Better: Let's extract the confirmation logic to a small local function and add a dedicated button.

new_settings_section = r"""\1
                  {/* Mode Switch Button */}
                  <div className="border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 rounded-xl p-3 flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-slate-200 dark:bg-slate-700 rounded-lg flex items-center justify-center text-slate-700 dark:text-slate-300"><Settings className="w-4 h-4" /></div>
                          <div>
                            <span className="font-bold text-slate-800 dark:text-slate-100 block">App Mode</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">Current: {useSettingsStore.getState().targetAudience === 'school' ? 'School' : 'Competitive'}</span>
                          </div>
                      </div>
                      <ModeSelector />
                  </div>
"""
if "App Mode" not in content:
    content = re.sub(settings_section, new_settings_section, content)

# But wait, we cannot use `useSettingsStore.getState()` cleanly in render if we want reactivity.
# Let's import the hook and call it inside the component.
