import React from 'react';
import { X, Reply, Image as ImageIcon, File, Mic } from 'lucide-react';
import { ChatMessage } from '../../api/chatApi';

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
  className?: string;
}

export const QuotedMessagePreview: React.FC<QuotedMessagePreviewProps> = ({
  message,
  onDismiss,
  onClick,
  variant = 'inputBar',
  className = '',
}) => {
  const isInputBar = variant === 'inputBar';

  let mediaIcon = null;
  if (message.media_type === 'image') {
    mediaIcon = <ImageIcon size={14} className="text-[#00A884]" />;
  } else if (message.media_type === 'voice') {
    mediaIcon = <Mic size={14} className="text-[#00A884]" />;
  } else if (message.media_type === 'file') {
    mediaIcon = <File size={14} className="text-[#00A884]" />;
  }

  return (
    <div
      onClick={onClick}
      className={`relative flex items-center justify-between rounded-lg overflow-hidden transition-all ${
        isInputBar
          ? 'bg-gray-100/90 dark:bg-[#1F2C34]/90 border-l-4 border-[#00A884] px-3 py-1.5 mx-2 mb-1 shadow-sm'
          : 'bg-black/5 dark:bg-white/5 border-l-[3.5px] border-[#00A884] px-2.5 py-1 mb-1.5 cursor-pointer hover:bg-black/10'
      } ${className}`}
    >
      <div className="flex-1 min-w-0 pr-2">
        <div className="text-[12px] font-bold text-[#00A884] dark:text-[#25D366] truncate leading-tight">
          {message.sender_name || 'You'}
        </div>
        <div className="flex items-center gap-1.5 text-[13px] text-gray-700 dark:text-slate-300 truncate leading-tight mt-0.5">
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
          className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 active:scale-95 transition-transform"
          aria-label="Cancel reply"
        >
          <X size={16} strokeWidth={2.2} />
        </button>
      )}
    </div>
  );
};
