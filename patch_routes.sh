#!/bin/bash
sed -i "s/const Dashboard = lazy(() => import('..\/pages\/DashboardPage').then(m => ({ default: m.DashboardPage })));/import { DashboardPage as Dashboard } from '..\/pages\/DashboardPage';/" src/routes/AppRoutes.tsx
sed -i "s/const AuthPage = lazy(() => import('..\/features\/auth\/components\/AuthPage'));/import AuthPage from '..\/features\/auth\/components\/AuthPage';/" src/routes/AppRoutes.tsx
