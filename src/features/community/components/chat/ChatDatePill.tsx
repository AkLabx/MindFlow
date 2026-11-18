import React from 'react';
import { formatDateDivider } from '../../utils/chatTheme';

interface ChatDatePillProps {
  dateString?: string;
  className?: string;
}

export const ChatDatePill: React.FC<ChatDatePillProps> = ({ dateString, className = '' }) => {
  if (!dateString) return null;
  const label = formatDateDivider(dateString);

  return (
    <div className={`flex justify-center my-3 select-none pointer-events-none sticky top-2 z-10 ${className}`}>
      <span className="text-[11px] font-bold tracking-wider uppercase text-slate-500 dark:text-slate-400 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3.5 py-1 rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-slate-200/80 dark:border-slate-800">
        {label}
      </span>
    </div>
  );
};

// Aliased export for backwards compatibility
export const WhatsAppDatePill = ChatDatePill;
