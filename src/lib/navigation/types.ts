export enum RouteAccessType {
  PUBLIC = 'PUBLIC', // Anyone can access (e.g., Landing, Terms)
  GUEST_ONLY = 'GUEST_ONLY', // Only unauthenticated users (e.g., Login, Register)
  AUTH_ONLY = 'AUTH_ONLY', // Login required (e.g., Dashboard)
  VERIFIED_ONLY = 'VERIFIED_ONLY', // Login + Email Verified
  PREMIUM = 'PREMIUM', // Login + Subscription
  ADMIN = 'ADMIN', // Admin users only
  OFFLINE = 'OFFLINE', // Specifically offline capable
  EXPERIMENTAL = 'EXPERIMENTAL' // Feature flag controlled
}

export interface SavedIntent {
  pathname: string;
  search: string;
  hash: string;
  timestamp: number;
}
