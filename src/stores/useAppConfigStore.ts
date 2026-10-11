import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export interface IntroConfig {
  active: string;
  duration: number;
  skipDelay: number;
  enabled: boolean;
}

export interface ThemeConfig {
  mode: 'system' | 'light' | 'dark';
  primaryColor: string;
  fontFamily: string;
}

export interface BrandingConfig {
  appName: string;
  welcomeText: string;
  tagline: string;
  logoUrl: string | null;
  versionNotice: {
    enabled: boolean;
    message: string;
    severity: 'info' | 'warning' | 'error';
    dismissible: boolean;
  };
}

export interface AppConfig {
  id: number;
  version: number;
  intro: IntroConfig;
  theme: ThemeConfig;
  loading: Record<string, any>;
  dashboard: Record<string, any>;
  branding: BrandingConfig;
  updated_at?: string;
}

export const DEFAULT_CONFIG: AppConfig = {
  id: 1,
  version: 1,
  intro: {
    active: 'blue',
    duration: 2000,
    skipDelay: 3000,
    enabled: true,
  },
  theme: {
    mode: 'system',
    primaryColor: '#4f46e5', // indigo-600
    fontFamily: 'sans', // Matches Inter
  },
  loading: {},
  dashboard: {},
  branding: {
    appName: 'MindFlow',
    welcomeText: 'Welcome to MindFlow',
    tagline: 'The ultimate learning platform.',
    logoUrl: null,
    versionNotice: {
      enabled: false,
      message: 'A new version is available.',
      severity: 'info',
      dismissible: true,
    }
  },
};

interface AppConfigState {
  config: AppConfig;
  // Consolidated preview config containing all previewable sections
  previewConfig: Partial<AppConfig> | null;
  previewNonce: number;
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;

  initialize: () => Promise<void>;
  updateConfig: (section: keyof Omit<AppConfig, 'id' | 'version' | 'updated_at' | 'updated_by'>, newConfig: any) => Promise<void>;
  startPreview: (previewConfig: Partial<AppConfig>) => void;
  clearPreview: () => void;
}

const LOCAL_STORAGE_KEY = 'mindflow_app_ui_config';

export const useAppConfigStore = create<AppConfigState>((set, get) => ({
  config: (() => {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (cached) {
        // Deep merge with defaults to ensure new fields are populated for old clients
        const parsed = JSON.parse(cached) as AppConfig;
        return {
          ...DEFAULT_CONFIG,
          ...parsed,
          intro: { ...DEFAULT_CONFIG.intro, ...(parsed.intro || {}) },
          theme: { ...DEFAULT_CONFIG.theme, ...(parsed.theme || {}) },
          loading: { ...DEFAULT_CONFIG.loading, ...(parsed.loading || {}) },
          dashboard: { ...DEFAULT_CONFIG.dashboard, ...(parsed.dashboard || {}) },
          branding: { ...DEFAULT_CONFIG.branding, ...(parsed.branding || {}) }
        };
      }
    } catch (e) {
      console.warn('Failed to parse cached app config', e);
    }
    return DEFAULT_CONFIG;
  })(),

  previewConfig: null,
  previewNonce: 0,
  isInitialized: false,
  isLoading: false,
  error: null,

  initialize: async () => {
    const { config } = get();

    try {
      set({ isLoading: true, error: null });

      const { data, error } = await supabase
        .from('app_ui_config')
        .select('*')
        .eq('id', 1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.warn('No app config found in DB, using default/cache.');
        } else {
          throw error;
        }
      } else if (data) {
        if (data.version > (config.version || 0) || !localStorage.getItem(LOCAL_STORAGE_KEY)) {
           const nextConfig: AppConfig = {
              id: data.id,
              version: data.version,
              intro: { ...DEFAULT_CONFIG.intro, ...(data.intro || {}) },
              // Merge db objects with local defaults to fill in any missing Phase 2 fields if DB has old format
              theme: { ...DEFAULT_CONFIG.theme, ...(data.theme || {}) },
              loading: { ...DEFAULT_CONFIG.loading, ...(data.loading || {}) },
              dashboard: { ...DEFAULT_CONFIG.dashboard, ...(data.dashboard || {}) },
              branding: { ...DEFAULT_CONFIG.branding, ...(data.branding || {}) },
              updated_at: data.updated_at
           };

           localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(nextConfig));
           set({ config: nextConfig });
        }
      }
    } catch (err: any) {
      console.error('Failed to sync app UI config:', err);
      set({ error: err.message });
    } finally {
      set({ isInitialized: true, isLoading: false });
    }
  },

  updateConfig: async (section, newConfig) => {
    try {
      set({ isLoading: true, error: null });

      const currentConfig = get().config;

      const updatedConfig = {
        ...currentConfig,
        [section]: newConfig
      };

      set({ config: updatedConfig });

      const { data, error } = await supabase
        .from('app_ui_config')
        .update({ [section]: newConfig })
        .eq('id', 1)
        .select()
        .single();

      if (error) throw error;

      if (data) {
         const finalConfig: AppConfig = {
            id: data.id,
            version: data.version,
            intro: { ...DEFAULT_CONFIG.intro, ...(data.intro || {}) },
            theme: { ...DEFAULT_CONFIG.theme, ...(data.theme || {}) },
            loading: { ...DEFAULT_CONFIG.loading, ...(data.loading || {}) },
            dashboard: { ...DEFAULT_CONFIG.dashboard, ...(data.dashboard || {}) },
            branding: { ...DEFAULT_CONFIG.branding, ...(data.branding || {}) },
            updated_at: data.updated_at
         };
         localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(finalConfig));
         set({ config: finalConfig });
      }

    } catch (err: any) {
      console.error(`Failed to update config for ${section}:`, err);
      set({ error: err.message });
      get().initialize();
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  startPreview: (previewConfigUpdates) => {
    set((state) => ({
      previewConfig: {
         ...state.config, // base preview on current config
         ...previewConfigUpdates // override with preview changes
      },
      previewNonce: state.previewNonce + 1
    }));
  },

  clearPreview: () => {
    set({ previewConfig: null });
  }
}));
