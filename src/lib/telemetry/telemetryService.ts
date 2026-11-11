/**
 * @file telemetryService.ts
 * @description Centralized, privacy-first diagnostic telemetry engine for MindFlow.
 * Enforces Section 11 of the MindFlow Constitution and dispatches to public.analytics_events.
 */

import { Capacitor } from '@capacitor/core';
import { supabase } from '../supabase';
import { TelemetryEventName, TelemetryPayloads, DeviceTelemetryContext } from './types';

export * from './types';

export type TelemetryRecord = {
  [K in TelemetryEventName]: {
    name: K;
    payload: TelemetryPayloads[K];
    timestamp: number;
  };
}[TelemetryEventName];

// Cache static device context across events within one session
let cachedStaticContext: Partial<DeviceTelemetryContext> | null = null;

function getStaticDeviceContext(): Partial<DeviceTelemetryContext> {
  if (cachedStaticContext) return cachedStaticContext;

  const isNative = Capacitor.isNativePlatform();
  const platform: 'android' | 'web' = isNative ? 'android' : 'web';
  const app_version = import.meta.env.VITE_APP_VERSION || '1.0.0';

  let language = 'en';
  let timezone = 'UTC';

  try {
    language = navigator.language || (navigator as any).userLanguage || 'en';
    timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    // Graceful fallback for restricted environments
  }

  // Parse UTM attribution safely from window.location
  let utm_source: string | undefined;
  let utm_medium: string | undefined;
  let utm_campaign: string | undefined;

  try {
    if (typeof window !== 'undefined' && window.location?.search) {
      const urlParams = new URLSearchParams(window.location.search);
      utm_source = urlParams.get('utm_source') || undefined;
      utm_medium = urlParams.get('utm_medium') || undefined;
      utm_campaign = urlParams.get('utm_campaign') || undefined;
    }
  } catch {
    // Safe ignore
  }

  cachedStaticContext = {
    platform,
    app_version,
    language,
    timezone,
    utm_source,
    utm_medium,
    utm_campaign,
    referrer: typeof document !== 'undefined' && document.referrer ? document.referrer : undefined,
  };

  return cachedStaticContext;
}

function getDynamicContext(): Record<string, any> {
  const width = typeof window !== 'undefined' ? window.innerWidth : 0;
  const height = typeof window !== 'undefined' ? window.innerHeight : 0;
  const screenWidth = typeof screen !== 'undefined' ? screen.width : 0;
  const screenHeight = typeof screen !== 'undefined' ? screen.height : 0;
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const touchCapable = typeof navigator !== 'undefined' ? (navigator.maxTouchPoints > 0) : false;

  const connection = (navigator as any)?.connection || (navigator as any)?.mozConnection || (navigator as any)?.webkitConnection;
  const network_type = connection?.effectiveType || connection?.type || undefined;

  let orientation = 'unknown';
  try {
    if (typeof screen !== 'undefined' && screen.orientation) {
      orientation = screen.orientation.type;
    } else if (typeof window !== 'undefined') {
      orientation = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
    }
  } catch {
    // Safe ignore
  }

  return {
    viewport: `${width}x${height}`,
    screen_resolution: `${screenWidth}x${screenHeight}`,
    device_pixel_ratio: dpr,
    orientation,
    touch_capable: touchCapable,
    network_type,
  };
}

class TelemetryService {
  private buffer: TelemetryRecord[] = [];
  private maxBufferSize = 50;

  /**
   * Emits a privacy-first diagnostic event.
   * Records to in-memory buffer and dispatches asynchronously to Supabase public.analytics_events.
   */
  emit<K extends TelemetryEventName>(name: K, payload: TelemetryPayloads[K]): void {
    const sanitized = this.sanitizePayload(payload);
    const record = {
      name,
      payload: sanitized,
      timestamp: Date.now(),
    } as TelemetryRecord;

    // Maintain in-memory ring buffer for runtime diagnostics
    this.buffer.push(record);
    if (this.buffer.length > this.maxBufferSize) {
      this.buffer.shift();
    }

    if (import.meta.env.DEV) {
      console.log(`%c[Telemetry] ${name}`, 'color: #6366F1; font-weight: bold;', sanitized);
    }

    // Dispatch to Supabase analytics_events asynchronously
    this.dispatchToRemote(name, sanitized);
  }

  /**
   * Dispatches event to public.analytics_events in a fire-and-forget, non-blocking manner.
   */
  private dispatchToRemote(name: string, payload: Record<string, any>): void {
    try {
      const send = async () => {
        try {
          const staticCtx = getStaticDeviceContext();
          const dynamicCtx = getDynamicContext();

          const eventPayload = {
            ...staticCtx,
            ...dynamicCtx,
            ...payload,
            timestamp: new Date().toISOString(),
          };

          const { error } = await supabase.from('analytics_events').insert({
            event_name: name,
            event_data: eventPayload,
          });

          if (error && import.meta.env.DEV) {
            console.debug('[Telemetry] Remote delivery error (suppressed):', error.message);
          }
        } catch {
          // Suppress errors to prevent app crashes
        }
      };

      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        (window as any).requestIdleCallback(() => {
          void send();
        }, { timeout: 2000 });
      } else {
        setTimeout(() => {
          void send();
        }, 0);
      }
    } catch {
      // Suppress any scheduling exceptions
    }
  }

  /**
   * Retrieves the in-memory telemetry buffer.
   */
  getHistory(): readonly TelemetryRecord[] {
    return [...this.buffer];
  }

  /**
   * Clears in-memory telemetry buffer.
   */
  clear(): void {
    this.buffer = [];
  }

  /**
   * Strips any unintentional PII or sensitive keys from telemetry payloads.
   */
  private sanitizePayload<T>(payload: T): T {
    if (!payload || typeof payload !== 'object') return payload;

    const forbiddenKeys = ['email', 'password', 'token', 'user_note', 'question', 'question_hi', 'notes'];
    const sanitized: any = Array.isArray(payload) ? [] : {};

    for (const [key, value] of Object.entries(payload)) {
      if (forbiddenKeys.includes(key.toLowerCase())) {
        continue;
      }
      if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizePayload(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized as T;
  }
}

export const telemetry = new TelemetryService();
