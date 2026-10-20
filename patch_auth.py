import re

file_path = "src/features/auth/components/AuthPage.tsx"
with open(file_path, "r") as f:
    content = f.read()

disclaimer_html = """
           <div className="text-center mt-3 mb-6">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                  By continuing, you agree to our <a href="#/about/terms-of-use" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-700 dark:hover:text-gray-300">Terms of Service</a>, <a href="#/privacy-policy" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-700 dark:hover:text-gray-300">Privacy Policy</a> and Cookie Use.
              </p>
           </div>
"""

# Let's split on lines 211/212
lines = content.split('\n')
new_lines = []
for i, line in enumerate(lines):
    new_lines.append(line)
    if i == 211: # This is `           </div>`
        new_lines.extend(disclaimer_html.split('\n')[1:])

new_content = '\n'.join(new_lines)

# Check if replacement was made
if new_content != content:
    with open(file_path, "w") as f:
        f.write(new_content)
    print("Patched successfully")
else:
    print("Failed to patch")
