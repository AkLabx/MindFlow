with open("src/features/auth/components/AuthPage.tsx", "r") as f:
    content = f.read()

content = content.replace("interface AuthPageProps {\n  onBack?: () => void;\n}\n  onBack: () => void;\n}", "interface AuthPageProps {\n  onBack?: () => void;\n}")

with open("src/features/auth/components/AuthPage.tsx", "w") as f:
    f.write(content)
