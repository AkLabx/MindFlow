import React, { useRef, useState } from 'react';
import { Send, Image as ImageIcon, File, Mic, Sticker } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { useNotification } from '../../../hooks/useNotification';
import { KeyboardAwareBottomBar } from '../../../components/ui/KeyboardAwareBottomBar';
import { isNativeApp } from '../../../utils/platform';

interface ChatInputBarProps {
  isBlocker?: boolean;
  isBlocked?: boolean;
  onUnblock?: () => void;
  onSend: (text: string) => void;
  onUpload: (event: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'file') => void;
  isUploading: boolean;
  onTyping: (isTyping: boolean) => void;
}

export const ChatInputBar: React.FC<ChatInputBarProps> = ({ onSend, onUpload, isUploading, onTyping, isBlocker, isBlocked, onUnblock }) => {
  const [newMessage, setNewMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { showToast } = useNotification();

  const supportsFieldSizing =
    typeof CSS !== 'undefined' &&
    typeof CSS.supports === 'function' &&
    CSS.supports('field-sizing', 'content');

  const submitMessage = () => {
    if (!newMessage.trim() && !isUploading) return;
    onSend(newMessage.trim());
    setNewMessage('');
    onTyping(false);

    // Reset height only when using imperative JS auto-sizing fallback
    if (textareaRef.current && !supportsFieldSizing) {
      textareaRef.current.style.height = '40px';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitMessage();
  };

  const handleTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    onTyping(e.target.value.length > 0);

    if (supportsFieldSizing) return;

    // Auto-resize fallback for browsers without CSS field-sizing: content
    if (textareaRef.current) {
      textareaRef.current.style.height = '40px'; // Reset to calculate exact shrink
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = Math.min(scrollHeight, 120) + 'px';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const isMobile = isNativeApp() || (typeof window !== 'undefined' && window.innerWidth <= 768);

    if (!isMobile) {
      // Desktop: Enter sends, Shift+Enter new line
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (e.nativeEvent.isComposing || e.keyCode === 229) {
          return;
        }
        submitMessage();
      }
    } else {
      // Mobile: Enter simply inserts newline (handled natively by textarea)
    }
  };

  const handleComingSoon = () => {
    showToast({ title: 'Coming Soon', message: 'This feature is not yet available.', variant: 'info' });
  };

  const hasText = newMessage.trim().length > 0;

  if (isBlocked) {
    return (
      <KeyboardAwareBottomBar hasGlobalFooter={false} position="relative" className="!px-3 !pt-2 !pb-3 bg-white dark:bg-slate-950 flex items-center justify-center">
        <div className="bg-gray-100 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-[28px] p-3 text-center w-full text-[14px] text-gray-600 dark:text-slate-400 font-medium h-[52px] flex items-center justify-center">
          You cannot reply to this conversation anymore.
        </div>
      </KeyboardAwareBottomBar>
    );
  }

  if (isBlocker) {
    return (
      <KeyboardAwareBottomBar hasGlobalFooter={false} position="relative" className="!px-3 !pt-2 !pb-3 bg-white dark:bg-slate-950 flex items-center justify-center gap-2">
        <div className="bg-gray-100 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-[28px] px-4 text-center flex-1 text-[14px] text-gray-600 dark:text-slate-400 font-medium h-[52px] flex items-center justify-center">
          You have blocked this user. Unblock to send a message.
        </div>
        <button
          type="button"
          onClick={onUnblock}
          className="h-[52px] px-5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[14px] rounded-[28px] transition-colors whitespace-nowrap shadow-sm"
        >
          Unblock
        </button>
      </KeyboardAwareBottomBar>
    );
  }

  return (
    <KeyboardAwareBottomBar hasGlobalFooter={false} position="relative" className="!px-0 !pt-0 !pb-0 bg-transparent shadow-none border-none">
    <form onSubmit={handleSubmit} className="p-2 bg-white dark:bg-slate-950 border-t border-gray-100 dark:border-slate-800 pb-2 relative w-full">
      <div aria-live="polite" aria-atomic="true">
        {isUploading && (
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs font-semibold text-indigo-500 dark:text-indigo-400 animate-pulse bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-4 py-1.5 rounded-full shadow-sm border border-gray-100 dark:border-slate-800">
            Uploading media...
          </div>
        )}
      </div>

      <div className="flex items-end gap-1.5 bg-gray-100 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-[24px] p-1 pl-3 pr-1 relative overflow-hidden focus-within:ring-2 focus-within:ring-indigo-100 dark:focus-within:ring-indigo-900 focus-within:bg-white dark:focus-within:bg-slate-950 transition-all duration-300">
        <textarea
          ref={textareaRef}
          value={newMessage}
          onChange={handleTyping}
          onKeyDown={handleKeyDown}
          placeholder="Message..."
          aria-label="Message"
          rows={1}
          className="flex-1 bg-transparent border-none text-[15px] text-gray-900 dark:text-slate-100 focus:ring-0 outline-none placeholder:text-gray-500 dark:placeholder:text-slate-500 min-h-[40px] py-[10px] text-base resize-none overflow-y-auto scrollbar-hide max-h-[120px] leading-tight align-bottom self-center mb-0 mt-0"
          style={
            supportsFieldSizing
              ? ({ fieldSizing: 'content', height: 'auto' } as React.CSSProperties)
              : { height: '40px' }
          }
        />

        <input type="file" ref={imageInputRef} accept="image/*" className="hidden text-base" onChange={(e) => onUpload(e, 'image')} />
        <input type="file" ref={fileInputRef} accept=".pdf,.doc,.docx" className="hidden text-base" onChange={(e) => onUpload(e, 'file')} />

        <div className="flex items-center gap-0.5 min-h-[44px] shrink-0 self-end">
          {!hasText ? (
            <>
              <button type="button" onClick={handleComingSoon} className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 rounded-full transition-colors" aria-label="Toggle microphone">
                <Mic size={22} strokeWidth={1.5} />
              </button>
              <button type="button" onClick={() => imageInputRef.current?.click()} className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 rounded-full transition-colors" aria-label="Attach image">
                <ImageIcon size={22} strokeWidth={1.5} />
              </button>
              <button type="button" onClick={handleComingSoon} className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 rounded-full transition-colors" aria-label="Choose sticker">
                <Sticker size={22} strokeWidth={1.5} />
              </button>
            </>
          ) : (
            <button
              type="submit"
              disabled={isUploading}
              className="px-4 min-h-[44px] bg-blue-600 text-white font-semibold text-[15px] rounded-full hover:bg-blue-700 shadow-sm disabled:opacity-50 disabled:bg-gray-300 transition-all flex items-center justify-center"
            >
              Send
            </button>
          )}
        </div>
      </div>
    </form>
    </KeyboardAwareBottomBar>
  );
};
