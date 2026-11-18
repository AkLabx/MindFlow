import React from 'react';
import { Clock } from 'lucide-react';
import { WHATSAPP_COLORS } from '../../utils/whatsappTheme';

interface WhatsAppReceiptTicksProps {
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'error';
  className?: string;
}

export const WhatsAppReceiptTicks: React.FC<WhatsAppReceiptTicksProps> = ({
  status = 'sent',
  className = '',
}) => {
  if (status === 'sending') {
    return <Clock size={11} className={`text-[#8696A0] animate-spin-slow ${className}`} aria-label="Sending" />;
  }

  if (status === 'error') {
    return (
      <span className={`text-red-500 text-[10px] font-bold ${className}`} title="Failed to send">
        !
      </span>
    );
  }

  const isRead = status === 'read';
  const isDelivered = status === 'delivered';
  const tickColor = isRead ? WHATSAPP_COLORS.receipts.read : WHATSAPP_COLORS.receipts.sent;

  return (
    <span
      className={`inline-flex items-center select-none ${className}`}
      title={isRead ? 'Read' : isDelivered ? 'Delivered' : 'Sent'}
      aria-label={isRead ? 'Read' : isDelivered ? 'Delivered' : 'Sent'}
    >
      {/* WhatsApp SVG Checkmarks */}
      <svg
        viewBox="0 0 16 11"
        width="15"
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
