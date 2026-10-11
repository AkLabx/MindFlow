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
      let styleEl = document.getElementById(styleId);
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

    // 4. Theme: Dark Mode Default Override
    // Only apply if the user hasn't explicitly set a preference, or if admin forces it?
    // Let's make it so if the admin sets 'dark' or 'light', it sets the initial state,
    // but we shouldn't constantly override the user's toggle if they change it.
    // For this task, we will just apply it on mount or preview change, but allow user toggle to win in session.
    const root = document.documentElement;
    const mode = activeConfig.theme?.mode;

    // We get the setting store toggle function just to keep it in sync
    const settingsState = useSettingsStore.getState();

    if (mode === 'dark') {
      root.classList.add('dark');
      useSettingsStore.setState({ isDarkMode: true });
    } else if (mode === 'light') {
      root.classList.remove('dark');
      useSettingsStore.setState({ isDarkMode: false });
    }
    // if 'system', we'd theoretically check media query, but keeping it simple based on existing app logic

  }, [activeConfig.branding, activeConfig.theme]);

  return <>{children}</>;
};
