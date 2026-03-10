#!/bin/bash
sed -i "s/clipPath: switchingToDark ? clipPath : \[\.\.\.clipPath\]\.reverse(),/clipPath: clipPath,/g" src/context/SettingsContext.tsx
sed -i "s/pseudoElement: switchingToDark/pseudoElement: '::view-transition-new(root)',/g" src/context/SettingsContext.tsx
sed -i "s/            ? '::view-transition-new(root)'//g" src/context/SettingsContext.tsx
sed -i "s/            : '::view-transition-old(root)',//g" src/context/SettingsContext.tsx
