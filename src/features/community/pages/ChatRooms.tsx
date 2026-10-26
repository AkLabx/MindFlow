import React, { useState, useEffect, useRef } from 'react';
import { getCanonicalAvatarUrl } from '../../../utils/avatar';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchUserRooms, fetchMessages, sendMessage, uploadChatMedia, ChatRoom, ChatMessage } from '../api/chatApi';
import { useAuth } from '../../auth/context/AuthContext';
import { useSocialRealtime } from '../hooks/useSocialRealtime';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import { usePresenceStore } from '../../../stores/usePresenceStore';

import { supabase } from '../../../lib/supabase';
import { PresenceAvatar } from '../../../components/ui/PresenceAvatar';
import { PresenceDot } from '../../../components/ui/PresenceDot';
import { motion } from 'framer-motion';
import { Send, Image as ImageIcon, File, ArrowLeft } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChatListSkeleton } from '../components/ChatListSkeleton';
import { ChatIntro } from './ChatIntro';
import { ChatMessageItem } from './ChatMessageItem';
import { ChatInputBar } from './ChatInputBar';
import { Info, MoreVertical } from 'lucide-react';
import { Menu, Transition } from '@headlessui/react';
import { submitReport } from '../api/reportsApi';
import { ReportModal } from '../components/reports/ReportModal';
import { BlockUserPromptModal } from '../components/reports/BlockUserPromptModal';
import { ShieldAlert } from 'lucide-react';
import { checkBlockStatus, blockUser, unblockUser } from '../api/communityApi';
import { useNotification } from '../../../hooks/useNotification';

export const ChatRooms: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();


  const { data: rooms, isLoading } = useQuery({
    queryKey: ['chat-rooms', user?.id],
    queryFn: () => fetchUserRooms(user!.id),
    enabled: !!user,
  });

  if (isLoading) return <ChatListSkeleton />;

  return (
    <div className="flex flex-col w-full max-w-3xl mx-auto pb-[env(safe-area-inset-bottom)] px-4 sm:px-4 md:px-0">
      <div className="flex items-center gap-3 mb-6 mt-4"><button onClick={() => navigate('/community')} className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-800"><ArrowLeft size={24} /></button><h2 className="text-2xl font-bold text-gray-900">Messages</h2></div>
      <div className="space-y-2">
        {rooms?.map(room => {
          // For direct chats, find the other person
          const otherParticipant = room.participants?.find(p => p.user_id !== user?.id);
          const title = room.type === 'direct' ? otherParticipant?.full_name || 'Unknown User' : 'Group Chat';
          const avatar = room.type === 'direct' ? getCanonicalAvatarUrl(otherParticipant, null) : null;

          return (
            <motion.button
              key={room.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(`/messages/${room.id}`)}
              className="w-full bg-white backdrop-blur-md border border-gray-200 rounded-2xl p-4 flex items-center gap-4 text-left"
            >
              <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 shadow-sm">
                <PresenceAvatar
                  userId={otherParticipant?.user_id || ''}
                  avatarUrl={getCanonicalAvatarUrl(otherParticipant, null)}
                  altText={otherParticipant?.full_name || 'User'}
                  className="w-full h-full"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900 truncate flex items-center gap-2">
                  {title}
                  {room.type === 'direct' && otherParticipant?.user_id && (
                    <PresenceDot userId={otherParticipant.user_id} />
                  )}
                </div>
                <div className="text-sm text-gray-500 truncate">Tap to open chat</div>
              </div>
            </motion.button>
          );
        })}
        {rooms?.length === 0 && (
          <div className="text-gray-500 text-center mt-10">No messages yet.</div>
        )}
      </div>
    </div>
  );
};

