import React, { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/context/AuthContext';
import { RouteAccessType } from './types';
import { NavigationPolicy } from './policy';
import { SynapticLoader } from '@/components/ui/SynapticLoader';
import { ErrorState } from '@/components/ui/ErrorState';

interface NavigationManagerProps {
  children: React.ReactNode;
  type: RouteAccessType;
}

const INTENT_STORAGE_KEY = 'mindflow_redirect_intent';

export const NavigationManager: React.FC<NavigationManagerProps> = ({ children, type }) => {
  const { user, loading, profileStatus } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isReady, setIsReady] = useState(false);
  const [redirect, setRedirect] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return; // Wait for auth to initialize

    const checkAccess = () => {
      // 1. Maintenance Check (Placeholder)
      // 2. Version Check (Placeholder)

      // 3. Authorization Logic
      if (type === RouteAccessType.PUBLIC) {
        // Anyone can access (e.g. Landing Page)
        // If authenticated user visits '/', redirect them to dashboard
        if (user && location.pathname === '/') {
           setRedirect(NavigationPolicy.getDefaultAuthRoute());
           return;
        }
        setIsReady(true);
        return;
      }

      if (type === RouteAccessType.GUEST_ONLY) {
        // Only unauthenticated users (e.g. Login, Register)
        if (user) {
          // If we have a saved intent, use it
          const savedIntentStr = sessionStorage.getItem(INTENT_STORAGE_KEY);
          if (savedIntentStr) {
             try {
                const intent = JSON.parse(savedIntentStr);
                // Basic expiration check (e.g., 1 hour)
                if (Date.now() - intent.timestamp < 3600000) {
                    sessionStorage.removeItem(INTENT_STORAGE_KEY);
                    setRedirect(intent.pathname + intent.search + intent.hash);
                    return;
                }
             } catch (e) {
                // Invalid JSON
                sessionStorage.removeItem(INTENT_STORAGE_KEY);
             }
          }
          setRedirect(NavigationPolicy.getDefaultAuthRoute());
          return;
        }
        setIsReady(true);
        return;
      }

      // ALL OTHER ROUTES REQUIRE AUTH
      if (!user) {
         // User is not authenticated, attempting to access protected route
         // Save Intent
         const intent = {
            pathname: location.pathname,
            search: location.search,
            hash: location.hash,
            timestamp: Date.now()
         };
         sessionStorage.setItem(INTENT_STORAGE_KEY, JSON.stringify(intent));
         setRedirect(NavigationPolicy.getDefaultGuestRoute());
         return;
      }

      // User is authenticated.
      // 4. Verification Check (Placeholder)
      // if (type === RouteAccessType.VERIFIED_ONLY && !user.email_confirmed_at) { setRedirect('/verify'); return; }

      // 5. Admin Check
      if (type === RouteAccessType.ADMIN) {
         if (user.email !== 'admin@mindflow.com') {
             setRedirect(NavigationPolicy.getDefaultAuthRoute());
             return;
         }
      }

      // 6. Onboarding / Profile Completion Check
      // Only check on non-onboarding protected routes to prevent loops
      if ((type as any) !== RouteAccessType.PUBLIC && (type as any) !== RouteAccessType.GUEST_ONLY) {
          // Check if onboarding is needed
          const hasSeenOnboarding = localStorage.getItem('mindflow_onboarding_seen');
          if (!hasSeenOnboarding) {
             // In a real app, this might be a dedicated route /onboarding.
             // But according to requirements, we show Onboarding flow AFTER login.
             // The logic for displaying onboarding might reside in a wrapper,
             // but we'll let the component handle it for now, or we can redirect to a specific onboarding route.
             // For now, we will allow it to render, and AppRoutes can handle the overlay if needed,
             // or we redirect to an onboarding route if one exists.
             // We'll just allow it for now as the LandingPage logic was handling it before.
          }
      }

      setIsReady(true);
    };

    checkAccess();
  }, [user, loading, location, type, profileStatus]);


  if (loading || (!isReady && !redirect)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <SynapticLoader size="xl" />
      </div>
    );
  }

  if (redirect) {
    return <Navigate to={redirect} replace />;
  }

  return <>{children}</>;
};
