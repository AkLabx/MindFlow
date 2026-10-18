with open("src/routes/AppRoutes.tsx", "r") as f:
    content = f.read()

# Replace onSignOut callback to clear intent and navigate to '/'
old_str = "onSignOut={() => navigate(ROUTES.DASHBOARD)}"
new_str = "onSignOut={() => { IntentPolicy.clearIntent(); navigate('/'); }}"

content = content.replace(old_str, new_str)

# Add import for IntentPolicy if not present
if "IntentPolicy" not in content[:1000]:
    import_statement = "import { IntentPolicy } from '@/lib/navigation/policies/IntentPolicy';\n"
    content = content.replace("import { RouteAccessType } from '@/lib/navigation/types';\n", "import { RouteAccessType } from '@/lib/navigation/types';\n" + import_statement)

with open("src/routes/AppRoutes.tsx", "w") as f:
    f.write(content)
