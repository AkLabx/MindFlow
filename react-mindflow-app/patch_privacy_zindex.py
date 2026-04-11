import sys

def patch_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Reduce z-index to stay under bottom nav if needed. The header is top sticky.
    if "sticky top-0 z-50 bg-white/80" in content:
        content = content.replace("sticky top-0 z-50 bg-white/80", "sticky top-0 z-40 bg-white/80")

    with open(filepath, 'w') as f:
        f.write(content)

    print("Patched successfully")

if __name__ == "__main__":
    patch_file('src/pages/PrivacyPolicy.tsx')
