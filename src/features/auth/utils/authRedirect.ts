import { Capacitor } from '@capacitor/core';

export const MIN_PASSWORD_LENGTH = 8;

export type AuthRedirectPurpose = 'signup' | 'recovery' | 'oauth';

export interface AuthRedirectOptions {
  isNative?: boolean;
  origin?: string;
  pathname?: string;
}

/**
 * Builds a HashRouter- and Capacitor-safe redirect URL for Supabase Auth emails and OAuth.
 * Supports GitHub Pages subpath (`https://aklabx.github.io/MindFlow/`), localhost, and `mindflow://`.
 */
export const buildAuthRedirectUrl = (
  purpose: AuthRedirectPurpose,
  options?: AuthRedirectOptions
): string => {
  const isNative = options?.isNative ?? Capacitor.isNativePlatform();
  if (isNative) {
    return purpose === 'recovery' ? 'mindflow://reset-password' : 'mindflow://';
  }

  const origin =
    options?.origin ??
    (typeof window !== 'undefined' ? window.location.origin : 'https://aklabx.github.io');
  const rawPathname =
    options?.pathname ??
    (typeof window !== 'undefined' ? window.location.pathname : '/');
  const cleanPath = rawPathname.endsWith('/') ? rawPathname : `${rawPathname}/`;

  if (purpose === 'recovery') {
    return `${origin}${cleanPath}#/reset-password`;
  }
  return `${origin}${cleanPath}#/`;
};

/**
 * Extracts Supabase auth fragment parameters from HashRouter URLs such as:
 * - `#access_token=...&refresh_token=...`
 * - `#/#access_token=...&refresh_token=...`
 * - `#/reset-password#access_token=...&type=recovery`
 */
export const extractAuthHashParams = (currentHash: string): URLSearchParams => {
  if (!currentHash) return new URLSearchParams();
  const lastHashIdx = currentHash.lastIndexOf('#');
  const rawFragment =
    lastHashIdx > 0
      ? currentHash.slice(lastHashIdx + 1)
      : currentHash.replace(/^#\/?#?\/?/, '');
  const cleanFragment = rawFragment.replace(/^\/+/, '');
  return new URLSearchParams(cleanFragment);
};
