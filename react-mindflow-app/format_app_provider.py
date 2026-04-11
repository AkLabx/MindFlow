with open("src/providers/AppProvider.tsx", "r") as f:
    content = f.read()

content = content.replace("            <AuthProvider>\n          {children}\n          <ToastContainer />\n          <Popup />\n        </AuthProvider>",
"    <AuthProvider>\n      {children}\n      <ToastContainer />\n      <Popup />\n    </AuthProvider>")

content = content.replace("e.g., SettingsProvider wraps AuthProvider", "e.g., AuthProvider")

with open("src/providers/AppProvider.tsx", "w") as f:
    f.write(content)
