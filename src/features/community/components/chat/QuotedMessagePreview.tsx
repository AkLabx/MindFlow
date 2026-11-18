import React from 'react';
import { X, Image as ImageIcon, File, Mic } from 'lucide-react';

interface QuotedMessagePreviewProps {
  message: {
    id?: string;
    sender_name?: string;
    text_content: string;
    media_type?: string | null;
    media_url?: string | null;
  };
  onDismiss?: () => void;
  onClick?: () => void;
  variant?: 'inputBar' | 'inlineBubble';
  isMine?: boolean;
  className?: string;
}

export const QuotedMessagePreview: React.FC<QuotedMessagePreviewProps> = ({
  message,
  onDismiss,
  onClick,
  variant = 'inputBar',
  isMine = false,
  className = '',
}) => {
  const isInputBar = variant === 'inputBar';

  let mediaIcon = null;
  const iconColor = isMine && !isInputBar ? 'text-indigo-200' : 'text-indigo-600 dark:text-indigo-400';
  if (message.media_type === 'image') {
    mediaIcon = <ImageIcon size={14} className={iconColor} />;
  } else if (message.media_type === 'voice') {
    mediaIcon = <Mic size={14} className={iconColor} />;
  } else if (message.media_type === 'file') {
    mediaIcon = <File size={14} className={iconColor} />;
  }

  return (
    <div
      onClick={onClick}
      className={`relative flex items-center justify-between rounded-xl overflow-hidden transition-all ${
        isInputBar
          ? 'bg-slate-100/90 dark:bg-slate-800/90 border-l-[3.5px] border-indigo-500 px-3 py-1.5 mx-2 mb-1 shadow-xs'
          : isMine
          ? 'bg-black/15 border-l-[3.5px] border-white/80 px-2.5 py-1 mb-1.5 cursor-pointer hover:bg-black/20'
          : 'bg-slate-100 dark:bg-slate-800/70 border-l-[3.5px] border-indigo-500 px-2.5 py-1 mb-1.5 cursor-pointer hover:bg-slate-200/60 dark:hover:bg-slate-800'
      } ${className}`}
    >
      <div className="flex-1 min-w-0 pr-2">
        <div
          className={`text-[12px] font-bold truncate leading-tight ${
            isMine && !isInputBar
              ? 'text-indigo-200'
              : 'text-indigo-600 dark:text-indigo-400'
          }`}
        >
          {message.sender_name || 'User'}
        </div>
        <div
          className={`flex items-center gap-1.5 text-[12.5px] truncate leading-tight mt-0.5 ${
            isMine && !isInputBar
              ? 'text-white/90'
              : 'text-slate-600 dark:text-slate-300'
          }`}
        >
          {mediaIcon}
          <span className="truncate">
            {message.text_content ||
              (message.media_type === 'image'
                ? 'Photo'
                : message.media_type === 'voice'
                ? 'Voice message'
                : 'Attachment')}
          </span>
        </div>
      </div>

      {isInputBar && onDismiss && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
          className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 active:scale-95 transition-transform"
          aria-label="Cancel reply"
        >
          <X size={16} strokeWidth={2.2} />
        </button>
      )}
    </div>
  );
};
