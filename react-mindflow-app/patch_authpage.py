import sys

def patch_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # The issue is `href="/#/privacy-policy"`, which ignores the /MindFlow/ base path in HashRouter.
    # It should just be `href="#/privacy-policy"` relative to the current hash base.

    target_link = '<a href="/#/privacy-policy"'
    replacement = '<a href="#/privacy-policy"'

    if target_link in content:
        content = content.replace(target_link, replacement)
        print("Patched AuthPage privacy policy link successfully")
    else:
        print("Failed to find the target link in AuthPage")

    with open(filepath, 'w') as f:
        f.write(content)

if __name__ == "__main__":
    patch_file('src/features/auth/components/AuthPage.tsx')
