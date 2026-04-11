with open("src/types/models.ts", "r") as f:
    content = f.read()

if "deckMode" not in content:
    content = content.replace("readStatus?: ('read' | 'unread')[];", "readStatus?: ('read' | 'unread')[];\n  deckMode?: string[];")

with open("src/types/models.ts", "w") as f:
    f.write(content)
