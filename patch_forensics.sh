#!/bin/bash

# 1. Patch AppLayout.tsx
sed -i 's/export const AppLayout: React.FC = () => {/export const AppLayout: React.FC = () => {\n    useEffect(() => {\n        console.log("[FORENSIC] AppLayout MOUNTED");\n        return () => console.log("[FORENSIC] AppLayout UNMOUNTED");\n    }, []);\n/g' src/layouts/AppLayout.tsx
sed -i '1i import { useEffect } from "react";' src/layouts/AppLayout.tsx

# 2. Patch AuthPage.tsx
sed -i 's/const AuthPage: React.FC<AuthPageProps> = ({ onBack }) => {/const AuthPage: React.FC<AuthPageProps> = ({ onBack }) => {\n  useEffect(() => {\n    console.log("[FORENSIC] AuthPage MOUNTED");\n    return () => console.log("[FORENSIC] AuthPage UNMOUNTED");\n  }, []);\n/g' src/features/auth/components/AuthPage.tsx

# 3. Patch NavigationManager.tsx
sed -i 's/export const NavigationManager: React.FC<NavigationManagerProps> = ({ children, type }) => {/export const NavigationManager: React.FC<NavigationManagerProps> = ({ children, type }) => {\n  useEffect(() => {\n    console.log(`[FORENSIC] NavigationManager MOUNTED (type: ${type})`);\n    return () => console.log(`[FORENSIC] NavigationManager UNMOUNTED (type: ${type})`);\n  }, [type]);\n/g' src/lib/navigation/NavigationManager.tsx

# 4. Patch BlueIntro.tsx
sed -i 's/const BlueIntro: React.FC<IntroProps> = ({ config, onComplete }) => {/const BlueIntro: React.FC<IntroProps> = ({ config, onComplete }) => {\n  useEffect(() => {\n    console.log("[FORENSIC] BlueIntro MOUNTED");\n    return () => console.log("[FORENSIC] BlueIntro UNMOUNTED");\n  }, []);\n/g' src/features/intro/modules/blue/BlueIntro.tsx

# 5. Patch IntroEngine.tsx
sed -i 's/export const IntroEngine: React.FC<{ children: React.ReactNode }> = ({ children }) => {/export const IntroEngine: React.FC<{ children: React.ReactNode }> = ({ children }) => {\n  useEffect(() => {\n    console.log("[FORENSIC] IntroEngine MOUNTED");\n    return () => console.log("[FORENSIC] IntroEngine UNMOUNTED");\n  }, []);\n/g' src/features/intro/IntroEngine.tsx

# 6. Add Global Probe to App.tsx
sed -i 's/const App: React.FC = () => {/const App: React.FC = () => {\n  useEffect(() => {\n    console.log("[FORENSIC] App MOUNTED");\n    const interval = setInterval(() => {\n      const authPage = document.querySelector(".animate-fade-in");\n      if (authPage) {\n        const computed = window.getComputedStyle(authPage);\n        console.log("[FORENSIC] AuthPage Opacity:", computed.opacity, "Visibility:", computed.visibility, "Display:", computed.display);\n      }\n      const zoomOverlay = document.querySelector(".zoom-overlay");\n      if (zoomOverlay) {\n        const computed = window.getComputedStyle(zoomOverlay);\n        console.log("[FORENSIC] BlueIntro Overlay Opacity:", computed.opacity, "zIndex:", computed.zIndex);\n      }\n      const root = document.getElementById("root");\n      if (root && root.children.length > 0) {\n         console.log("[FORENSIC] Root highest z-index check...");\n      }\n    }, 500);\n    return () => clearInterval(interval);\n  }, []);\n/g' src/App.tsx

echo "Patched for forensics."
