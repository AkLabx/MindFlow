import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Camera, Image as ImageIcon, Headphones, MapPin, User, X } from 'lucide-react';

interface AttachmentBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onPickImage: () => void;
  onPickDocument: () => void;
  onComingSoon: (feature: string) => void;
}

export const AttachmentBottomSheet: React.FC<AttachmentBottomSheetProps> = ({
  isOpen,
  onClose,
  onPickImage,
  onPickDocument,
  onComingSoon,
}) => {
  if (!isOpen) return null;

  const items = [
    {
      id: 'document',
      label: 'Document',
      icon: <FileText size={24} className="text-white" />,
      bg: 'bg-indigo-600',
      action: () => {
        onClose();
        onPickDocument();
      },
    },
    {
      id: 'camera',
      label: 'Camera',
      icon: <Camera size={24} className="text-white" />,
      bg: 'bg-rose-500',
      action: () => {
        onClose();
        onPickImage();
      },
    },
    {
      id: 'gallery',
      label: 'Gallery',
      icon: <ImageIcon size={24} className="text-white" />,
      bg: 'bg-purple-600',
      action: () => {
        onClose();
        onPickImage();
      },
    },
    {
      id: 'audio',
      label: 'Audio',
      icon: <Headphones size={24} className="text-white" />,
      bg: 'bg-amber-500',
      action: () => {
        onClose();
        onComingSoon('Audio Sharing');
      },
    },
    {
      id: 'location',
      label: 'Location',
      icon: <MapPin size={24} className="text-white" />,
      bg: 'bg-emerald-600',
      action: () => {
        onClose();
        onComingSoon('Location Sharing');
      },
    },
    {
      id: 'contact',
      label: 'Contact',
      icon: <User size={24} className="text-white" />,
      bg: 'bg-sky-500',
      action: () => {
        onClose();
        onComingSoon('Contact Sharing');
      },
    },
  ];

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px]"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="absolute bottom-20 left-4 right-4 max-w-sm mx-auto bg-white dark:bg-[#1F2C34] rounded-3xl p-5 shadow-2xl border border-black/5 dark:border-white/10"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="grid grid-cols-3 gap-y-5 gap-x-4">
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={item.action}
                className="flex flex-col items-center gap-1.5 group active:scale-95 transition-transform"
              >
                <div
                  className={`w-14 h-14 rounded-full ${item.bg} flex items-center justify-center shadow-md group-hover:scale-105 transition-transform`}
                >
                  {item.icon}
                </div>
                <span className="text-[12px] font-medium text-gray-700 dark:text-slate-200">
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
