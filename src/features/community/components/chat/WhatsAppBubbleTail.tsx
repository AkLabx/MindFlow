import React from 'react';

interface WhatsAppBubbleTailProps {
  isMine: boolean;
  className?: string;
}

export const WhatsAppBubbleTail: React.FC<WhatsAppBubbleTailProps> = ({ isMine, className = '' }) => {
  if (isMine) {
    return (
      <svg
        viewBox="0 0 8 13"
        width="8"
        height="13"
        className={`absolute -right-2 top-0 pointer-events-none ${className}`}
        aria-hidden="true"
      >
        <path
          d="M0 0 C3 0 7 2 8 0 C8 4 6 9 0 13 Z"
          className="fill-[#D9FDD3] dark:fill-[#005C4B]"
        />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 8 13"
      width="8"
      height="13"
      className={`absolute -left-2 top-0 pointer-events-none ${className}`}
      aria-hidden="true"
    >
      <path
        d="M8 0 C5 0 1 2 0 0 C0 4 2 9 8 13 Z"
        className="fill-white dark:fill-[#1F2C34]"
      />
    </svg>
  );
};
