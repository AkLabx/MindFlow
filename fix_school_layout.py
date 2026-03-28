with open("src/features/school/components/SchoolLayout.tsx", "r") as f:
    content = f.read()

content = content.replace(
    'className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans',
    'className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-outfit'
)

with open("src/features/school/components/SchoolLayout.tsx", "w") as f:
    f.write(content)
