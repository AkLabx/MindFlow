import re

with open('src/routes/AppRoutes.tsx', 'r') as f:
    content = f.read()

# Add the import
if 'SubjectsPage' not in content:
    content = re.sub(
        r"import { DashboardPage as Dashboard } from '\.\./pages/DashboardPage';",
        "import { DashboardPage as Dashboard } from '../pages/DashboardPage';\nimport { SubjectsPage } from '../features/dashboard';",
        content
    )

# Add the route
route_replacement = """                    <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
                    <Route path={ROUTES.DASHBOARD_SUBJECTS} element={<Suspense fallback={<SynapticLoader />}><SubjectsPage /></Suspense>} />"""

content = re.sub(
    r"<Route path=\{ROUTES\.DASHBOARD\} element=\{<Dashboard />\} />",
    route_replacement,
    content
)

with open('src/routes/AppRoutes.tsx', 'w') as f:
    f.write(content)
