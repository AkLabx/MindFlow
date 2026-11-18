import { useEffect, useCallback, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../auth/context/AuthContext';
import { useQueryClient } from '@tanstack/react-query';

export function useSocialRealtime(roomId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);

  useEffect(() => {
    if (!user || !roomId) return;

    let typingTimeout: any = null;

    // Room-specific broadcast channel for ephemeral events (typing, receipts)
    const roomChannel = supabase.channel(`room_events:${roomId}`);

    roomChannel
      .on('broadcast', { event: 'typing' }, (payload: any) => {
        if (payload?.payload?.user_id !== user.id) {
          setIsOtherUserTyping(Boolean(payload?.payload?.isTyping));

          // Auto-clear typing after 4 seconds of silence
          if (payload?.payload?.isTyping) {
            clearTimeout(typingTimeout);
            typingTimeout = setTimeout(() => {
              setIsOtherUserTyping(false);
            }, 4000);
          }
        }
      })
      .on('broadcast', { event: 'receipt' }, (payload: any) => {
        // Receipt payload: { status: 'delivered' | 'read', messageIds: string[], reader_id: string }
        if (payload?.payload?.reader_id !== user.id) {
          const { status, messageIds } = payload.payload;
          if (messageIds && messageIds.length > 0) {
            queryClient.setQueryData<any[]>(['chat-messages', roomId], (old) => {
              if (!old) return old;
              return old.map((m) =>
                messageIds.includes(m.id) ? { ...m, status } : m
              );
            });
          }
        }
      })
      .subscribe();

    return () => {
      clearTimeout(typingTimeout);
      supabase.removeChannel(roomChannel);
    };
  }, [user, roomId, queryClient]);

  const sendTypingStatus = useCallback(
    async (isTyping: boolean) => {
      if (!user || !roomId) return;
      const channel = supabase.channel(`room_events:${roomId}`);
      await channel.send({
        type: 'broadcast',
        event: 'typing',
        payload: { room_id: roomId, user_id: user.id, isTyping },
      });
    },
    [user, roomId]
  );

  const broadcastReceipt = useCallback(
    async (status: 'delivered' | 'read', messageIds: string[]) => {
      if (!user || !roomId || messageIds.length === 0) return;
      const channel = supabase.channel(`room_events:${roomId}`);
      await channel.send({
        type: 'broadcast',
        event: 'receipt',
        payload: { room_id: roomId, reader_id: user.id, status, messageIds },
      });
    },
    [user, roomId]
  );

  return { isOtherUserTyping, sendTypingStatus, broadcastReceipt };
}
