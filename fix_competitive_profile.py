import re

with open('src/features/auth/components/ProfilePage.tsx', 'r') as f:
    content = f.read()

# Make sure we import ModeSelector and useSettingsStore
if "ModeSelector" not in content:
    content = content.replace("import { motion, AnimatePresence } from 'framer-motion';", "import { motion, AnimatePresence } from 'framer-motion';\nimport { ModeSelector } from '../../../components/ModeSelector';\n")

if "useSettingsStore" not in content:
    content = content.replace("import { useAuth } from '../context/AuthContext';", "import { useAuth } from '../context/AuthContext';\nimport { useSettingsStore } from '../../../stores/useSettingsStore';\n")

# Make sure hook is called
hook_call = "const { user, signOut, session } = useAuth();"
new_hook_call = hook_call + "\n  const { targetAudience } = useSettingsStore();"
if "targetAudience" not in content:
    content = content.replace(hook_call, new_hook_call)

# Add Mode selector block inside the settings container
settings_container = r"""(<div className="space-y-2">)"""
mode_block = r"""\1
                  <div className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group mb-2 border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                      <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                              <Target className="w-4 h-4" />
                          </div>
                          <div className="text-left">
                              <span className="font-bold text-slate-700 dark:text-slate-300 block leading-tight">Switch Mode</span>
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">{targetAudience === 'school' ? 'School' : 'Competitive'} Active</span>
                          </div>
                      </div>
                      <ModeSelector />
                  </div>"""
if "Switch Mode" not in content:
    content = re.sub(settings_container, mode_block, content, count=1)

with open('src/features/auth/components/ProfilePage.tsx', 'w') as f:
    f.write(content)
