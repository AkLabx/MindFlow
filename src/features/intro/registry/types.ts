import React from 'react';
import { IntroConfig } from '@/stores/useAppConfigStore';

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
