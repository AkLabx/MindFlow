import re

with open("src/features/ows/components/OWSSession.tsx", "r") as f:
    content = f.read()

# Fix Duplicate imports properly
lines = content.split('\n')
seen = set()
new_lines = []
for line in lines:
    if line.startswith("import { useAuth } from"):
        if line not in seen:
            seen.add(line)
            new_lines.append(line)
    else:
        new_lines.append(line)
content = "\n".join(new_lines)


# Add const { user } = useAuth();
if "const { user } = useAuth();" not in content:
    content = content.replace("const [isFullScreen, setIsFullScreen] = useState(false);", "const { user } = useAuth();\n  const [isFullScreen, setIsFullScreen] = useState(false);")


# Fix onPrevious to be onPrev
content = content.replace("onPrevious()", "onPrev()")

# Ensure Props match AppRoutes
content = content.replace("onPrevious: () => void;\n", "")


with open("src/features/ows/components/OWSSession.tsx", "w") as f:
    f.write(content)
