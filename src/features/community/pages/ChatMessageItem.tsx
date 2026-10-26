import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { File, Heart, Copy } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { ChatMessage, toggleMessageLike } from '../api/chatApi';
import { useAuth } from '../../auth/context/AuthContext';
import { MessageActionMenu, MessageAction } from '../components/MessageActionMenu';
import toast from 'react-hot-toast';

interface ChatMessageItemProps {
  msg: ChatMessage;
  isMine: boolean;
  showTimeSeparator: boolean;
  timeSeparatorText?: string;
  otherParticipantAvatar?: string | null;
  onLikeToggle: (messageId: string, isLiked: boolean) => void;
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = React.memo(({
  msg,
  isMine,
  showTimeSeparator,
  timeSeparatorText,
  otherParticipantAvatar,
  onLikeToggle
}) => {
  const { user } = useAuth();
  const [showHeartAnim, setShowHeartAnim] = useState(false);
  const isLiked = msg.likes?.some(l => l.user_id === user?.id) || false;

  const handleToggleLike = useCallback((showAnimation: boolean = false) => {
    if (!user) return;

    if (!isLiked && showAnimation) {
      setShowHeartAnim(true);
      setTimeout(() => setShowHeartAnim(false), 1000);
    }

    onLikeToggle(msg.id, isLiked);
    toggleMessageLike(msg.id, user.id, isLiked).catch(err => {
      console.error('Failed to toggle like', err);
      onLikeToggle(msg.id, !isLiked);
    });
  }, [user, isLiked, msg.id, onLikeToggle]);

  const handleDoubleClick = useCallback(() => {
    handleToggleLike(true);
  }, [handleToggleLike]);

  const handleCopy = useCallback(() => {
    if (msg.text_content) {
      navigator.clipboard.writeText(msg.text_content).then(() => {
        toast.success('Message copied');
      }).catch(() => {
        toast.error('Failed to copy');
      });
    }
  }, [msg.text_content]);

  const actions: MessageAction[] = [
    {
      id: 'like',
      label: isLiked ? 'Unlike' : 'Like',
      icon: <Heart className={cn("w-4 h-4", isLiked ? "fill-red-500 text-red-500" : "text-gray-600")} />,
      onClick: () => handleToggleLike(false) // No big animation for menu click
    }
  ];

  if (msg.text_content) {
    actions.push({
      id: 'copy',
      label: 'Copy',
      icon: <Copy className="w-4 h-4 text-gray-600" />,
      onClick: handleCopy
    });
  }

  return (
    <div className="w-full flex flex-col">
      {showTimeSeparator && (
        <div className="flex justify-center my-3">
          <span className="text-[10px] font-medium text-gray-400 bg-gray-50/80 px-2 py-0.5 rounded-full border border-gray-100/50">
            {timeSeparatorText}
          </span>
        </div>
      )}
      <div className={cn("px-4 py-1.5 flex items-end gap-2 group", isMine ? "justify-end" : "justify-start")}>

        {!isMine && (
          <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-indigo-500 shadow-sm border border-white">
            {otherParticipantAvatar ? (
              <img src={otherParticipantAvatar} className="w-full h-full object-cover" alt="avatar" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold">U</div>
            )}
          </div>
        )}

        {/* Note: select-none removed to allow standard text selection. cursor-default to not imply a link. */}
        <div
          className="relative max-w-[75%]"
          onDoubleClick={handleDoubleClick}
        >
          <MessageActionMenu actions={actions}>
            <AnimatePresence>
              {showHeartAnim && (
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1.5, opacity: 1, y: -20 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none"
                >
                  <Heart className="w-16 h-16 text-red-500 fill-red-500 drop-shadow-md" />
                </motion.div>
              )}
            </AnimatePresence>

            <div
              className={cn(
                "px-4 py-2.5 relative transition-all duration-200 select-text",
                isMine
                  ? "bg-blue-600 text-white rounded-2xl rounded-br-sm shadow-sm"
                  : "bg-gray-100 text-black rounded-2xl rounded-bl-sm",
                msg.status === 'sending' && "opacity-60"
              )}
            >
              {msg.media_url && msg.media_type === 'image' && (
                <div className="mb-2 rounded-xl overflow-hidden bg-black/5 -mx-1 -mt-1">
                  <img src={msg.media_url} alt="chat media" className="max-w-full h-auto object-cover max-h-64" loading="lazy" />
                </div>
              )}
              {msg.media_url && msg.media_type === 'file' && (
                <a href={msg.media_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-3 bg-black/5 rounded-xl mb-2 hover:bg-black/10 transition select-none">
                  <File size={24} className={isMine ? "text-white" : "text-gray-900"} />
                  <span className="text-sm font-medium underline">Attachment</span>
                </a>
              )}
              <div className="whitespace-pre-wrap break-words leading-relaxed text-[15px]">{msg.text_content}</div>
            </div>
          </MessageActionMenu>

          {msg.likes && msg.likes.length > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={cn(
                "absolute -bottom-2 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 z-10",
                isMine ? "right-1" : "right-1"
              )}
            >
              <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
});
