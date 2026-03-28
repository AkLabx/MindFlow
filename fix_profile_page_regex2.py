import re

with open('src/features/auth/components/ProfilePage.tsx', 'r') as f:
    content = f.read()

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

target = """                  <button onClick={() => navigate('/profile/support')}"""

content = content.replace(target, admin_button + target)

with open('src/features/auth/components/ProfilePage.tsx', 'w') as f:
    f.write(content)
