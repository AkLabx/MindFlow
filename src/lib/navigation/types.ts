export enum RouteAccessType {
  PUBLIC = 'PUBLIC',             // Anyone can access (e.g., Landing). Auth users sent to dashboard.
  GUEST_ONLY = 'GUEST_ONLY',     // Only unauth users (e.g., Login). Auth users sent to dashboard.
  AUTHENTICATED = 'AUTHENTICATED', // Login required (e.g., Dashboard). Unauth sent to login.
  EMAIL_VERIFIED = 'EMAIL_VERIFIED', // Login + Email Verified
  PREMIUM = 'PREMIUM',           // Login + Subscription
  ADMIN = 'ADMIN',               // Admin users only
  OFFLINE_CAPABLE = 'OFFLINE_CAPABLE', // Specifically offline capable routes
  EXPERIMENTAL = 'EXPERIMENTAL'  // Feature flag controlled routes
}

export interface RouteMeta {
  path: string;
  accessType: RouteAccessType;
  title?: string;
  analyticsName?: string;
}
