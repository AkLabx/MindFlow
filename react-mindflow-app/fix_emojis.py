import re

file_path = "src/features/synonyms/SynonymsConfig.tsx"
with open(file_path, "r") as f:
    content = f.read()

# I see the emojis look somewhat small inside the square containers.
# Currently they are `text-2xl`. Let's increase it to `text-3xl` so they pop more,
# and ensure they are centered.
# Also the chevron right was missing in the implementation, I'll add that to match the home screen exactly.

def add_chevron(match):
    before_closing_div = match.group(1)
    chevron_svg = """<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="w-5 h-5 flex-shrink-0 group-hover:translate-x-1 transition-transform opacity-50"><path d="m9 18 6-6-6-6"/></svg>"""
    return f'{before_closing_div}\n                        {chevron_svg}\n                    </div>'

# Add chevron right inside each new card right before the closing div,
# but ONLY if it's the main cards (not the daily challenge which has a start button)

# Fix emojis and add chevrons
replacements = {
    # Phase 1
    r'(text-2xl">\s*📖\s*</div>)': r'text-3xl">\n                                📖\n                            </div>',

    # Flashcards
    r'(text-2xl">\s*🃏\s*</div>)': r'text-3xl">\n                                🃏\n                            </div>',

    # List
    r'(text-2xl">\s*📋\s*</div>)': r'text-3xl">\n                                📋\n                            </div>',

    # Imposter
    r'(text-2xl">\s*🕵️‍♂️\s*</div>)': r'text-3xl">\n                                🕵️‍♂️\n                            </div>',

    # Connect
    r'(text-2xl">\s*🔗\s*</div>)': r'text-3xl">\n                                🔗\n                            </div>',

    # Speed
    r'(text-2xl relative">\s*⚡)': r'text-3xl relative">\n                                ⚡'
}

for old, new in replacements.items():
    content = re.sub(old, new, content)

with open(file_path, "w") as f:
    f.write(content)

print("Fixed emojis.")
