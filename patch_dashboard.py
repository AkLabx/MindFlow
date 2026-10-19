import re

with open('src/pages/DashboardPage.tsx', 'r') as f:
    content = f.read()

content = re.sub(
    r"const handleViewAllSubjects = \(\) => \{\n    navigate\(\"/mcqs\"\);\n  \};",
    "const handleViewAllSubjects = () => {\n    navigate(\"/dashboard/subjects\");\n  };",
    content
)

with open('src/pages/DashboardPage.tsx', 'w') as f:
    f.write(content)
