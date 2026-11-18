import React from 'react';

interface WhatsAppWallpaperProps {
  className?: string;
}

export const WhatsAppWallpaper: React.FC<WhatsAppWallpaperProps> = ({ className = '' }) => {
  return (
    <div
      className={`absolute inset-0 pointer-events-none select-none overflow-hidden z-0 ${className}`}
      aria-hidden="true"
    >
      {/* Background color based on theme */}
      <div className="absolute inset-0 bg-[#EFEAE2] dark:bg-[#0B141A] transition-colors" />

      {/* SVG Doodle Pattern Overlay */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.06] dark:opacity-[0.035] text-black dark:text-white"
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height="100%"
      >
        <defs>
          <pattern
            id="whatsapp-doodle-pattern"
            width="140"
            height="140"
            patternUnits="userSpaceOnUse"
          >
            {/* Coffee cup */}
            <path
              d="M20 20 h16 v12 a8 8 0 0 1 -16 0 z M36 24 h4 a3 3 0 0 1 0 6 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            {/* Speech bubble */}
            <path
              d="M70 25 a10 10 0 0 1 10 10 c0 6 -4 9 -7 10 l-3 5 v-5 a10 10 0 0 1 -10 -10 a10 10 0 0 1 10 -10 z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            {/* Heart */}
            <path
              d="M120 25 c-3 -4 -8 -4 -11 0 l-1 1 l-1 -1 c-3 -4 -8 -4 -11 0 c-3 4 -3 10 2 15 l10 10 l10 -10 c5 -5 5 -11 1 -15 z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
            />
            {/* Music note */}
            <path
              d="M25 80 v18 a4 4 0 1 1 -3 -3.8 v-14.2 l12 -3 v17 a4 4 0 1 1 -3 -3.8 v-13 z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
            />
            {/* Star */}
            <path
              d="M75 75 l3 7 l7 1 l-5 5 l1 7 l-6 -3 l-6 3 l1 -7 l-5 -5 l7 -1 z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            {/* Headphone */}
            <path
              d="M110 85 a12 12 0 0 1 24 0 v8 a3 3 0 0 1 -3 3 h-2 v-8 h3 v-3 a10 10 0 0 0 -20 0 v3 h3 v8 h-2 a3 3 0 0 1 -3 -3 z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
            />
            {/* Paper plane */}
            <path
              d="M30 120 l22 -10 l-10 22 l-4 -8 z M38 124 l8 -8"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            {/* Smile face */}
            <circle cx="85" cy="120" r="10" fill="none" stroke="currentColor" strokeWidth="1.6" />
            <circle cx="82" cy="117" r="1.2" fill="currentColor" />
            <circle cx="88" cy="117" r="1.2" fill="currentColor" />
            <path d="M81 123 q4 3 8 0" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            {/* Camera */}
            <path
              d="M115 115 h5 l2 -3 h6 l2 3 h5 a3 3 0 0 1 3 3 v12 a3 3 0 0 1 -3 3 h-20 a3 3 0 0 1 -3 -3 v-12 a3 3 0 0 1 3 -3 z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <circle cx="125" cy="122" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#whatsapp-doodle-pattern)" />
      </svg>
    </div>
  );
};
