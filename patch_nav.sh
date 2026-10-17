sed -i 's/import { Outlet } from '"'"'react-router-dom'"'"';//' src/lib/navigation/NavigationManager.tsx
sed -i 's/import { Navigate, useLocation } from '"'"'react-router-dom'"'"';/import { Navigate, useLocation, Outlet } from '"'"'react-router-dom'"'"';/' src/lib/navigation/NavigationManager.tsx
