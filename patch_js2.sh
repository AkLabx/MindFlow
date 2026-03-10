#!/bin/bash
sed -i '/const switchingToDark = !isDarkMode;/d' src/context/SettingsContext.tsx
sed -i '/^\s*$/d' src/context/SettingsContext.tsx
