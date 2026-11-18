import React, { Fragment } from 'react';
import { ArrowLeft, MoreVertical, Search, ShieldAlert, Ban, UserCheck, Image as ImageIcon } from 'lucide-react';
import { Menu, Transition } from '@headlessui/react';
import { PresenceAvatar } from '../../../../components/ui/PresenceAvatar';
import { getCanonicalAvatarUrl } from '../../../../utils/avatar';

interface WhatsAppTopBarProps {
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

export const WhatsAppTopBar: React.FC<WhatsAppTopBarProps> = ({
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
    <div className="flex items-center gap-1.5 px-2 py-2 bg-[#008069] dark:bg-[#1F2C34] text-white sticky top-0 z-20 shadow-[0_1px_2px_rgba(0,0,0,0.15)] select-none">
      {/* Back button + Avatar clickable group */}
      <div className="flex items-center gap-1 rounded-full p-1 -ml-1 hover:bg-white/10 active:bg-white/20 transition-colors cursor-pointer">
        <button
          onClick={onBack}
          aria-label="Go back to chats"
          className="p-1 text-white hover:text-white/90 active:scale-95 transition-transform"
        >
          <ArrowLeft size={22} strokeWidth={2.2} />
        </button>

        <div
          onClick={onViewProfile}
          className="w-9 h-9 rounded-full overflow-hidden bg-white/20 shrink-0 border border-white/20 shadow-sm"
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
        <div className="font-semibold text-[16px] text-white truncate leading-tight tracking-tight">
          {title}
        </div>
        <div className="text-[12px] text-[#E9EDEF]/90 dark:text-[#8696A0] truncate leading-tight mt-0.5">
          {isTyping ? (
            <span className="text-white font-medium animate-pulse">typing...</span>
          ) : isOnline ? (
            <span className="text-[#D9FDD3] dark:text-[#25D366] font-medium">online</span>
          ) : (
            <span>{formatLastSeen(participant?.last_seen)}</span>
          )}
        </div>
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-0.5 text-white shrink-0">
        <Menu as="div" className="relative">
          <Menu.Button
            aria-label="More conversation options"
            className="p-2 rounded-full hover:bg-white/10 active:bg-white/20 transition-colors"
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
            <Menu.Items className="absolute right-0 mt-2 w-52 origin-top-right rounded-xl bg-white dark:bg-[#233138] shadow-xl ring-1 ring-black/10 dark:ring-white/10 focus:outline-none overflow-hidden z-50 py-1.5 border border-gray-100 dark:border-slate-700">
              {onViewProfile && (
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={onViewProfile}
                      className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${
                        active
                          ? 'bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-slate-100'
                          : 'text-gray-700 dark:text-slate-200'
                      }`}
                    >
                      View contact
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
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    } ${active ? 'bg-gray-100 dark:bg-slate-800' : ''}`}
                  >
                    {isBlockedByMe ? (
                      <>
                        <UserCheck size={16} /> Unblock contact
                      </>
                    ) : (
                      <>
                        <Ban size={16} /> Block contact
                      </>
                    )}
                  </button>
                )}
              </Menu.Item>

              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={onOpenReport}
                    className={`w-full text-left px-4 py-2.5 text-sm font-medium flex items-center gap-2 text-red-600 dark:text-red-400 transition-colors ${
                      active ? 'bg-red-50 dark:bg-red-900/20' : ''
                    }`}
                  >
                    <ShieldAlert size={16} /> Report contact
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
