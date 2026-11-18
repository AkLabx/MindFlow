import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, ArrowLeft } from 'lucide-react';

interface MediaLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  mediaUrl: string | null;
  senderName?: string;
  timestamp?: string;
}

export const MediaLightbox: React.FC<MediaLightboxProps> = ({
  isOpen,
  onClose,
  mediaUrl,
  senderName = 'Photo',
  timestamp,
}) => {
  if (!isOpen || !mediaUrl) return null;

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = mediaUrl;
    a.download = `mindflow-media-${Date.now()}.webp`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black flex flex-col select-none"
        onClick={onClose}
      >
        {/* Top Header */}
        <div
          className="flex items-center justify-between px-3 py-3 bg-gradient-to-b from-black/80 to-transparent text-white z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/20 active:scale-95 transition-transform"
              aria-label="Close media viewer"
            >
              <ArrowLeft size={22} />
            </button>
            <div>
              <div className="font-semibold text-sm leading-tight">{senderName}</div>
              {timestamp && <div className="text-xs text-white/70 leading-tight">{timestamp}</div>}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="p-2 rounded-full hover:bg-white/20 active:scale-95 transition-transform"
              aria-label="Download image"
            >
              <Download size={20} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/20 active:scale-95 transition-transform"
              aria-label="Close"
            >
              <X size={22} />
            </button>
          </div>
        </div>

        {/* Image Display Area with Pan & Zoom */}
        <div className="flex-1 flex items-center justify-center p-2 overflow-hidden">
          <motion.img
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            src={mediaUrl}
            alt="Chat media"
            className="max-h-full max-w-full object-contain cursor-default"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
