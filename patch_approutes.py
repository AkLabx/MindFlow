import sys

def patch_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # 1. Add lazy import
    import_statement = "const PrivacyPolicy = lazy(() => import('../pages/PrivacyPolicy').then(m => ({ default: m.PrivacyPolicy })));\n"
    if "const PrivacyPolicy" not in content:
        # Find a good place to insert it, like after AboutUs
        target = "const AboutUs = lazy(() => import('../features/about/components/AboutUs').then(m => ({ default: m.AboutUs })));\n"
        if target in content:
            content = content.replace(target, target + import_statement)
        else:
            print("Failed to find AboutUs import")
            return

    # 2. Add Route inside MainLayout (before Immersive Session Routes)
    route_statement = """
                    <Route path="/privacy-policy" element={
                        <Suspense fallback={<SynapticLoader />}>
                            <PrivacyPolicy />
                        </Suspense>
                    } />
"""
    if "/privacy-policy" not in content:
        # Insert after about route
        target_route = """                    <Route path="/about" element={
                        <Suspense fallback={<SynapticLoader />}>
                            <AboutUs />
                        </Suspense>
                    } />"""
        if target_route in content:
            content = content.replace(target_route, target_route + route_statement)
        else:
            print("Failed to find /about route")
            return

    with open(filepath, 'w') as f:
        f.write(content)

    print("Patched successfully")

if __name__ == "__main__":
    patch_file('src/routes/AppRoutes.tsx')
