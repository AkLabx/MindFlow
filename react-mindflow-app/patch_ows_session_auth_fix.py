with open("src/features/ows/components/OWSSession.tsx", "r") as f:
    content = f.read()

content = content.replace("export const OWSSession: React.FC<OWSSessionProps> = ({\n  const { user } = useAuth();\n\n  data,", "export const OWSSession: React.FC<OWSSessionProps> = ({\n  data,")
content = content.replace("  onQuit\n}) => {\n", "  onQuit\n}) => {\n  const { user } = useAuth();\n")

with open("src/features/ows/components/OWSSession.tsx", "w") as f:
    f.write(content)
