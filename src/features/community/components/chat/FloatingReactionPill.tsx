import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Reply, Copy, Trash2 } from 'lucide-react';

interface FloatingReactionPillProps {
  isOpen: boolean;
  onClose: () => void;
  onReact: (emoji: string) => void;
  onReply?: () => void;
  onCopy?: () => void;
  onDelete?: () => void;
  canDelete?: boolean;
  isMine: boolean;
  currentReaction?: string | null;
}

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

export const FloatingReactionPill: React.FC<FloatingReactionPillProps> = ({
  isOpen,
  onClose,
  onReact,
  onReply,
  onCopy,
  onDelete,
  canDelete = false,
  isMine,
  currentReaction,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]" onClick={onClose}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 10 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="flex flex-col items-center gap-2 max-w-xs w-full"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Reaction Emoji Pill */}
          <div className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-900 rounded-full shadow-2xl border border-slate-200/80 dark:border-slate-800">
            {QUICK_EMOJIS.map((emoji) => {
              const isSelected = currentReaction === emoji;
              return (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    onReact(emoji);
                    onClose();
                  }}
                  className={`text-2xl p-1.5 rounded-full hover:scale-125 active:scale-95 transition-transform ${
                    isSelected ? 'bg-indigo-500/20 scale-110' : ''
                  }`}
                  aria-label={`React with ${emoji}`}
                >
                  {emoji}
                </button>
              );
            })}
          </div>

          {/* Quick Context Actions */}
          <div className="flex items-center gap-3 bg-white dark:bg-slate-900 px-4 py-2 rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-200">
            {onReply && (
              <button
                type="button"
                onClick={() => {
                  onReply();
                  onClose();
                }}
                className="flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Reply size={16} /> Reply
              </button>
            )}

            {onCopy && (
              <button
                type="button"
                onClick={() => {
                  onCopy();
                  onClose();
                }}
                className="flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Copy size={16} /> Copy
              </button>
            )}

            {canDelete && onDelete && (
              <button
                type="button"
                onClick={() => {
                  onDelete();
                  onClose();
                }}
                className="flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
              >
                <Trash2 size={16} /> Delete
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
