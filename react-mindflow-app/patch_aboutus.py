import sys
import re

def patch_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Add Link import if not present
    if "import { Link, useNavigate } from 'react-router-dom';" not in content and "import { Link } from 'react-router-dom';" not in content:
        content = content.replace("import { useNavigate } from 'react-router-dom';", "import { useNavigate, Link } from 'react-router-dom';")


    # Add Link button in Privacy Policy section
    # Search for: <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Privacy Policy</h2>
    # we want to add a view full policy button.

    target_section = """                        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg">
                            <Shield className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Privacy Policy</h2>"""

    replacement = """                        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg">
                            <Shield className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Privacy Policy</h2>
                        </div>
                        <Link
                            to="/privacy-policy"
                            className="text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 underline underline-offset-2 flex items-center gap-1"
                            aria-label="Read full Privacy Policy"
                        >
                            Read Full Policy
                        </Link>"""

    if target_section in content:
        content = content.replace(target_section, replacement)
    else:
        print("Failed to find Privacy Policy section header in AboutUs")
        return

    with open(filepath, 'w') as f:
        f.write(content)

    print("Patched AboutUs successfully")

if __name__ == "__main__":
    patch_file('src/features/about/components/AboutUs.tsx')
