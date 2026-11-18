import React from 'react';
import { formatDateDivider } from '../../utils/whatsappTheme';

interface WhatsAppDatePillProps {
  dateString?: string;
  className?: string;
}

export const WhatsAppDatePill: React.FC<WhatsAppDatePillProps> = ({ dateString, className = '' }) => {
  if (!dateString) return null;
  const label = formatDateDivider(dateString);

  return (
    <div className={`flex justify-center my-3 select-none pointer-events-none sticky top-2 z-10 ${className}`}>
      <span className="text-[11px] font-semibold tracking-wide text-[#54656F] dark:text-[#8696A0] bg-white/95 dark:bg-[#182229]/95 backdrop-blur-md px-3 py-1 rounded-lg shadow-[0_1px_0.5px_rgba(11,20,26,0.13)] dark:shadow-[0_1px_0.5px_rgba(0,0,0,0.3)] border border-black/5 dark:border-white/5">
        {label}
      </span>
    </div>
  );
};
