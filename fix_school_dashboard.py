import re

with open("src/features/school/components/SchoolDashboard.tsx", "r") as f:
    content = f.read()

# Add standard dark class usage check
content = content.replace("bg-white dark:bg-slate-800", "bg-white dark:bg-slate-900")
content = content.replace("text-slate-800 dark:text-slate-200", "text-slate-900 dark:text-slate-100")
content = content.replace("border-slate-200 dark:border-slate-700", "border-slate-200 dark:border-slate-800")

with open("src/features/school/components/SchoolDashboard.tsx", "w") as f:
    f.write(content)
