with open("src/features/ows/OWSConfig.tsx", "r") as f:
    content = f.read()

content = content.replace("counts={{}}", "counts={filterCounts.deckMode || {}}")

with open("src/features/ows/OWSConfig.tsx", "w") as f:
    f.write(content)
