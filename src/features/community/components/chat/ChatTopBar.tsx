import React, { Fragment } from 'react';
import { ArrowLeft, MoreVertical, ShieldAlert, Ban, UserCheck } from 'lucide-react';
import { Menu, Transition } from '@headlessui/react';
import { PresenceAvatar } from '../../../../components/ui/PresenceAvatar';
import { getCanonicalAvatarUrl } from '../../../../utils/avatar';

interface ChatTopBarProps {
  onBack: () => void;
  participant?: {
    user_id: string;
    full_name: string | null;
    avatar_url: string | null;
    last_seen?: string | null;
  } | null;
  isOnline: boolean;
  isTyping: boolean;
  onOpenReport: () => void;
  isBlockedByMe: boolean;
  onToggleBlock: () => void;
  onViewProfile?: () => void;
}

export const ChatTopBar: React.FC<ChatTopBarProps> = ({
  onBack,
  participant,
  isOnline,
  isTyping,
  onOpenReport,
  isBlockedByMe,
  onToggleBlock,
  onViewProfile,
}) => {
  const avatarUrl = getCanonicalAvatarUrl(participant, null);
  const title = participant?.full_name || 'Chat';

  const formatLastSeen = (dateString?: string | null) => {
    if (!dateString) return 'Offline';
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Active just now';
    if (diffInMinutes < 60) return `Last seen ${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Last seen ${diffInHours}h ago`;
    return `Last seen ${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}`;
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-slate-100 sticky top-0 z-20 shadow-[0_1px_3px_rgba(0,0,0,0.04)] select-none">
      {/* Back button + Avatar clickable group */}
      <div className="flex items-center gap-1.5 rounded-full p-1 -ml-1 hover:bg-slate-100 dark:hover:bg-slate-800/80 active:scale-95 transition-all cursor-pointer">
        <button
          onClick={onBack}
          aria-label="Go back to chats"
          className="p-1 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
        >
          <ArrowLeft size={22} strokeWidth={2.2} />
        </button>

        <div
          onClick={onViewProfile}
          className="w-9 h-9 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200/60 dark:border-slate-700 shadow-xs"
        >
          <PresenceAvatar
            userId={participant?.user_id || ''}
            avatarUrl={avatarUrl}
            altText={title}
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Name and Realtime Status */}
      <div
        onClick={onViewProfile}
        className="flex-1 min-w-0 px-1 cursor-pointer flex flex-col justify-center"
      >
        <div className="font-bold text-[15.5px] text-slate-900 dark:text-slate-100 truncate leading-tight tracking-tight">
          {title}
        </div>
        <div className="text-[12px] text-slate-500 dark:text-slate-400 truncate leading-tight mt-0.5">
          {isTyping ? (
            <span className="text-indigo-600 dark:text-indigo-400 font-semibold animate-pulse">typing...</span>
          ) : isOnline ? (
            <span className="text-emerald-600 dark:text-emerald-400 font-medium inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              online
            </span>
          ) : (
            <span>{formatLastSeen(participant?.last_seen)}</span>
          )}
        </div>
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-0.5 shrink-0">
        <Menu as="div" className="relative">
          <Menu.Button
            aria-label="More conversation options"
            className="p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all"
          >
            <MoreVertical size={20} strokeWidth={2} />
          </Menu.Button>

          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute right-0 mt-2 w-52 origin-top-right rounded-2xl bg-white dark:bg-slate-900 shadow-xl ring-1 ring-black/5 dark:ring-white/10 focus:outline-none overflow-hidden z-50 py-1.5 border border-slate-200/80 dark:border-slate-800">
              {onViewProfile && (
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={onViewProfile}
                      className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${
                        active
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                          : 'text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      View profile
                    </button>
                  )}
                </Menu.Item>
              )}

              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={onToggleBlock}
                    className={`w-full text-left px-4 py-2.5 text-sm font-medium flex items-center gap-2 transition-colors ${
                      isBlockedByMe
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    } ${active ? 'bg-slate-100 dark:bg-slate-800' : ''}`}
                  >
                    {isBlockedByMe ? (
                      <>
                        <UserCheck size={16} /> Unblock user
                      </>
                    ) : (
                      <>
                        <Ban size={16} /> Block user
                      </>
                    )}
                  </button>
                )}
              </Menu.Item>

              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={onOpenReport}
                    className={`w-full text-left px-4 py-2.5 text-sm font-medium flex items-center gap-2 text-rose-600 dark:text-rose-400 transition-colors ${
                      active ? 'bg-rose-50 dark:bg-rose-950/30' : ''
                    }`}
                  >
                    <ShieldAlert size={16} /> Report user
                  </button>
                )}
              </Menu.Item>
            </Menu.Items>
          </Transition>
        </Menu>
      </div>
    </div>
  );
};

// Aliased export for backwards compatibility
export const WhatsAppTopBar = ChatTopBar;
