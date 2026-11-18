import React, { useState, useEffect } from 'react';
import { getCanonicalAvatarUrl } from '../../../utils/avatar';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchUserRooms, ChatRoom } from '../api/chatApi';
import { chatCacheService } from '../services/chatCacheService';
import { useAuth } from '../../auth/context/AuthContext';
import { PresenceAvatar } from '../../../components/ui/PresenceAvatar';
import { PresenceDot } from '../../../components/ui/PresenceDot';
import { ArrowLeft, Search, X, MessageSquarePlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ChatListSkeleton } from '../components/ChatListSkeleton';
import { WhatsAppReceiptTicks } from '../components/chat/WhatsAppReceiptTicks';

export const ChatRooms: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const { data: rooms, isLoading } = useQuery({
    queryKey: ['chat-rooms', user?.id],
    queryFn: () => fetchUserRooms(user!.id),
    enabled: !!user,
    staleTime: 1000 * 30,
  });

  // Hydrate instantly from local IndexedDB cache on initial mount
  useEffect(() => {
    if (!rooms && user) {
      chatCacheService.getCachedRooms().then((cached) => {
        if (cached && cached.length > 0) {
          queryClient.setQueryData(['chat-rooms', user.id], cached);
        }
      });
    }
  }, [rooms, user, queryClient]);

  const formatInboxTime = (dateString?: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return date.toLocaleDateString([], { month: 'numeric', day: 'numeric', year: '2-digit' });
  };

  const filteredRooms = rooms?.filter((room) => {
    if (!searchQuery.trim()) return true;
    const otherParticipant = room.participants?.find((p) => p.user_id !== user?.id);
    const title = room.type === 'direct' ? otherParticipant?.full_name || '' : 'Group Chat';
    return (
      title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.last_message?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  if (isLoading && !rooms) {
    return <ChatListSkeleton />;
  }

  return (
    <div className="flex flex-col w-full h-[100dvh] max-w-3xl mx-auto bg-white dark:bg-[#0B141A] select-none overflow-hidden">
      {/* WhatsApp Emerald App Bar */}
      <div className="bg-[#008069] dark:bg-[#1F2C34] text-white px-3 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.15)] z-10">
        {isSearchOpen ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setIsSearchOpen(false);
                setSearchQuery('');
              }}
              className="p-1.5 text-white/90 hover:text-white"
              aria-label="Close search"
            >
              <ArrowLeft size={22} />
            </button>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chats..."
              autoFocus
              className="flex-1 bg-transparent border-none text-white text-[16px] placeholder:text-white/60 focus:ring-0 outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="p-1 text-white/80 hover:text-white"
                aria-label="Clear search"
              >
                <X size={18} />
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/community')}
                className="p-1 -ml-1 text-white hover:text-white/90 active:scale-95 transition-transform"
                aria-label="Go to community"
              >
                <ArrowLeft size={22} strokeWidth={2.2} />
              </button>
              <h1 className="text-[20px] font-bold tracking-tight text-white">MindFlow Chats</h1>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-2 rounded-full hover:bg-white/10 active:scale-95 transition-transform"
                aria-label="Search conversations"
              >
                <Search size={20} strokeWidth={2.2} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-[#1F2C34]/60">
        {filteredRooms?.map((room) => {
          const otherParticipant = room.participants?.find((p) => p.user_id !== user?.id);
          const title = room.type === 'direct' ? otherParticipant?.full_name || 'User' : 'Group Chat';
          const avatar = getCanonicalAvatarUrl(otherParticipant, null);
          const isSentByMe = room.last_message_sender_id === user?.id;

          return (
            <div
              key={room.id}
              onClick={() => navigate(`/messages/${room.id}`)}
              className="w-full px-4 py-3 flex items-center gap-3.5 hover:bg-black/[0.03] dark:hover:bg-white/[0.03] active:bg-black/[0.06] dark:active:bg-white/[0.06] transition-colors cursor-pointer text-left select-none"
            >
              {/* 50px Avatar with Presence Indicator */}
              <div className="relative w-12 h-12 rounded-full overflow-hidden shrink-0 shadow-sm bg-gray-200 dark:bg-slate-700">
                <PresenceAvatar
                  userId={otherParticipant?.user_id || ''}
                  avatarUrl={avatar}
                  altText={title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Chat Meta & Snippet */}
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className="flex items-center justify-between mb-0.5">
                  <div className="font-semibold text-[16px] text-[#111B21] dark:text-[#E9EDEF] truncate flex items-center gap-1.5">
                    {title}
                    {room.type === 'direct' && otherParticipant?.user_id && (
                      <PresenceDot userId={otherParticipant.user_id} />
                    )}
                  </div>
                  <div className="text-[12px] text-[#667781] dark:text-[#8696A0] shrink-0 font-medium">
                    {formatInboxTime(room.last_message_created_at)}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-[13.5px] text-[#667781] dark:text-[#8696A0] truncate flex items-center gap-1">
                    {isSentByMe && (
                      <WhatsAppReceiptTicks status="delivered" className="shrink-0" />
                    )}
                    <span className="truncate">{room.last_message || 'Tap to open chat'}</span>
                  </div>

                  {room.unread_count && room.unread_count > 0 ? (
                    <div className="min-w-[20px] h-5 px-1.5 rounded-full bg-[#25D366] text-white text-[11px] font-bold flex items-center justify-center shrink-0 shadow-sm">
                      {room.unread_count}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}

        {filteredRooms?.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <div className="w-16 h-16 rounded-full bg-[#008069]/10 text-[#008069] dark:text-[#25D366] flex items-center justify-center mb-3">
              <MessageSquarePlus size={28} />
            </div>
            <div className="text-base font-semibold text-gray-800 dark:text-slate-200">
              No messages found
            </div>
            <div className="text-xs text-gray-500 dark:text-slate-400 mt-1 max-w-xs">
              Start a new conversation with classmates and peers from the Community feed!
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
