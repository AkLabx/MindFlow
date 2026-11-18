import React, { useRef, useState, useEffect } from 'react';
import { Send, Mic, Paperclip, Camera, Smile, Trash2, StopCircle } from 'lucide-react';
import { AttachmentBottomSheet } from './AttachmentBottomSheet';
import { QuotedMessagePreview } from './QuotedMessagePreview';
import { KeyboardAwareBottomBar } from '../../../../components/ui/KeyboardAwareBottomBar';
import { isNativeApp } from '../../../../utils/platform';
import { compressImageToWebP } from '../../utils/mediaCompression';

interface WhatsAppInputBarProps {
  onSend: (text: string) => void;
  onSendVoice?: (audioBlob: Blob, durationSecs: number) => void;
  onUploadMedia: (file: File | Blob, type: 'image' | 'file') => void;
  onTyping: (isTyping: boolean) => void;
  isUploading: boolean;
  replyingTo: {
    id: string;
    sender_name?: string;
    text_content: string;
    media_type?: string | null;
  } | null;
  onDismissReply: () => void;
  isBlocked?: boolean;
  isBlocker?: boolean;
  onUnblock?: () => void;
}

export const WhatsAppInputBar: React.FC<WhatsAppInputBarProps> = ({
  onSend,
  onSendVoice,
  onUploadMedia,
  onTyping,
  isUploading,
  replyingTo,
  onDismissReply,
  isBlocked,
  isBlocker,
  onUnblock,
}) => {
  const [text, setText] = useState('');
  const [isAttachmentOpen, setIsAttachmentOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const hasText = text.trim().length > 0;

  // Auto-resize textarea
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    onTyping(e.target.value.length > 0);

    if (textareaRef.current) {
      textareaRef.current.style.height = '42px';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 120)}px`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const isMobile = isNativeApp() || (typeof window !== 'undefined' && window.innerWidth <= 768);
    if (!isMobile && e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!hasText && !isUploading) return;
    onSend(text.trim());
    setText('');
    onTyping(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = '42px';
    }
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Compress with high-performance Canvas WebP pipeline
      const compressed = await compressImageToWebP(file);
      onUploadMedia(compressed.file, 'image');
    } catch {
      onUploadMedia(file, 'image');
    } finally {
      e.target.value = '';
    }
  };

  const handleDocSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onUploadMedia(file, 'file');
    e.target.value = '';
  };

  // --- Voice Recording Workflow ---
  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Audio recording is not supported on this browser.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(200);
      setIsRecording(true);
      setRecordSeconds(0);

      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(15);
      }

      timerRef.current = setInterval(() => {
        setRecordSeconds((s) => s + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone permission denied or recording failed:', err);
    }
  };

  const stopAndSendRecording = () => {
    if (!mediaRecorderRef.current || !isRecording) return;

    clearInterval(timerRef.current);
    const duration = recordSeconds;

    mediaRecorderRef.current.onstop = () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      if (duration > 0 && onSendVoice) {
        onSendVoice(audioBlob, duration);
      }
      // Stop all tracks
      mediaRecorderRef.current?.stream.getTracks().forEach((t) => t.stop());
    };

    mediaRecorderRef.current.stop();
    setIsRecording(false);
    setRecordSeconds(0);
  };

  const cancelRecording = () => {
    if (!mediaRecorderRef.current) return;
    clearInterval(timerRef.current);
    mediaRecorderRef.current.onstop = () => {
      mediaRecorderRef.current?.stream.getTracks().forEach((t) => t.stop());
    };
    mediaRecorderRef.current.stop();
    setIsRecording(false);
    setRecordSeconds(0);
  };

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      mediaRecorderRef.current?.stream.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (isBlocked) {
    return (
      <KeyboardAwareBottomBar hasGlobalFooter={false} position="relative" className="!p-3 bg-[#EFEAE2] dark:bg-[#0B141A]">
        <div className="bg-white dark:bg-[#1F2C34] rounded-2xl p-3 text-center text-[13px] text-gray-500 dark:text-slate-400 font-medium shadow-sm">
          You cannot reply to this conversation.
        </div>
      </KeyboardAwareBottomBar>
    );
  }

  if (isBlocker) {
    return (
      <KeyboardAwareBottomBar hasGlobalFooter={false} position="relative" className="!p-3 bg-[#EFEAE2] dark:bg-[#0B141A] flex items-center gap-2">
        <div className="bg-white dark:bg-[#1F2C34] rounded-2xl p-3 text-center flex-1 text-[13px] text-gray-500 dark:text-slate-400 font-medium shadow-sm">
          You have blocked this contact.
        </div>
        <button
          type="button"
          onClick={onUnblock}
          className="h-10 px-4 bg-[#00A884] hover:bg-[#008f6f] text-white font-semibold text-xs rounded-xl shadow-sm transition-colors"
        >
          Unblock
        </button>
      </KeyboardAwareBottomBar>
    );
  }

  return (
    <KeyboardAwareBottomBar
      hasGlobalFooter={false}
      position="relative"
      className="!px-2 !pt-1 !pb-2 bg-transparent shadow-none border-none z-20"
    >
      {/* Hidden File Pickers */}
      <input
        type="file"
        ref={imageInputRef}
        accept="image/*"
        className="hidden"
        onChange={handleImageSelect}
      />
      <input
        type="file"
        ref={docInputRef}
        accept=".pdf,.doc,.docx,.txt"
        className="hidden"
        onChange={handleDocSelect}
      />

      {/* Attachment Sheet */}
      <AttachmentBottomSheet
        isOpen={isAttachmentOpen}
        onClose={() => setIsAttachmentOpen(false)}
        onPickImage={() => imageInputRef.current?.click()}
        onPickDocument={() => docInputRef.current?.click()}
        onComingSoon={(feature) => alert(`${feature} is coming soon!`)}
      />

      {/* Quoted Message Preview pinned above input */}
      {replyingTo && (
        <QuotedMessagePreview
          message={replyingTo}
          onDismiss={onDismissReply}
          variant="inputBar"
        />
      )}

      {/* Main WhatsApp Dual-Capsule Layout */}
      <div className="flex items-end gap-1.5 w-full">
        {/* Left Input Capsule (White/Dark Gray) */}
        <div className="flex-1 min-w-0 bg-white dark:bg-[#1F2C34] rounded-[24px] px-2.5 py-1 flex items-center gap-1.5 shadow-[0_1px_1px_rgba(0,0,0,0.12)] border border-black/5 dark:border-white/5 transition-all">
          {isRecording ? (
            /* Recording Mode inside Capsule */
            <div className="flex items-center justify-between w-full h-[42px] px-1 select-none">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
                <span className="text-sm font-semibold text-red-500 font-mono">
                  {formatTimer(recordSeconds)}
                </span>
              </div>
              <button
                type="button"
                onClick={cancelRecording}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 px-2 py-1 rounded-full transition-colors"
              >
                <Trash2 size={16} /> Cancel
              </button>
            </div>
          ) : (
            /* Normal Typing Mode inside Capsule */
            <>
              <button
                type="button"
                onClick={() => {}}
                className="p-1 text-[#8696A0] hover:text-[#54656F] dark:hover:text-[#E9EDEF] active:scale-95 transition-transform shrink-0"
                aria-label="Emoji picker"
              >
                <Smile size={24} strokeWidth={1.8} />
              </button>

              <textarea
                ref={textareaRef}
                value={text}
                onChange={handleTextChange}
                onKeyDown={handleKeyDown}
                placeholder="Message"
                rows={1}
                className="flex-1 bg-transparent border-none text-[15px] text-[#111B21] dark:text-[#E9EDEF] focus:ring-0 outline-none placeholder:text-[#8696A0] min-h-[42px] max-h-[120px] py-[10px] resize-none overflow-y-auto leading-tight"
              />

              <button
                type="button"
                onClick={() => setIsAttachmentOpen(true)}
                className="p-1 text-[#8696A0] hover:text-[#54656F] dark:hover:text-[#E9EDEF] active:scale-95 transition-transform shrink-0"
                aria-label="Attach file"
              >
                <Paperclip size={22} strokeWidth={1.8} className="rotate-45" />
              </button>

              {!hasText && (
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className="p-1 text-[#8696A0] hover:text-[#54656F] dark:hover:text-[#E9EDEF] active:scale-95 transition-transform shrink-0"
                  aria-label="Camera shortcut"
                >
                  <Camera size={22} strokeWidth={1.8} />
                </button>
              )}
            </>
          )}
        </div>

        {/* Right WhatsApp Green Circular FAB (48px) */}
        {isRecording ? (
          <button
            type="button"
            onClick={stopAndSendRecording}
            className="w-12 h-12 rounded-full bg-[#00A884] text-white flex items-center justify-center shrink-0 shadow-md active:scale-90 transition-transform"
            aria-label="Send voice message"
          >
            <Send size={20} fill="white" className="ml-0.5" />
          </button>
        ) : hasText ? (
          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={isUploading}
            className="w-12 h-12 rounded-full bg-[#00A884] text-white flex items-center justify-center shrink-0 shadow-md active:scale-90 transition-transform disabled:opacity-50"
            aria-label="Send message"
          >
            <Send size={20} fill="white" className="ml-0.5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={startRecording}
            className="w-12 h-12 rounded-full bg-[#00A884] text-white flex items-center justify-center shrink-0 shadow-md active:scale-90 transition-transform"
            aria-label="Record voice note"
          >
            <Mic size={22} strokeWidth={2.2} />
          </button>
        )}
      </div>
    </KeyboardAwareBottomBar>
  );
};
