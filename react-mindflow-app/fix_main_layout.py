with open('src/layouts/MainLayout.tsx', 'r') as f:
    content = f.read()

target = """            ) : (
               <NotificationBell />
              <button
                onClick={onOpenSettings}"""

replacement = """            ) : (
              <div className="flex items-center gap-2">
                <NotificationBell />
                <button
                  onClick={onOpenSettings}"""

content = content.replace(target, replacement)
content = content.replace("""              >
                <Settings className="w-5 h-5" />
              </button>
            )}""", """                >
                  <Settings className="w-5 h-5" />
                </button>
              </div>
            )}""")

with open('src/layouts/MainLayout.tsx', 'w') as f:
    f.write(content)
