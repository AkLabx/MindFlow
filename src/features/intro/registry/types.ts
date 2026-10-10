import React from 'react';
import { IntroConfig } from '@/stores/useAppConfigStore';

/**
 * Props provided to every Intro Module by the IntroEngine.
 *
 * IMPORTANT RULES FOR MODULE AUTHORS:
 * 1. The `onComplete` prop reference may change during playback if the parent re-renders.
 *    DO NOT use `onComplete` directly in your `useEffect` dependency arrays, as this will
 *    cause your effect to tear down mid-animation. Instead, store it in a mutable ref
 *    (`const onCompleteRef = useRef(onComplete)`) and update the ref in a separate effect.
 * 2. You MUST clean up all `setTimeout`, `setInterval`, and `requestAnimationFrame` IDs
 *    in your effect's return function to support React 18 Strict Mode double-invocations.
 *    Do not use simple `if (hasRun.current)` guards to bypass strict mode.
 * 3. Never block indefinitely. The `IntroEngine` implements a watchdog timeout, but
 *    well-behaved modules should always call `onComplete` after their intended duration.
 */
export interface IntroProps {
  config: IntroConfig;
  onComplete: () => void;
}

export interface IntroModuleDef {
  id: string;
  name: string;
  description: string;
  isAvailable: boolean; // false for "Coming Soon" placeholders
  load: () => Promise<{ default: React.ComponentType<IntroProps> }>;
}
