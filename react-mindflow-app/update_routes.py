import re

with open('src/routes/AppRoutes.tsx', 'r') as f:
    content = f.read()

# Add import
if 'AdminNotifications' not in content:
    import_statement = "const AdminNotifications = lazy(() => import('../features/notifications/admin/AdminNotifications').then(m => ({ default: m.AdminNotifications })));\n"
    # Find a good place to inject the lazy import
    target = r"const AdminDashboard = lazy\(\(\) => import\('\.\./features/auth/components/AdminDashboard'\)\.then\(m => \(\{ default: m\.AdminDashboard \}\)\)\);"

    if re.search(target, content):
        content = re.sub(target, f"const AdminDashboard = lazy(() => import('../features/auth/components/AdminDashboard').then(m => ({{ default: m.AdminDashboard }})));\n{import_statement}", content)
    else:
        # Just append it after SynonymClusterList
        target2 = r"const SynonymClusterList = lazy\(\(\) => import\('\.\./features/synonyms/components/SynonymClusterList'\)\.then\(m => \(\{ default: m\.SynonymClusterList \}\)\)\);"
        content = re.sub(target2, f"const SynonymClusterList = lazy(() => import('../features/synonyms/components/SynonymClusterList').then(m => ({{ default: m.SynonymClusterList }})));\n{import_statement}", content)


# Add route
if '<Route path="/admin/notifications" element={<AdminNotifications />} />' not in content:
    # Find the routes section and inject it before the catch-all
    route_target = r'(</Routes>)'
    replacement = f"""  <Route path="/admin/notifications" element={{
            <Suspense fallback={{<div className="flex h-screen items-center justify-center"><SynapticLoader size="md" /></div>}}>
              <AdminNotifications />
            </Suspense>
          }} />
        {route_target}"""
    content = re.sub(route_target, replacement, content)

with open('src/routes/AppRoutes.tsx', 'w') as f:
    f.write(content)
