import { useEffect } from 'react';
import { useSettingsStore } from '../../../stores/useSettingsStore';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../context/AuthContext';

export const useTargetAudience = () => {
  const { user } = useAuth();
  const targetAudience = useSettingsStore((state) => state.targetAudience);
  const setTargetAudience = useSettingsStore((state) => state.setTargetAudience);

  // Sync from DB to local store on login
  useEffect(() => {
    // Listener for auth redirects updating target audience
    const handleIntentUpdate = (e: any) => {
      if (e.detail) {
        // Only update local state, AuthContext handles the DB update for intents
        setTargetAudience(e.detail);
      }
    };
    window.addEventListener('mindflow-target-audience-update', handleIntentUpdate);

    return () => window.removeEventListener('mindflow-target-audience-update', handleIntentUpdate);
  }, [user, setTargetAudience]);

  useEffect(() => {
    // Only fetch from DB if there is NO explicit intent currently in progress.
    // This prevents a race condition where the explicit portal login intent tries to set
    // the mode to 'school', but this DB fetch rapidly overrides it back to 'competitive'
    // before the explicit intent completes its database update.
    const fetchAudiencePreference = async () => {
      if (user?.id && !localStorage.getItem('mindflow_target_audience_intent')) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('target_audience')
            .eq('id', user.id)
            .single();

          if (error) throw error;

          if (data && data.target_audience) {
             // If DB has a preference and no login intent is active, use it locally (DB wins)
             setTargetAudience(data.target_audience as 'competitive' | 'school');
          }
        } catch (error) {
          console.error("Failed to fetch target audience preference:", error);
        }
      }
    };

    fetchAudiencePreference();
  }, [user, setTargetAudience]);

  // Set preference (updates local store and DB if logged in)
  const handleSetAudience = async (audience: 'competitive' | 'school') => {
    // 1. Update local Zustand state (saves to localStorage)
    setTargetAudience(audience);

    // 2. Update DB if user is logged in
    if (user?.id) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ target_audience: audience })
          .eq('id', user.id);

        if (error) throw error;
      } catch (error) {
         console.error("Failed to sync target audience preference to DB:", error);
      }
    }
  };

  return {
    targetAudience,
    setTargetAudience: handleSetAudience,
  };
};
