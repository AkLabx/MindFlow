import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../auth/context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchUserRooms,
  fetchMessages,
  sendMessage,
  uploadChatMedia,
  markMessagesAsRead,
  toggleMessageReaction,
  deleteChatMessage,
  ChatMessage,
  ChatRoom,
} from '../api/chatApi';
import { chatCacheService } from '../services/chatCacheService';
import { supabase } from '../../../lib/supabase';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import { useSocialRealtime } from '../hooks/useSocialRealtime';
import { usePresenceStore } from '../../../stores/usePresenceStore';
import { ChatTopBar } from '../components/chat/ChatTopBar';
import { ChatWallpaper } from '../components/chat/ChatWallpaper';
import { ChatInputBar } from '../components/chat/ChatInputBar';
import { ChatMessageItem } from './ChatMessageItem';
import { MediaLightbox } from '../components/chat/MediaLightbox';
import { ReportModal } from '../components/reports/ReportModal';
import { BlockUserPromptModal } from '../components/reports/BlockUserPromptModal';
import { checkBlockStatus, blockUser, unblockUser } from '../api/communityApi';
import { submitReport } from '../api/reportsApi';
import { useNotification } from '../../../hooks/useNotification';
import { getCanonicalAvatarUrl } from '../../../utils/avatar';

export const ActiveChatRoom: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const { showToast } = useNotification();

  // Modals & Media State
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isBlockPromptOpen, setIsBlockPromptOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [lightboxMedia, setLightboxMedia] = useState<{
    url: string;
    senderName?: string;
    timestamp?: string;
  } | null>(null);

  // Fetch Rooms
  const { data: rooms } = useQuery({
    queryKey: ['chat-rooms', user?.id],
    queryFn: () => fetchUserRooms(user!.id),
    enabled: !!user,
  });

  const room: ChatRoom = rooms?.find((r) => r.id === roomId) || {
    id: roomId!,
    type: 'direct',
    created_at: '',
    updated_at: '',
  };

  const otherParticipant = room.participants?.find((p) => p.user_id !== user?.id);

  // Realtime Events (Typing, Receipts)
  const { isOtherUserTyping, sendTypingStatus, broadcastReceipt } = useSocialRealtime(room.id);

  // Presence Store
  const isOnline = usePresenceStore((state) =>
    otherParticipant ? state.isUserOnline(otherParticipant.user_id) : false
  );

  // Messages Query with 0ms Offline-First Cache Pre-seeding
  const { data: messages, isLoading } = useQuery({
    queryKey: ['chat-messages', room.id],
    queryFn: () => fetchMessages(room.id),
    staleTime: 1000 * 30, // 30s fresh window
  });

  // Hydrate from IndexedDB on initial mount if React Query cache is empty
  useEffect(() => {
    if (!messages && room.id) {
      chatCacheService.getCachedMessages(room.id).then((cached) => {
        if (cached && cached.length > 0) {
          queryClient.setQueryData(['chat-messages', room.id], cached);
        }
      });
    }
  }, [room.id, messages, queryClient]);

  // Mark unread incoming messages as read and broadcast receipt
  useEffect(() => {
    if (!messages || !user || !room.id) return;

    const unreadIncoming = messages.filter(
      (m) => m.sender_id !== user.id && !m.read_at && m.status !== 'read'
    );

    if (unreadIncoming.length > 0) {
      const ids = unreadIncoming.map((m) => m.id);
      markMessagesAsRead(room.id, ids);
      broadcastReceipt('read', ids);

      // Optimistically update local query cache
      queryClient.setQueryData<ChatMessage[]>(['chat-messages', room.id], (old) => {
        if (!old) return old;
        return old.map((m) => (ids.includes(m.id) ? { ...m, status: 'read' } : m));
      });
    }
  }, [messages, user, room.id, broadcastReceipt, queryClient]);

  // Supabase Postgres Realtime Subscription for incoming new messages & updates
  useEffect(() => {
    if (!room.id) return;

    const channel = supabase
      .channel(`room_messages:${room.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_room_messages',
          filter: `room_id=eq.${room.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newMsg = payload.new as ChatMessage;

            if (newMsg.sender_id !== user?.id) {
              const incoming: ChatMessage = {
                ...newMsg,
                status: 'delivered',
              };

              queryClient.setQueryData<ChatMessage[]>(['chat-messages', room.id], (old) => {
                if (!old) return [incoming];
                if (old.some((m) => m.id === newMsg.id)) return old;
                return [...old, incoming];
              });

              // Automatically emit delivered receipt
              broadcastReceipt('delivered', [newMsg.id]);

              // Save to IndexedDB
              chatCacheService.upsertCachedMessage(incoming);

              // Scroll to bottom
              setTimeout(() => {
                virtuosoRef.current?.scrollToIndex({
                  index: 'LAST',
                  align: 'end',
                  behavior: 'smooth',
                });
              }, 100);
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedMsg = payload.new as ChatMessage;
            queryClient.setQueryData<ChatMessage[]>(['chat-messages', room.id], (old) => {
              if (!old) return old;
              return old.map((m) => (m.id === updatedMsg.id ? { ...m, ...updatedMsg } : m));
            });
            chatCacheService.upsertCachedMessage(updatedMsg);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [room.id, queryClient, user, broadcastReceipt]);

  // Send Message Mutation with Optimistic UI & Reconciled Cache
  const sendMutation = useMutation({
    mutationFn: (msg: Partial<ChatMessage>) => sendMessage(msg),
    onMutate: async (newMsg) => {
      await queryClient.cancelQueries({ queryKey: ['chat-messages', room.id] });
      const previousMessages = queryClient.getQueryData<ChatMessage[]>(['chat-messages', room.id]);

      const optimisticMsg: ChatMessage = {
        id: `temp-${Date.now()}`,
        room_id: room.id,
        sender_id: user!.id,
        text_content: newMsg.text_content || '',
        media_url: newMsg.media_url,
        media_type: newMsg.media_type,
        voice_duration: newMsg.voice_duration,
        file_name: newMsg.file_name,
        file_size: newMsg.file_size,
        reply_to_id: newMsg.reply_to_id,
        reply_to: replyingTo
          ? {
              id: replyingTo.id,
              sender_id: replyingTo.sender_id,
              sender_name: replyingTo.sender_id === user!.id ? 'You' : otherParticipant?.full_name || 'User',
              text_content: replyingTo.text_content,
              media_type: replyingTo.media_type,
            }
          : null,
        created_at: new Date().toISOString(),
        status: 'sending',
      };

      queryClient.setQueryData<ChatMessage[]>(['chat-messages', room.id], (old) => {
        return old ? [...old, optimisticMsg] : [optimisticMsg];
      });

      // Clear replying state
      setReplyingTo(null);

      // Scroll to bottom
      setTimeout(() => {
        virtuosoRef.current?.scrollToIndex({ index: 'LAST', align: 'end', behavior: 'smooth' });
      }, 50);

      return { previousMessages, tempId: optimisticMsg.id };
    },
    onSuccess: (realMsg, variables, context) => {
      queryClient.setQueryData<ChatMessage[]>(['chat-messages', room.id], (old) => {
        if (!old) return [realMsg];
        return old.map((m) =>
          m.id === context?.tempId ? { ...realMsg, reply_to: m.reply_to, status: 'sent' } : m
        );
      });
    },
    onError: (err, newMsg, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(['chat-messages', room.id], context.previousMessages);
      }
      showToast({ title: 'Error', message: 'Failed to send message.', variant: 'error' });
    },
  });

  // Media Upload Handlers with Filename & Size Metadata
  const handleUploadMedia = async (
    fileOrBlob: File | Blob,
    type: 'image' | 'file',
    metadata?: { name?: string; size?: number }
  ) => {
    if (!user) return;
    try {
      setIsUploading(true);
      const ext = type === 'image' ? 'webp' : undefined;
      const publicUrl = await uploadChatMedia(fileOrBlob, user.id, ext);

      sendMutation.mutate({
        room_id: room.id,
        sender_id: user.id,
        text_content: type === 'image' ? '' : metadata?.name || 'Sent an attachment',
        media_url: publicUrl,
        media_type: type,
        file_name: metadata?.name || (fileOrBlob instanceof File ? fileOrBlob.name : null),
        file_size: metadata?.size || (fileOrBlob instanceof File ? fileOrBlob.size : null),
        reply_to_id: replyingTo?.id,
      });
    } catch (err) {
      console.error('Failed to upload media:', err);
      showToast({ title: 'Error', message: 'Failed to upload media.', variant: 'error' });
    } finally {
      setIsUploading(false);
    }
  };

  // Voice Note Upload Handler
  const handleSendVoice = async (audioBlob: Blob, durationSecs: number) => {
    if (!user) return;
    try {
      setIsUploading(true);
      const publicUrl = await uploadChatMedia(audioBlob, user.id, 'webm');

      sendMutation.mutate({
        room_id: room.id,
        sender_id: user.id,
        text_content: '',
        media_url: publicUrl,
        media_type: 'voice',
        voice_duration: durationSecs,
        reply_to_id: replyingTo?.id,
      });
    } catch (err) {
      console.error('Failed to upload voice note:', err);
      showToast({ title: 'Error', message: 'Failed to send voice note.', variant: 'error' });
    } finally {
      setIsUploading(false);
    }
  };

  // Reactions Handler
  const handleToggleReaction = async (messageId: string, emoji: string) => {
    if (!user) return;
    try {
      const res = await toggleMessageReaction(messageId, user.id, emoji);
      queryClient.setQueryData<ChatMessage[]>(['chat-messages', room.id], (old) => {
        if (!old) return old;
        return old.map((m) => {
          if (m.id !== messageId) return m;
          const currentReactions = m.reactions || [];
          const filtered = currentReactions.filter((r) => r.user_id !== user.id);
          if (res.added) {
            filtered.push({ emoji: res.emoji, user_id: user.id });
          }
          return { ...m, reactions: filtered };
        });
      });
    } catch (err) {
      console.error('Failed to update reaction:', err);
    }
  };

  // Message Deletion Handler
  const handleDeleteMessage = async (messageId: string) => {
    try {
      await deleteChatMessage(messageId);
      queryClient.setQueryData<ChatMessage[]>(['chat-messages', room.id], (old) => {
        if (!old) return old;
        return old.map((m) =>
          m.id === messageId ? { ...m, deleted_at: new Date().toISOString() } : m
        );
      });
      showToast({ title: 'Message Deleted', message: 'Message was deleted.', variant: 'info' });
    } catch (err) {
      console.error('Failed to delete message:', err);
      showToast({ title: 'Error', message: 'Failed to delete message.', variant: 'error' });
    }
  };

  // Block & Report Mutations
  const { data: blockStatus, refetch: refetchBlockStatus } = useQuery({
    queryKey: ['blockStatus', user?.id, otherParticipant?.user_id],
    queryFn: () => checkBlockStatus(user!.id, otherParticipant!.user_id),
    enabled: !!user?.id && !!otherParticipant?.user_id,
  });

  const blockMutation = useMutation({
    mutationFn: () => blockUser(user!.id, otherParticipant!.user_id),
    onSuccess: () => {
      showToast({ title: 'Contact Blocked', message: 'You have blocked this contact.', variant: 'success' });
      refetchBlockStatus();
    },
    onError: () => {
      showToast({ title: 'Error', message: 'Failed to block contact.', variant: 'error' });
    },
  });

  const unblockMutation = useMutation({
    mutationFn: () => unblockUser(user!.id, otherParticipant!.user_id),
    onSuccess: () => {
      showToast({ title: 'Contact Unblocked', message: 'Contact unblocked.', variant: 'success' });
      refetchBlockStatus();
    },
    onError: () => {
      showToast({ title: 'Error', message: 'Failed to unblock contact.', variant: 'error' });
    },
  });

  const reportMutation = useMutation({
    mutationFn: (data: { reason: string; customNote: string }) =>
      submitReport({
        target_id: otherParticipant!.user_id,
        reporter_id: user!.id,
        reason: data.reason,
        custom_note: data.customNote,
        evidence_data: {
          id: otherParticipant!.user_id,
          username: otherParticipant!.full_name || 'User',
          full_name: otherParticipant!.full_name || 'User',
          avatar_url: otherParticipant!.avatar_url,
          bio: null,
        },
      }),
    onSuccess: () => {
      setIsReportModalOpen(false);
      showToast({
        title: 'Report Submitted',
        message: 'Thank you for keeping MindFlow safe.',
        variant: 'success',
      });
      setIsBlockPromptOpen(true);
    },
    onError: () => {
      showToast({ title: 'Error', message: 'Failed to submit report.', variant: 'error' });
    },
  });

  const handleScrollToMessage = useCallback(
    (targetMessageId: string) => {
      if (!messages) return;
      const index = messages.findIndex((m) => m.id === targetMessageId);
      if (index !== -1) {
        virtuosoRef.current?.scrollToIndex({
          index,
          align: 'center',
          behavior: 'smooth',
        });
      }
    },
    [messages]
  );

  return (
    <div className="flex flex-col flex-1 h-[100dvh] w-full bg-slate-50 dark:bg-[#020617] relative md:max-w-2xl md:mx-auto md:border-x md:border-slate-200/80 md:dark:border-slate-800 md:shadow-xl overflow-hidden select-none">
      {/* MindFlow Neural Synapse Wallpaper */}
      <ChatWallpaper />

      {/* MindFlow Elevated Glass Top Bar */}
      <ChatTopBar
        onBack={() => navigate('/messages')}
        participant={otherParticipant}
        isOnline={isOnline}
        isTyping={isOtherUserTyping}
        isBlockedByMe={Boolean(blockStatus?.hasBlocked)}
        onToggleBlock={() => {
          if (blockStatus?.hasBlocked) unblockMutation.mutate();
          else blockMutation.mutate();
        }}
        onOpenReport={() => setIsReportModalOpen(true)}
        onViewProfile={() => {
          if (otherParticipant?.user_id) {
            navigate(`/community/profile/${otherParticipant.user_id}`);
          }
        }}
      />

      {/* Virtualized Message Stream */}
      <div className="flex-1 min-h-0 relative z-10 flex flex-col">
        {isLoading && !messages ? (
          <div className="flex justify-center items-center h-full text-xs font-semibold text-slate-500 dark:text-slate-400">
            Loading conversation...
          </div>
        ) : (
          <Virtuoso
            ref={virtuosoRef}
            style={{ height: '100%' }}
            followOutput="smooth"
            data={messages || []}
            initialTopMostItemIndex={(messages?.length || 0) - 1}
            itemContent={(index, msg) => {
              const prevMsg = index > 0 ? messages?.[index - 1] : null;
              let showTimeSeparator = false;

              if (msg && msg.created_at) {
                if (!prevMsg) {
                  showTimeSeparator = true;
                } else {
                  const currentMsgDate = new Date(msg.created_at);
                  const prevMsgDate = new Date(prevMsg.created_at);
                  const isDifferentDay =
                    currentMsgDate.toDateString() !== prevMsgDate.toDateString();
                  if (isDifferentDay) {
                    showTimeSeparator = true;
                  }
                }
              }

              const isMine = msg.sender_id === user?.id;

              return (
                <ChatMessageItem
                  key={msg.id}
                  msg={msg}
                  isMine={isMine}
                  showTimeSeparator={showTimeSeparator}
                  otherParticipantAvatar={getCanonicalAvatarUrl(otherParticipant, null)}
                  otherParticipantName={otherParticipant?.full_name || 'User'}
                  onReply={(targetMsg) => setReplyingTo(targetMsg)}
                  onOpenMedia={(url, name, time) =>
                    setLightboxMedia({ url, senderName: name, timestamp: time })
                  }
                  onReact={handleToggleReaction}
                  onDelete={handleDeleteMessage}
                  onScrollToMessage={handleScrollToMessage}
                />
              );
            }}
          />
        )}
      </div>

      {/* MindFlow Dual-Capsule Input Bar */}
      <ChatInputBar
        onSend={(text) =>
          sendMutation.mutate({
            room_id: room.id,
            sender_id: user!.id,
            text_content: text,
            reply_to_id: replyingTo?.id,
          })
        }
        onSendVoice={handleSendVoice}
        onUploadMedia={handleUploadMedia}
        onTyping={(isTyping) => sendTypingStatus(isTyping)}
        isUploading={isUploading}
        replyingTo={
          replyingTo
            ? {
                id: replyingTo.id,
                sender_name: replyingTo.sender_id === user?.id ? 'You' : otherParticipant?.full_name || 'User',
                text_content: replyingTo.text_content,
                media_type: replyingTo.media_type,
              }
            : null
        }
        onDismissReply={() => setReplyingTo(null)}
        isBlocked={blockStatus?.isBlockedBy}
        isBlocker={blockStatus?.hasBlocked}
        onUnblock={() => unblockMutation.mutate()}
      />

      {/* Full-Screen Zoomable Media Lightbox */}
      <MediaLightbox
        isOpen={Boolean(lightboxMedia)}
        onClose={() => setLightboxMedia(null)}
        mediaUrl={lightboxMedia?.url || null}
        senderName={lightboxMedia?.senderName}
        timestamp={lightboxMedia?.timestamp}
      />

      {/* Modals */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onSubmit={(reason, customNote) => reportMutation.mutate({ reason, customNote })}
        targetName={otherParticipant?.full_name || 'User'}
        targetType="user"
      />

      <BlockUserPromptModal
        isOpen={isBlockPromptOpen}
        onClose={() => setIsBlockPromptOpen(false)}
        onBlock={() => blockMutation.mutate()}
        targetName={otherParticipant?.full_name || 'User'}
      />
    </div>
  );
};
