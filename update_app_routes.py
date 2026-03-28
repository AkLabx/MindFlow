import re

with open("src/routes/AppRoutes.tsx", "r") as f:
    content = f.read()

# Add SchoolProfile import
profile_import = "const SchoolProfile = lazy(() => import('../features/school/components/SchoolProfile').then(m => ({ default: m.SchoolProfile })));\n"

content = re.sub(
    r"const SchoolDashboard = lazy.*?\n",
    "const SchoolDashboard = lazy(() => import('../features/school/components/SchoolDashboard').then(m => ({ default: m.SchoolDashboard })));\n" + profile_import,
    content
)

# Add route
route_replacement = """                        <Route path="dashboard" element={
                            <Suspense fallback={<SynapticLoader />}>
                                <SchoolDashboard />
                            </Suspense>
                        } />
                        <Route path="profile" element={
                            <Suspense fallback={<SynapticLoader />}>
                                <SchoolProfile />
                            </Suspense>
                        } />"""

content = re.sub(
    r'<Route path="dashboard" element={.*?<SchoolDashboard />.*?</Suspense>.*?} />',
    route_replacement,
    content,
    flags=re.DOTALL
)

with open("src/routes/AppRoutes.tsx", "w") as f:
    f.write(content)
