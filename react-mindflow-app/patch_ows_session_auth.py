import re
import sys

with open("src/features/ows/components/OWSSession.tsx", "r") as f:
    content = f.read()

auth_import = "import { useAuth } from '../../../features/auth/context/AuthContext';\nimport { Lock } from 'lucide-react';\n"
if "import { useAuth }" not in content:
    content = content.replace("import React,", auth_import + "import React,")

# Add auth check inside OWSSession
auth_hook = "  const { user } = useAuth();\n"

if "const { user } = useAuth();" not in content:
    content = content.replace("export const OWSSession: React.FC<OWSSessionProps> = ({", "export const OWSSession: React.FC<OWSSessionProps> = ({\n" + auth_hook)

auth_overlay = """
      {!user && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center p-6 bg-white/30 dark:bg-slate-900/30 backdrop-blur-md rounded-xl">
          <div className="bg-white/90 dark:bg-slate-800/90 p-8 rounded-2xl shadow-2xl flex flex-col items-center text-center max-w-sm border border-slate-200 dark:border-slate-700">
            <div className="w-16 h-16 bg-teal-100 dark:bg-teal-900/50 rounded-full flex items-center justify-center mb-4">
              <Lock className="w-8 h-8 text-teal-600 dark:text-teal-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Unlock Spatial Swiping</h3>
            <p className="text-slate-600 dark:text-slate-300 text-sm mb-6">
              Sign in to use the Tinder-style swipe engine and permanently track your vocabulary mastery across devices.
            </p>
            <div className="flex gap-3 w-full">
              <Button onClick={onQuit} variant="outline" fullWidth>Back</Button>
              <Button onClick={() => window.location.hash = '#/auth'} className="bg-teal-500 hover:bg-teal-600 text-white" fullWidth>
                Sign In
              </Button>
            </div>
          </div>
        </div>
      )}
"""

if "Unlock Spatial Swiping" not in content:
    # Insert it right inside the container that wraps the card
    content = content.replace(
        '<div className="w-full max-w-2xl mx-auto h-[60vh] min-h-[400px] mb-8 relative perspective-[2000px]">',
        '<div className="w-full max-w-2xl mx-auto h-[60vh] min-h-[400px] mb-8 relative perspective-[2000px]">\n' + auth_overlay
    )


with open("src/features/ows/components/OWSSession.tsx", "w") as f:
    f.write(content)

print("Patched OWSSession.tsx for auth.")
