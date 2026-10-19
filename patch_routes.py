import re

with open('src/config/routes.ts', 'r') as f:
    content = f.read()

replacement = """  DASHBOARD: '/dashboard',
  DASHBOARD_SUBJECTS: '/dashboard/subjects',
  FALLBACK: '*',"""

content = re.sub(r"  DASHBOARD: '/dashboard',\n  FALLBACK: '\*',", replacement, content)

with open('src/config/routes.ts', 'w') as f:
    f.write(content)
