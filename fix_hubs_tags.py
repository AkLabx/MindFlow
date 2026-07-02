import os

hubs = [
    'src/features/vocab/idioms/IdiomsHub.tsx',
    'src/features/vocab/ows/OWSHub.tsx',
    'src/features/vocab/synonyms/SynonymsHub.tsx'
]

for file_path in hubs:
    with open(file_path, 'r') as f:
        content = f.read()

    # The issue is an extra `</div>` at the end
    content = content.replace("</div>\n        </div>\n    );\n};", "        </div>\n    );\n};")

    with open(file_path, 'w') as f:
        f.write(content)

print("Tags fixed")
