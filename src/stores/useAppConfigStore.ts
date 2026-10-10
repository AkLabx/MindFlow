import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export interface IntroConfig {
  active: string;
  duration: number;
  skipDelay: number;
  enabled: boolean;
}

export interface AppConfig {
  id: number;
  version: number;
  intro: IntroConfig;
  theme: Record<string, any>;
  loading: Record<string, any>;
  dashboard: Record<string, any>;
  branding: Record<string, any>;
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
  theme: {},
  loading: {},
  dashboard: {},
  branding: {},
};

interface AppConfigState {
  config: AppConfig;
  previewConfig: IntroConfig | null;
  previewNonce: number;
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;

  initialize: () => Promise<void>;
  updateConfig: (section: keyof Omit<AppConfig, 'id' | 'version' | 'updated_at' | 'updated_by'>, newConfig: any) => Promise<void>;
  startPreview: (introConfig: IntroConfig) => void;
  clearPreview: () => void;
}

const LOCAL_STORAGE_KEY = 'mindflow_app_ui_config';

export const useAppConfigStore = create<AppConfigState>((set, get) => ({
  config: (() => {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (cached) {
        return JSON.parse(cached) as AppConfig;
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
              intro: data.intro || DEFAULT_CONFIG.intro,
              theme: data.theme || DEFAULT_CONFIG.theme,
              loading: data.loading || DEFAULT_CONFIG.loading,
              dashboard: data.dashboard || DEFAULT_CONFIG.dashboard,
              branding: data.branding || DEFAULT_CONFIG.branding,
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
            intro: data.intro || DEFAULT_CONFIG.intro,
            theme: data.theme || DEFAULT_CONFIG.theme,
            loading: data.loading || DEFAULT_CONFIG.loading,
            dashboard: data.dashboard || DEFAULT_CONFIG.dashboard,
            branding: data.branding || DEFAULT_CONFIG.branding,
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

  startPreview: (introConfig) => {
    set((state) => ({
      previewConfig: introConfig,
      previewNonce: state.previewNonce + 1
    }));
  },

  clearPreview: () => {
    set({ previewConfig: null });
  }
}));
