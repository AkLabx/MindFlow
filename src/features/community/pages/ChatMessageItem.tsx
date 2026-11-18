import React, { useState, useCallback, useTransition, useRef } from 'react';
import { motion } from 'framer-motion';
import { FileText, Reply, Ban, Download } from 'lucide-react';
import { ChatMessage } from '../api/chatApi';
import { useAuth } from '../../auth/context/AuthContext';
import { ChatReceiptTicks } from '../components/chat/ChatReceiptTicks';
import { ChatBubbleTail } from '../components/chat/ChatBubbleTail';
import { ChatDatePill } from '../components/chat/ChatDatePill';
import { QuotedMessagePreview } from '../components/chat/QuotedMessagePreview';
import { VoiceNotePlayer } from '../components/chat/VoiceNotePlayer';
import { FloatingReactionPill } from '../components/chat/FloatingReactionPill';
import { useSwipeToReply } from '../hooks/useSwipeToReply';
import { formatMessageTime, formatFileSize } from '../utils/chatTheme';
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
    if (onReply && !msg.deleted_at) {
      onReply(msg);
    }
  }, [onReply, msg]);

  const { offsetX, touchHandlers } = useSwipeToReply({
    onReply: handleReply,
    disabled: !onReply || Boolean(msg.deleted_at),
  });

  const handleCopy = useCallback(() => {
    if (msg.text_content && !msg.deleted_at) {
      navigator.clipboard.writeText(msg.text_content).then(() => {
        toast.success('Message copied');
      }).catch(() => {
        toast.error('Failed to copy');
      });
    }
  }, [msg.text_content, msg.deleted_at]);

  const longPressTimerRef = useRef<any>(null);
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);

  const triggerReactionMenu = useCallback(() => {
    if (msg.deleted_at) return;
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(25);
    }
    startTransition(() => {
      setIsReactionMenuOpen(true);
    });
  }, [msg.deleted_at]);

  const handleLongPress = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    triggerReactionMenu();
  }, [triggerReactionMenu]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchHandlers.onTouchStart(e);
    if (msg.deleted_at) return;
    const touch = e.touches[0];
    touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };

    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      triggerReactionMenu();
    }, 450);
  }, [touchHandlers, msg.deleted_at, triggerReactionMenu]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchHandlers.onTouchMove(e);
    if (touchStartPosRef.current && longPressTimerRef.current) {
      const touch = e.touches[0];
      const dist = Math.hypot(touch.clientX - touchStartPosRef.current.x, touch.clientY - touchStartPosRef.current.y);
      if (dist > 10) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    }
  }, [touchHandlers]);

  const handleTouchEnd = useCallback(() => {
    touchHandlers.onTouchEnd();
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    touchStartPosRef.current = null;
  }, [touchHandlers]);

  const handleTouchCancel = useCallback(() => {
    touchHandlers.onTouchCancel();
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    touchStartPosRef.current = null;
  }, [touchHandlers]);

  const timeFormatted = formatMessageTime(msg.created_at);
  const myReaction = msg.reactions?.find((r) => r.user_id === user?.id)?.emoji || null;

  // Extract file extension and display name for document attachments
  const getFileExtension = (nameOrUrl?: string | null) => {
    if (!nameOrUrl) return 'FILE';
    const clean = nameOrUrl.split('?')[0];
    const ext = clean.split('.').pop();
    return ext ? ext.toUpperCase().slice(0, 4) : 'FILE';
  };

  const isDeleted = Boolean(msg.deleted_at);

  return (
    <div className="w-full flex flex-col select-none relative">
      {/* Sticky Date Pill */}
      {showTimeSeparator && (
        <ChatDatePill dateString={msg.created_at || timeSeparatorText} />
      )}

      {/* Message Row with Swipe-to-Reply Translation */}
      <div
        className={`px-3 py-1 flex items-end gap-1.5 relative group ${
          isMine ? 'justify-end' : 'justify-start'
        }`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
        onContextMenu={handleLongPress}
      >
        {/* Swipe-to-Reply Arrow Indicator (Revealed on Swipe Right) */}
        {offsetX > 0 && (
          <div
            style={{
              transform: `translateX(${Math.min(offsetX - 40, 20)}px)`,
              opacity: Math.min(offsetX / 45, 1),
            }}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center pointer-events-none shadow-md z-10"
          >
            <Reply size={16} strokeWidth={2.5} />
          </div>
        )}

        {/* Speech Bubble Container with Elastic Horizontal Offset */}
        <div
          style={{ transform: `translateX(${offsetX}px)` }}
          className="relative max-w-[84%] sm:max-w-[72%] transition-transform duration-75"
        >
          {/* Bubble Tail */}
          {!isDeleted && <ChatBubbleTail isMine={isMine} />}

          {/* Speech Bubble Card */}
          <div
            className={`px-3 pt-2 pb-1.5 rounded-[14px] shadow-[0_1px_2px_rgba(0,0,0,0.06)] select-text relative ${
              isDeleted
                ? 'bg-slate-100 dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 text-slate-400 italic'
                : isMine
                ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white shadow-indigo-500/15 rounded-tr-none'
                : 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-tl-none'
            }`}
          >
            {/* Deleted Message State */}
            {isDeleted ? (
              <div className="flex items-center gap-1.5 text-[13px] py-0.5">
                <Ban size={15} className="shrink-0 text-slate-400" />
                <span>This message was deleted</span>
              </div>
            ) : (
              <>
                {/* Embedded Quoted Reply Snippet */}
                {msg.reply_to && (
                  <QuotedMessagePreview
                    message={msg.reply_to}
                    variant="inlineBubble"
                    isMine={isMine}
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
                    className="mb-1.5 rounded-xl overflow-hidden bg-black/10 -mx-1 -mt-0.5 cursor-pointer hover:opacity-95 transition-opacity"
                  >
                    <img
                      src={msg.media_url}
                      alt="Shared media"
                      className="w-full h-auto object-cover max-h-72 rounded-xl"
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

                {/* Media: Document / PDF Attachment with Real Name & Size */}
                {msg.media_url && msg.media_type === 'file' && (
                  <a
                    href={msg.media_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-3 p-2.5 rounded-xl mb-1.5 transition-all select-none ${
                      isMine
                        ? 'bg-black/15 hover:bg-black/25 text-white'
                        : 'bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200/80 text-slate-900 dark:text-slate-100 border border-slate-200/60 dark:border-slate-700/60'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-[10px] tracking-wider uppercase shadow-xs ${
                        isMine
                          ? 'bg-white text-indigo-700'
                          : 'bg-indigo-600 text-white'
                      }`}
                    >
                      <div className="flex flex-col items-center">
                        <FileText size={16} strokeWidth={2.2} />
                        <span className="text-[9px] -mt-0.5 font-black">{getFileExtension(msg.file_name || msg.media_url)}</span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[13px] font-semibold truncate block leading-tight">
                        {msg.file_name || 'Document'}
                      </span>
                      <span className={`text-[11px] block mt-0.5 ${isMine ? 'text-indigo-200' : 'text-slate-500 dark:text-slate-400'}`}>
                        {formatFileSize(msg.file_size) || 'Tap to view'}
                      </span>
                    </div>
                    <div className={`p-1.5 rounded-full ${isMine ? 'hover:bg-white/10' : 'hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
                      <Download size={16} className={isMine ? 'text-white' : 'text-slate-500'} />
                    </div>
                  </a>
                )}

                {/* Text Message Content + Inline Micro-Timestamp & Ticks */}
                {msg.text_content && (
                  <div className="leading-[1.38] text-[14.5px] break-words whitespace-pre-wrap">
                    {msg.text_content}
                    {/* Inline-block spacer so text never overlaps timestamp */}
                    <span className="inline-block w-14 h-3" />
                  </div>
                )}
              </>
            )}

            {/* Micro-Timestamp and Delivery Ticks docked bottom-right */}
            <div className="absolute right-2 bottom-1 flex items-center gap-1 select-none pointer-events-none">
              <span className={`text-[10px] tracking-tight ${isMine ? 'text-indigo-200' : 'text-slate-400 dark:text-slate-500'}`}>
                {timeFormatted}
              </span>
              {isMine && !isDeleted && (
                <ChatReceiptTicks status={msg.status} inOutgoingBubble={true} />
              )}
            </div>
          </div>

          {/* Docked Reactions Badge Pill (Bottom Edge) */}
          {!isDeleted && msg.reactions && msg.reactions.length > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={`absolute -bottom-2 bg-white dark:bg-slate-800 rounded-full px-2 py-0.5 shadow-sm border border-slate-200/80 dark:border-slate-700 flex items-center gap-1 text-[12px] z-10 cursor-pointer ${
                isMine ? 'right-2' : 'left-2'
              }`}
              onClick={() => setIsReactionMenuOpen(true)}
            >
              {msg.reactions.slice(0, 3).map((r, i) => (
                <span key={i}>{r.emoji}</span>
              ))}
              {msg.reactions.length > 1 && (
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
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
