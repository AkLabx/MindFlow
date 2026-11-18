import React from 'react';
import { Clock } from 'lucide-react';
import { CHAT_COLORS } from '../../utils/chatTheme';

interface ChatReceiptTicksProps {
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'error';
  className?: string;
  inOutgoingBubble?: boolean;
}

export const ChatReceiptTicks: React.FC<ChatReceiptTicksProps> = ({
  status = 'sent',
  className = '',
  inOutgoingBubble = true,
}) => {
  if (status === 'sending') {
    return <Clock size={11} className={`${inOutgoingBubble ? 'text-indigo-200' : 'text-slate-400'} animate-spin-slow ${className}`} aria-label="Sending" />;
  }

  if (status === 'error') {
    return (
      <span className={`text-rose-300 font-bold text-[10px] ${className}`} title="Failed to send">
        !
      </span>
    );
  }

  const isRead = status === 'read';
  const isDelivered = status === 'delivered';
  const tickColor = isRead
    ? CHAT_COLORS.receipts.read // #38BDF8
    : inOutgoingBubble
    ? '#C7D2FE' // Soft indigo for outgoing contrast
    : CHAT_COLORS.receipts.sent; // #94A3B8

  return (
    <span
      className={`inline-flex items-center select-none ${className}`}
      title={isRead ? 'Read' : isDelivered ? 'Delivered' : 'Sent'}
      aria-label={isRead ? 'Read' : isDelivered ? 'Delivered' : 'Sent'}
    >
      <svg
        viewBox="0 0 16 11"
        width="14"
        height="10"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="inline-block"
      >
        {/* First Check */}
        <path
          d="M4.5 9.5L1 6L2.4 4.6L4.5 6.7L10.6 0.6L12 2L4.5 9.5Z"
          fill={tickColor}
        />
        {/* Second Check (for delivered and read) */}
        {(isDelivered || isRead) && (
          <path
            d="M8.5 9.5L5 6L6.4 4.6L8.5 6.7L14.6 0.6L16 2L8.5 9.5Z"
            fill={tickColor}
          />
        )}
      </svg>
    </span>
  );
};

// Aliased export for backwards compatibility
export const WhatsAppReceiptTicks = ChatReceiptTicks;
