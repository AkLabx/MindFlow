import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Loader2, MessageSquare, ArrowLeft } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { searchProfiles, getOrCreateChatRoom, SearchProfile } from '../../api/communityApi';
import { useAuth } from '../../../auth/context/AuthContext';
import { PresenceAvatar } from '../../../../components/ui/PresenceAvatar';
import { getCanonicalAvatarUrl } from '../../../../utils/avatar';
import { useNavigate } from 'react-router-dom';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 250);
    return () => clearTimeout(handler);
  }, [query]);

  const { data: results, isLoading } = useQuery({
    queryKey: ['new-chat-search', debouncedQuery, user?.id],
    queryFn: () => searchProfiles(debouncedQuery, user?.id),
    enabled: isOpen && debouncedQuery.length >= 1,
    staleTime: 1000 * 30,
  });

  const createRoomMutation = useMutation({
    mutationFn: (peerId: string) => getOrCreateChatRoom(user!.id, peerId),
    onSuccess: (roomId) => {
      if (roomId) {
        onClose();
        navigate(`/messages/${roomId}`);
      }
    },
    onSettled: () => {
      setSelectedUserId(null);
    },
  });

  const handleSelectUser = (peer: SearchProfile) => {
    if (!user || createRoomMutation.isPending) return;
    setSelectedUserId(peer.id);
    createRoomMutation.mutate(peer.id);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex flex-col justify-end sm:justify-center p-0 sm:p-4 select-none"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg mx-auto bg-white dark:bg-slate-900 rounded-t-[28px] sm:rounded-[24px] shadow-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col max-h-[85dvh] h-[580px] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 active:scale-95 transition-transform"
                aria-label="Back"
              >
                <ArrowLeft size={20} />
              </button>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                New Conversation
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>

          {/* Search Box */}
          <div className="p-3 border-b border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl focus-within:ring-2 focus-within:ring-indigo-500/50 transition-all">
              <Search size={18} className="text-slate-400 shrink-0" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search classmates by name or @username..."
                autoFocus
                className="flex-1 bg-transparent border-none text-[14.5px] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-0 outline-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  aria-label="Clear search"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Results List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 p-1">
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <Loader2 size={24} className="animate-spin text-indigo-500 mb-2" />
                <span className="text-xs font-medium">Searching classmates...</span>
              </div>
            )}

            {!isLoading && debouncedQuery.length >= 1 && results?.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mb-2">
                  <Search size={20} />
                </div>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  No users found
                </span>
                <span className="text-xs text-slate-400 mt-0.5">
                  Check the spelling or try searching another name
                </span>
              </div>
            )}

            {!isLoading && debouncedQuery.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4 text-slate-400">
                <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-2">
                  <MessageSquare size={20} />
                </div>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Find Classmates & Peers
                </span>
                <span className="text-xs text-slate-400 mt-0.5 max-w-xs">
                  Type a name or username above to start chatting with them
                </span>
              </div>
            )}

            {results?.map((peer) => {
              const isStartingThisChat =
                createRoomMutation.isPending && selectedUserId === peer.id;
              const avatar = getCanonicalAvatarUrl(peer, null);

              return (
                <div
                  key={peer.id}
                  onClick={() => handleSelectUser(peer)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 active:bg-slate-100 dark:active:bg-slate-800 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200/60 dark:border-slate-700">
                      <PresenceAvatar
                        userId={peer.id}
                        avatarUrl={avatar}
                        altText={peer.full_name || 'User'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex flex-col justify-center">
                      <span className="font-semibold text-[14.5px] text-slate-900 dark:text-slate-100 truncate">
                        {peer.full_name || 'Classmate'}
                      </span>
                      <span className="text-xs text-slate-400 dark:text-slate-500 truncate">
                        @{peer.username || 'user'}
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 ml-2">
                    {isStartingThisChat ? (
                      <Loader2 size={18} className="animate-spin text-indigo-500" />
                    ) : (
                      <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors">
                        Chat
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
