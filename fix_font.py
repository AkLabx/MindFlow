import re

with open("index.html", "r") as f:
    content = f.read()

# Add Outfit to Google Fonts URL
old_fonts = "family=Crimson+Text:ital,wght@0,400;0,600;0,700;1,400&family=Inter:wght@300;400;500;600;700;800;900&family=Noto+Sans+Devanagari:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Poppins:wght@300;400;500;600;700&display=swap"
new_fonts = "family=Crimson+Text:ital,wght@0,400;0,600;0,700;1,400&family=Inter:wght@300;400;500;600;700;800;900&family=Noto+Sans+Devanagari:wght@400;500;600;700&family=Outfit:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Poppins:wght@300;400;500;600;700&display=swap"
content = content.replace(old_fonts, new_fonts)

# Update tailwind.config
old_tailwind = """          fontFamily: {
            sans: ['Inter', 'sans-serif'],
            // Poppins for English, falling back to Noto Sans Devanagari for mixed content
            poppins: ['Poppins', '"Noto Sans Devanagari"', 'sans-serif'],
            // Specific Hindi font
            hindi: ['"Noto Sans Devanagari"', 'sans-serif'],
          }"""
new_tailwind = """          fontFamily: {
            sans: ['Inter', 'sans-serif'],
            // Poppins for English, falling back to Noto Sans Devanagari for mixed content
            poppins: ['Poppins', '"Noto Sans Devanagari"', 'sans-serif'],
            // Specific Hindi font
            hindi: ['"Noto Sans Devanagari"', 'sans-serif'],
            outfit: ['Outfit', 'sans-serif'],
          }"""
content = content.replace(old_tailwind, new_tailwind)

with open("index.html", "w") as f:
    f.write(content)
