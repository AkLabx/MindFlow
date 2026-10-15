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

  static shouldRedirectToOnboarding(user: User | undefined | null): boolean {
    if (!user) return false;

    const status = this.getStatus(user.id);
    if (status === 'COMPLETED') {
        return false;
    }

    if (user.user_metadata?.onboarding_completed === true) {
        this.markCompleted(user.id);
        return false;
    }

    // Check if it's an existing user who just logged in on a new device.
    // If account was created more than 24 hours ago, treat as a legacy user and bypass onboarding.
    if (user.created_at) {
        const createdAt = new Date(user.created_at).getTime();
        const twentyFourHours = 24 * 60 * 60 * 1000;
        const now = Date.now();
        if (now - createdAt > twentyFourHours) {
            // Mark it completed so subsequent fast-path checks just return false.
            this.markCompleted(user.id);
            return false;
        }
    }

    return true;
  }
}
