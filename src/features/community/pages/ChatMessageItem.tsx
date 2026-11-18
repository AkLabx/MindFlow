import React, { useState, useCallback, useTransition } from 'react';
import { motion } from 'framer-motion';
import { File, Reply, Copy } from 'lucide-react';
import { ChatMessage } from '../api/chatApi';
import { useAuth } from '../../auth/context/AuthContext';
import { WhatsAppReceiptTicks } from '../components/chat/WhatsAppReceiptTicks';
import { WhatsAppBubbleTail } from '../components/chat/WhatsAppBubbleTail';
import { WhatsAppDatePill } from '../components/chat/WhatsAppDatePill';
import { QuotedMessagePreview } from '../components/chat/QuotedMessagePreview';
import { VoiceNotePlayer } from '../components/chat/VoiceNotePlayer';
import { FloatingReactionPill } from '../components/chat/FloatingReactionPill';
import { useSwipeToReply } from '../hooks/useSwipeToReply';
import { formatMessageTime } from '../utils/whatsappTheme';
import toast from 'react-hot-toast';

interface ChatMessageItemProps {
  msg: ChatMessage;
  isMine: boolean;
  showTimeSeparator: boolean;
  timeSeparatorText?: string;
  otherParticipantAvatar?: string | null;
  otherParticipantName?: string;
  onReply?: (msg: ChatMessage) => void;
  onOpenMedia?: (url: string, senderName?: string, timestamp?: string) => void;
  onLikeToggle?: (messageId: string, isLiked: boolean) => void;
  onDelete?: (messageId: string) => void;
  onReact?: (messageId: string, emoji: string) => void;
  onScrollToMessage?: (messageId: string) => void;
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = React.memo(({
  msg,
  isMine,
  showTimeSeparator,
  timeSeparatorText,
  otherParticipantAvatar,
  otherParticipantName = 'User',
  onReply,
  onOpenMedia,
  onDelete,
  onReact,
  onScrollToMessage,
}) => {
  const { user } = useAuth();
  const [isReactionMenuOpen, setIsReactionMenuOpen] = useState(false);
  const [, startTransition] = useTransition();

  const handleReply = useCallback(() => {
    if (onReply) {
      onReply(msg);
    }
  }, [onReply, msg]);

  const { offsetX, touchHandlers } = useSwipeToReply({
    onReply: handleReply,
    disabled: !onReply,
  });

  const handleCopy = useCallback(() => {
    if (msg.text_content) {
      navigator.clipboard.writeText(msg.text_content).then(() => {
        toast.success('Message copied');
      }).catch(() => {
        toast.error('Failed to copy');
      });
    }
  }, [msg.text_content]);

  const handleLongPress = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(20);
    }
    startTransition(() => {
      setIsReactionMenuOpen(true);
    });
  }, []);

  const timeFormatted = formatMessageTime(msg.created_at);
  const myReaction = msg.reactions?.find((r) => r.user_id === user?.id)?.emoji || null;

  return (
    <div className="w-full flex flex-col select-none relative">
      {/* Sticky WhatsApp Date Pill */}
      {showTimeSeparator && (
        <WhatsAppDatePill dateString={msg.created_at || timeSeparatorText} />
      )}

      {/* Message Row with Swipe-to-Reply Translation */}
      <div
        className={`px-3 py-1 flex items-end gap-1.5 relative group ${
          isMine ? 'justify-end' : 'justify-start'
        }`}
        {...touchHandlers}
        onContextMenu={handleLongPress}
      >
        {/* Swipe-to-Reply Arrow Indicator (Revealed on Swipe Right) */}
        {offsetX > 0 && (
          <div
            style={{
              transform: `translateX(${Math.min(offsetX - 40, 20)}px)`,
              opacity: Math.min(offsetX / 45, 1),
            }}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#00A884] text-white flex items-center justify-center pointer-events-none shadow-md z-10"
          >
            <Reply size={16} strokeWidth={2.5} />
          </div>
        )}

        {/* Speech Bubble Container with Elastic Horizontal Offset */}
        <div
          style={{ transform: `translateX(${offsetX}px)` }}
          className="relative max-w-[82%] sm:max-w-[70%] transition-transform duration-75"
        >
          {/* WhatsApp Speech Bubble Tail */}
          <WhatsAppBubbleTail isMine={isMine} />

          {/* Speech Bubble Card */}
          <div
            className={`px-3 pt-2 pb-1.5 rounded-[10px] shadow-[0_1px_0.5px_rgba(11,20,26,0.13)] select-text relative ${
              isMine
                ? 'bg-[#D9FDD3] dark:bg-[#005C4B] text-[#111B21] dark:text-[#E9EDEF] rounded-tr-none'
                : 'bg-white dark:bg-[#1F2C34] text-[#111B21] dark:text-[#E9EDEF] rounded-tl-none'
            }`}
          >
            {/* Embedded Quoted Reply Snippet */}
            {msg.reply_to && (
              <QuotedMessagePreview
                message={msg.reply_to}
                variant="inlineBubble"
                onClick={() => onScrollToMessage?.(msg.reply_to!.id)}
              />
            )}

            {/* Media: Image (with high-res tap-to-lightbox) */}
            {msg.media_url && msg.media_type === 'image' && (
              <div
                onClick={() =>
                  onOpenMedia?.(
                    msg.media_url!,
                    isMine ? 'You' : otherParticipantName,
                    timeFormatted
                  )
                }
                className="mb-1.5 rounded-lg overflow-hidden bg-black/5 -mx-1 -mt-0.5 cursor-pointer hover:opacity-95 transition-opacity"
              >
                <img
                  src={msg.media_url}
                  alt="Shared media"
                  className="w-full h-auto object-cover max-h-72 rounded-lg"
                  loading="lazy"
                />
              </div>
            )}

            {/* Media: Voice Note Player with Waveform */}
            {msg.media_url && msg.media_type === 'voice' && (
              <VoiceNotePlayer
                audioUrl={msg.media_url}
                duration={msg.voice_duration}
                senderAvatar={isMine ? user?.user_metadata?.avatar_url : otherParticipantAvatar}
                senderName={isMine ? 'You' : otherParticipantName}
                senderId={msg.sender_id}
                isMine={isMine}
              />
            )}

            {/* Media: Document Attachment */}
            {msg.media_url && msg.media_type === 'file' && (
              <a
                href={msg.media_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 p-2.5 bg-black/5 dark:bg-white/5 rounded-lg mb-1.5 hover:bg-black/10 transition select-none"
              >
                <div className="w-9 h-9 rounded-full bg-[#00A884] text-white flex items-center justify-center shrink-0">
                  <File size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-semibold text-gray-900 dark:text-slate-100 truncate block">
                    Document
                  </span>
                  <span className="text-[11px] text-gray-500 dark:text-slate-400">Tap to view</span>
                </div>
              </a>
            )}

            {/* Text Message Content + Inline Micro-Timestamp & Ticks */}
            <div className="leading-[1.35] text-[14.5px] break-words whitespace-pre-wrap">
              {msg.text_content}

              {/* Inline-block spacer so text never overlaps timestamp */}
              <span className="inline-block w-14 h-3" />
            </div>

            {/* Micro-Timestamp and Delivery Ticks docked bottom-right */}
            <div className="absolute right-2 bottom-1 flex items-center gap-1 select-none pointer-events-none">
              <span className="text-[10px] text-[#667781] dark:text-[#8696A0] tracking-tight">
                {timeFormatted}
              </span>
              {isMine && <WhatsAppReceiptTicks status={msg.status} />}
            </div>
          </div>

          {/* Docked Reactions Badge Pill (Bottom Edge) */}
          {msg.reactions && msg.reactions.length > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={`absolute -bottom-2 bg-white dark:bg-[#1F2C34] rounded-full px-1.5 py-0.5 shadow-sm border border-black/5 dark:border-white/10 flex items-center gap-1 text-[12px] z-10 cursor-pointer ${
                isMine ? 'right-2' : 'left-2'
              }`}
              onClick={() => setIsReactionMenuOpen(true)}
            >
              {msg.reactions.slice(0, 3).map((r, i) => (
                <span key={i}>{r.emoji}</span>
              ))}
              {msg.reactions.length > 1 && (
                <span className="text-[10px] font-bold text-gray-500 dark:text-slate-400">
                  {msg.reactions.length}
                </span>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* Long-Press Floating Reaction & Action Menu */}
      <FloatingReactionPill
        isOpen={isReactionMenuOpen}
        onClose={() => setIsReactionMenuOpen(false)}
        onReact={(emoji) => onReact?.(msg.id, emoji)}
        onReply={handleReply}
        onCopy={handleCopy}
        onDelete={() => onDelete?.(msg.id)}
        canDelete={isMine}
        isMine={isMine}
        currentReaction={myReaction}
      />
    </div>
  );
});
