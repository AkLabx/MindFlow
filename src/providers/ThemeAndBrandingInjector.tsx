import React, { useEffect } from 'react';
import { useAppConfigStore } from '../stores/useAppConfigStore';
import { useShallow } from 'zustand/react/shallow';
import { useSettingsStore } from '../stores/useSettingsStore';

// Tiny utility to adjust color brightness for shades
function shadeColor(color: string, percent: number) {
  let R = parseInt(color.substring(1,3),16);
  let G = parseInt(color.substring(3,5),16);
  let B = parseInt(color.substring(5,7),16);

  R = Math.round(R * (100 + percent) / 100);
  G = Math.round(G * (100 + percent) / 100);
  B = Math.round(B * (100 + percent) / 100);

  R = (R<255)?R:255;
  G = (G<255)?G:255;
  B = (B<255)?B:255;

  R = (R>0)?R:0;
  G = (G>0)?G:0;
  B = (B>0)?B:0;

  const RR = ((R.toString(16).length==1)?"0"+R.toString(16):R.toString(16));
  const GG = ((G.toString(16).length==1)?"0"+G.toString(16):G.toString(16));
  const BB = ((B.toString(16).length==1)?"0"+B.toString(16):B.toString(16));

  return "#"+RR+GG+BB;
}

/**
 * Provider that injects dynamic branding and theme customizations
 * directly into the document DOM (title, favicon, root CSS variables).
 */
export const ThemeAndBrandingInjector: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { config, previewConfig, isPreviewing } = useAppConfigStore(useShallow((state) => ({
    config: state.config,
    previewConfig: state.previewConfig,
    isPreviewing: state.previewNonce > 0
  })));

  const activeConfig = (isPreviewing && previewConfig) ? previewConfig as typeof config : config;

  useEffect(() => {
    // 1. Branding: Document Title
    if (activeConfig.branding?.appName) {
      document.title = activeConfig.branding.appName;
    }

    // 2. Theme: Fonts
    if (activeConfig.theme?.fontFamily) {
       // Remove all potential font classes
       document.documentElement.classList.remove('font-sans', 'font-poppins', 'font-serif', 'font-mono');
       // Add the new one
       document.documentElement.classList.add(`font-${activeConfig.theme.fontFamily}`);
    }

    // 3. Theme: Colors (Injecting CSS variables into head)
    if (activeConfig.theme?.primaryColor) {
      const primary = activeConfig.theme.primaryColor;

      const styleId = 'mindflow-theme-styles';
      let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = styleId;
        document.head.appendChild(styleEl);
      }

      // Generate a few shades for tailwind mapping
      const cssVars = `
        :root {
          --color-primary-50: ${shadeColor(primary, 80)};
          --color-primary-100: ${shadeColor(primary, 60)};
          --color-primary-200: ${shadeColor(primary, 40)};
          --color-primary-300: ${shadeColor(primary, 20)};
          --color-primary-400: ${shadeColor(primary, 10)};
          --color-primary-500: ${primary};
          --color-primary-600: ${shadeColor(primary, -10)};
          --color-primary-700: ${shadeColor(primary, -20)};
          --color-primary-800: ${shadeColor(primary, -40)};
          --color-primary-900: ${shadeColor(primary, -60)};
        }
      `;
      styleEl.innerHTML = cssVars;
    }

    // 4. Theme: Dark Mode Default / System Sync
    const root = document.documentElement;
    const mode = activeConfig.theme?.mode;

    if (mode === 'dark') {
      root.classList.add('dark');
      useSettingsStore.setState({ isDarkMode: true });
    } else if (mode === 'light') {
      root.classList.remove('dark');
      useSettingsStore.setState({ isDarkMode: false });
    } else if (mode === 'system' || !mode) {
      // Respect user OS prefers-color-scheme when mode is 'system'
      const prefersDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark');
        useSettingsStore.setState({ isDarkMode: true });
      } else {
        root.classList.remove('dark');
        useSettingsStore.setState({ isDarkMode: false });
      }
    }

  }, [activeConfig.branding, activeConfig.theme]);

  return <>{children}</>;
};
