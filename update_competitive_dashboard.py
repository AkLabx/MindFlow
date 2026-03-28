import re

with open('src/features/quiz/components/Dashboard.tsx', 'r') as f:
    content = f.read()

# Add import
import_statement = "import { ModeSelector } from '../../../components/ModeSelector';\n"
if "ModeSelector" not in content:
    content = content.replace("import React from 'react';", "import React from 'react';\n" + import_statement)

# Modify Hero Section
hero_section = r"""(<div className="relative text-center max-w-4xl mx-auto mt-6">)"""
new_hero = r"""\1
                    <div className="absolute left-0 top-0 hidden sm:block">
                        <ModeSelector />
                    </div>
                    <div className="flex justify-center mb-6 sm:hidden">
                        <ModeSelector />
                    </div>"""

content = re.sub(hero_section, new_hero, content)

with open('src/features/quiz/components/Dashboard.tsx', 'w') as f:
    f.write(content)
