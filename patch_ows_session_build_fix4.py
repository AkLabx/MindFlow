with open("src/features/ows/components/OWSSession.tsx", "r") as f:
    content = f.read()

# Fix the JSX fragment wrapper issue
content = content.replace("{currentItem ? (", "{currentItem ? (\n          <>\n")
content = content.replace("          ) : (\n            <div", "          </>\n          ) : (\n            <div")

# Fix onQuit reference which doesn't exist
content = content.replace("onClick={onQuit}", "onClick={onExit}")

with open("src/features/ows/components/OWSSession.tsx", "w") as f:
    f.write(content)
