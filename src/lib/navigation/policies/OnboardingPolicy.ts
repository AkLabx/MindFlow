import { User } from '@supabase/supabase-js';

// In the future, this should pull from a DB profile column or reliable remote store.
// For now, we use localStorage as requested by current behavior, but structured for scaling.

export type OnboardingStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

export class OnboardingPolicy {

  static getStatus(userId: string): OnboardingStatus {
    const status = localStorage.getItem(`onboarding_status_${userId}`);
    if (status === 'COMPLETED') return 'COMPLETED';
    if (status === 'IN_PROGRESS') return 'IN_PROGRESS';
    return 'NOT_STARTED';
  }

  static markStarted(userId: string): void {
     localStorage.setItem(`onboarding_status_${userId}`, 'IN_PROGRESS');
  }

  static markCompleted(userId: string): void {
    localStorage.setItem(`onboarding_status_${userId}`, 'COMPLETED');
  }

  static shouldRedirectToOnboarding(userId: string | undefined): boolean {
    if (!userId) return false;
    const status = this.getStatus(userId);
    return status !== 'COMPLETED';
  }
}
