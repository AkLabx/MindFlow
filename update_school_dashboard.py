import re

with open('src/features/school/components/SchoolDashboard.tsx', 'r') as f:
    content = f.read()

# Add import
if "ModeSelector" not in content:
    content = content.replace("import { useNavigate } from 'react-router-dom';", "import { useNavigate } from 'react-router-dom';\nimport { ModeSelector } from '../../../components/ModeSelector';")

# Replace header block
header_regex = r"""<div className="flex items-center gap-3 mb-4">.*?</div>\s*<h1"""
new_header = r"""<div className="flex items-center gap-3 mb-4">
          <ModeSelector />
        </div>

        <h1"""

content = re.sub(header_regex, new_header, content, flags=re.DOTALL)

with open('src/features/school/components/SchoolDashboard.tsx', 'w') as f:
    f.write(content)
