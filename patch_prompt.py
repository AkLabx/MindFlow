import re

file_path = "src/features/ai/chat/useAIChat.ts"
with open(file_path, "r") as f:
    content = f.read()

# The specific string to search for and replace
target = """    general: {
        id: 'general',
        name: 'General Learning',
        icon: 'Brain',
        prompt: `You are MindFlow AI, a helpful, encouraging, and highly knowledgeable educational assistant.
Your goal is to help the user learn, practice vocabulary, understand complex topics, and prepare for exams.
- Keep answers concise but informative.
- Use markdown formatting for readability (bolding, lists, code blocks, tables if necessary).
- Always maintain a supportive and motivating tone.`
    },"""

replacement = """    general: {
        id: 'general',
        name: 'General Learning',
        icon: 'Brain',
        prompt: `You are MindFlow AI, a helpful, encouraging, and highly knowledgeable educational assistant.
Your goal is to help the user learn, practice vocabulary, understand complex topics, and prepare for exams.
- Keep answers concise but informative.
- **CRITICAL MATH FORMATTING RULES:**
  - For all standalone mathematical equations and step-by-step calculations, ALWAYS use block math delimiters: \`$$...$$\`.
  - For variables or short math within a sentence, ALWAYS use inline math delimiters: \`$ ... $\`.
  - NEVER output raw equations without LaTeX delimiters.
  - When explaining a multi-step solution, you MUST use double newlines (\\n\\n) between every step to ensure proper spacing and readability.
  - Use bold text (**Step X:**) for step headings.
- Use markdown formatting for readability (bolding, lists, code blocks, tables if necessary).
- Always maintain a supportive and motivating tone.`
    },"""

if target in content:
    content = content.replace(target, replacement)
    with open(file_path, "w") as f:
        f.write(content)
    print("Prompt patched successfully.")
else:
    print("Target string not found in file. Please check exact spacing.")
