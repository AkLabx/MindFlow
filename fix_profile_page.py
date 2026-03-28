import re

with open('src/features/auth/components/ProfilePage.tsx', 'r') as f:
    content = f.read()

# Make sure Megaphone and useNavigate are imported
if 'Megaphone' not in content:
    content = content.replace('LogOut, Settings, ChevronRight, Award, CheckCircle, BarChart,', 'LogOut, Settings, ChevronRight, Award, CheckCircle, BarChart, Megaphone,')

if 'useNavigate' not in content:
    content = content.replace('import { useAuth } from \'../context/AuthContext\';', 'import { useAuth } from \'../context/AuthContext\';\nimport { useNavigate } from \'react-router-dom\';')


# We need to inject the `useNavigate` hook inside the component
# And the new button in the Settings & More section

if 'const navigate = useNavigate();' not in content:
    target = 'const ProfilePage: React.FC<ProfilePageProps> = ({ onSignOut, onNavigateToSettings }) => {'
    replacement = 'const ProfilePage: React.FC<ProfilePageProps> = ({ onSignOut, onNavigateToSettings }) => {\n  const navigate = useNavigate();'
    content = content.replace(target, replacement)


admin_button = """
                  {user?.email === 'admin@mindflow.com' && (
                    <button onClick={() => navigate('/admin/notifications')} className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors group mt-2 border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-900/10">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-800 rounded-lg text-indigo-600 dark:text-indigo-400">
                          <Megaphone className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                          <span className="font-bold text-indigo-700 dark:text-indigo-300 block">Broadcast Notifications</span>
                          <span className="text-xs text-indigo-500 dark:text-indigo-400 block font-medium">Admin Access Only</span>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-indigo-400 group-hover:text-indigo-600 dark:text-indigo-500 dark:group-hover:text-indigo-300 transition-colors" />
                    </button>
                  )}
"""

if "admin@mindflow.com" not in content:
    target2 = '<span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Manage preferences</span>'
    match2 = re.search(r'(<span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Manage preferences</span>\s*</div>\s*</div>\s*<ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300 transition-colors" />\s*</button>)', content)

    if match2:
        content = content.replace(match2.group(1), match2.group(1) + admin_button)


with open('src/features/auth/components/ProfilePage.tsx', 'w') as f:
    f.write(content)
