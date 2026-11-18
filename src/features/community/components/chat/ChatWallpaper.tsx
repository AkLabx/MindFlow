import React from 'react';

interface ChatWallpaperProps {
  className?: string;
}

export const ChatWallpaper: React.FC<ChatWallpaperProps> = ({ className = '' }) => {
  return (
    <div
      className={`absolute inset-0 pointer-events-none select-none overflow-hidden z-0 ${className}`}
      aria-hidden="true"
    >
      {/* Background canvas based on MindFlow theme */}
      <div className="absolute inset-0 bg-slate-50 dark:bg-[#020617] transition-colors" />

      {/* MindFlow Neural Synapse / Constellation SVG Pattern */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.035] dark:opacity-[0.025] text-indigo-950 dark:text-indigo-200"
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height="100%"
      >
        <defs>
          <pattern
            id="mindflow-synapse-pattern"
            width="120"
            height="120"
            patternUnits="userSpaceOnUse"
          >
            {/* Primary Neural Node */}
            <circle cx="20" cy="20" r="3.5" fill="currentColor" />
            <circle cx="20" cy="20" r="7" fill="none" stroke="currentColor" strokeWidth="0.8" opacity="0.6" />

            {/* Connecting Synaptic Pathways */}
            <path
              d="M20 20 L60 45 L100 25 M60 45 L50 90 L95 105 M50 90 L15 80 L20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              strokeDasharray="2 3"
            />

            {/* Secondary Nodes */}
            <circle cx="60" cy="45" r="2.5" fill="currentColor" />
            <circle cx="100" cy="25" r="2" fill="currentColor" />
            <circle cx="50" cy="90" r="3" fill="currentColor" />
            <circle cx="95" cy="105" r="2" fill="currentColor" />
            <circle cx="15" cy="80" r="2" fill="currentColor" />

            {/* MindFlow Brain Spark Icon */}
            <path
              d="M78 68 C76 65 73 66 71 69 C69 72 71 76 74 77 C77 78 81 76 81 73 C81 70 80 69 78 68 Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.2"
            />
            <circle cx="75" cy="73" r="1" fill="currentColor" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#mindflow-synapse-pattern)" />
      </svg>
    </div>
  );
};

// Aliased export for backwards compatibility
export const WhatsAppWallpaper = ChatWallpaper;
