with open('src/layouts/MainLayout.tsx', 'r') as f:
    content = f.read()

target = """            {user ? (
              <button onClick={() => onTabChange('profile')} className="rounded-full transition-opacity duration-200 hover:opacity-80">
                <img
                  src={user.user_metadata?.avatar_url || `https://api.dicebear.com/6.x/initials/svg?seed=${user.user_metadata?.full_name || user.email}`}
                  alt="User Avatar"
                  className="w-8 h-8 rounded-full"
                />
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <NotificationBell />
                <button
                  onClick={onOpenSettings}
                className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:bg-gray-800 dark:text-slate-400 dark:hover:bg-slate-800 rounded-full transition-colors"
                >
                  <Settings className="w-5 h-5" />
                </button>
              </div>
            )}"""

replacement = """            {user ? (
              <div className="flex items-center gap-2">
                <NotificationBell />
                <button onClick={() => onTabChange('profile')} className="rounded-full transition-opacity duration-200 hover:opacity-80">
                  <img
                    src={user.user_metadata?.avatar_url || `https://api.dicebear.com/6.x/initials/svg?seed=${user.user_metadata?.full_name || user.email}`}
                    alt="User Avatar"
                    className="w-8 h-8 rounded-full"
                  />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenSettings}
                className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:bg-gray-800 dark:text-slate-400 dark:hover:bg-slate-800 rounded-full transition-colors"
              >
                <Settings className="w-5 h-5" />
              </button>
            )}"""

content = content.replace(target, replacement)

with open('src/layouts/MainLayout.tsx', 'w') as f:
    f.write(content)
