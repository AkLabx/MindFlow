import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../features/auth/context/AuthContext';
import { usePresenceStore } from '../stores/usePresenceStore';

export const PresenceProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const setOnlineUsers = usePresenceStore((state) => state.setOnlineUsers);

  useEffect(() => {
    if (!user) return;

    const room = supabase.channel('global_presence');

    room
      .on('presence', { event: 'sync' }, () => {
        const newState = room.presenceState();
        const onlineIds = Object.values(newState)
          .flat()
          .map((presence: any) => presence.user_id)
          .filter(Boolean);

        setOnlineUsers(onlineIds);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await room.track({
            user_id: user.id,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      // Update last seen in DB when component unmounts (e.g. sign out)
      supabase.from('profiles').update({ last_seen: new Date().toISOString() }).eq('id', user.id);

      room.unsubscribe();
    };
  }, [user, setOnlineUsers]);

  return <>{children}</>;
};
