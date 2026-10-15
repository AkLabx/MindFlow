import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/context/AuthContext';
import { RouteAccessType } from './types';
import { PlatformPolicy } from './policies/PlatformPolicy';
import { IntentPolicy } from './policies/IntentPolicy';
import { OnboardingPolicy } from './policies/OnboardingPolicy';
import { AuthPolicy } from './policies/AuthPolicy';
import { NavigationLogger } from './utils/logger';
import { NavigationAnalytics } from './utils/analytics';
import { SynapticLoader } from '@/components/ui/SynapticLoader';

interface NavigationManagerProps {
  children: React.ReactNode;
  type: RouteAccessType;
}

export const NavigationManager: React.FC<NavigationManagerProps> = ({ children, type }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  const [isReady, setIsReady] = useState(false);
  const [redirectPath, setRedirectPath] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;

    const evaluatePolicies = () => {
      const source = location.pathname;
      let targetRedirect: string | null = null;
      let reason = '';

      // --- 1. Admin Policy ---
      if (type === RouteAccessType.ADMIN) {
        if (!user) {
          IntentPolicy.saveIntent(location);
          targetRedirect = PlatformPolicy.getGuestEntryRoute();
          reason = 'Unauthenticated access to Admin';
        } else if (!AuthPolicy.isAdmin(user)) {
          targetRedirect = '/dashboard';
          reason = 'Non-admin access to Admin';
        }
      }

      // --- 2. Authenticated Policy ---
      else if (type === RouteAccessType.AUTHENTICATED || type === RouteAccessType.OFFLINE_CAPABLE) {
        if (!user) {
          IntentPolicy.saveIntent(location);
          targetRedirect = PlatformPolicy.getGuestEntryRoute();
          reason = 'Unauthenticated access to Protected Route';
        }
      }

      // --- 3. Guest Only Policy (Login/Register) ---
      else if (type === RouteAccessType.GUEST_ONLY) {
        if (user) {
          // If auth user hits login, see if they have an intent. If so, fulfill it.
          const intent = IntentPolicy.popIntent();
          if (intent) {
            targetRedirect = intent;
            reason = 'Restoring intent for Authenticated user hitting Guest Route';
            NavigationAnalytics.track('Deep Link Restored', { destination: intent });
          } else {
            targetRedirect = '/dashboard';
            reason = 'Authenticated user hitting Guest Route';
          }
        }
      }

      // --- 4. Public Policy ---
      else if (type === RouteAccessType.PUBLIC) {
        if (user) {
          targetRedirect = '/dashboard';
          reason = 'Authenticated user hitting Public Route';
        }
      }

      // --- 5. Onboarding Policy ---
      // We check this AFTER establishing basic auth routing to prevent loops.
      // We do NOT redirect to onboarding if they are already on the onboarding route itself,
      // or if they are hitting a Public/Guest route (where they shouldn't be anyway, but handled above).
      if (user && !targetRedirect && location.pathname !== '/onboarding' && type !== RouteAccessType.PUBLIC && type !== RouteAccessType.GUEST_ONLY) {
        if (OnboardingPolicy.shouldRedirectToOnboarding(user)) {
           targetRedirect = '/onboarding';
           reason = 'User has not completed Onboarding';
           NavigationAnalytics.track('Onboarding Started');
        }
      }

      // --- Commit Decision ---
      if (targetRedirect && targetRedirect !== location.pathname) {
        NavigationLogger.log(source, reason, targetRedirect);
        setRedirectPath(targetRedirect);
      } else {
        setIsReady(true);
      }
    };

    evaluatePolicies();
  }, [user, loading, location, type]);

  if (loading || (!isReady && !redirectPath)) {
    // Return minimal skeleton instead of full SynapticLoader to avoid flashes during rapid redirect evaluation
    return (
       <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-900" />
    );
  }

  if (redirectPath) {
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
};
