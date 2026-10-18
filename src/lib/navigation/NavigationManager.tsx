import React, { useEffect } from 'react';
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
  const { user, loading, profile } = useAuth();
  const location = useLocation();

  if (loading) {
    if (type === RouteAccessType.GUEST_ONLY || type === RouteAccessType.PUBLIC) {
      return <div className="min-h-screen w-full flex items-center justify-center bg-transparent"><SynapticLoader size="lg" /></div>;
    }
    return (
       <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-900"><SynapticLoader size="lg" /></div>
    );
  }

  // --- Synchronous Policy Evaluation ---
  const source = location.pathname;
  let targetRedirect: string | null = null;
  let reason = '';
  let shouldSaveIntent = false;
  let restoredIntent: string | null = null;
  let startedOnboarding = false;

  // 1. Admin Policy
  if (type === RouteAccessType.ADMIN) {
    if (!user) {
      shouldSaveIntent = true;
      targetRedirect = PlatformPolicy.getGuestEntryRoute();
      reason = 'Unauthenticated access to Admin';
    } else if (!AuthPolicy.isAdmin(user, profile)) {
      targetRedirect = '/dashboard';
      reason = 'Non-admin access to Admin';
    }
  }
  // 2. Authenticated Policy
  else if (type === RouteAccessType.AUTHENTICATED || type === RouteAccessType.OFFLINE_CAPABLE) {
    if (!user) {
      shouldSaveIntent = true;
      targetRedirect = PlatformPolicy.getGuestEntryRoute();
      reason = 'Unauthenticated access to Protected Route';
    }
  }
  // 3. Guest Only Policy (Login/Register)
  else if (type === RouteAccessType.GUEST_ONLY) {
    if (user) {
      if (OnboardingPolicy.shouldRedirectToOnboarding(user)) {
         targetRedirect = '/onboarding';
         reason = 'New authenticated user routed directly to Onboarding';
      } else {
        const intent = IntentPolicy.peekIntent();
        if (intent) {
          targetRedirect = intent;
          reason = 'Restoring intent for Authenticated user hitting Guest Route';
          restoredIntent = intent;
        } else {
          targetRedirect = '/dashboard';
          reason = 'Authenticated user hitting Guest Route';
        }
      }
    }
  }
  // 4. Public Policy
  else if (type === RouteAccessType.PUBLIC) {
    if (user) {
      if (OnboardingPolicy.shouldRedirectToOnboarding(user)) {
         targetRedirect = '/onboarding';
         reason = 'New authenticated user routed directly to Onboarding';
      } else {
         targetRedirect = '/dashboard';
         reason = 'Authenticated user hitting Public Route';
      }
    }
  }

  // 5. Onboarding Policy
  if (user && !targetRedirect && location.pathname !== '/onboarding' && type !== RouteAccessType.PUBLIC && type !== RouteAccessType.GUEST_ONLY) {
    if (OnboardingPolicy.shouldRedirectToOnboarding(user)) {
       targetRedirect = '/onboarding';
       reason = 'User has not completed Onboarding';
       startedOnboarding = true;
    }
  }

  // --- Handle Side Effects in useEffect ---
  useEffect(() => {
    if (shouldSaveIntent) {
      IntentPolicy.saveIntent(location);
    }
    if (restoredIntent) {
      IntentPolicy.clearIntent();
      NavigationAnalytics.track('Deep Link Restored', { destination: restoredIntent });
    }
    if (startedOnboarding) {
      NavigationAnalytics.track('Onboarding Started');
    }
    if (targetRedirect && targetRedirect !== location.pathname) {
      NavigationLogger.log(source, reason, targetRedirect);
    }
  }, [shouldSaveIntent, restoredIntent, startedOnboarding, targetRedirect, location, source, reason]);

  // --- Immediate Redirect ---
  if (targetRedirect && targetRedirect !== location.pathname) {
    return <Navigate to={targetRedirect} replace />;
  }

  return <>{children}</>;
};
