import re

file_path = "src/features/ai/chat/ChatMessage.tsx"
with open(file_path, "r") as f:
    content = f.read()

# 1. Add import for remark-breaks
import_target = "import remarkMath from 'remark-math';"
import_replacement = "import remarkMath from 'remark-math';\nimport remarkBreaks from 'remark-breaks';"

if import_target in content and "import remarkBreaks" not in content:
    content = content.replace(import_target, import_replacement)

# 2. Add remarkBreaks to ReactMarkdown remarkPlugins
plugin_target = "remarkPlugins={[remarkGfm, remarkMath]}"
plugin_replacement = "remarkPlugins={[remarkGfm, remarkMath, remarkBreaks]}"

if plugin_target in content:
    content = content.replace(plugin_target, plugin_replacement)

with open(file_path, "w") as f:
    f.write(content)

print("ChatMessage.tsx patched successfully.")
