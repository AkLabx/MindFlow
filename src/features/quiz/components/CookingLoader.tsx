import React from 'react';

interface CookingLoaderProps {
  progress: number;
  syncedItems: number;
  totalItems: number;
}

export const CookingLoader: React.FC<CookingLoaderProps> = ({ progress, syncedItems, totalItems }) => {
  const getStatusText = () => {
    if (progress === 0) return "Connecting to Database...";
    if (progress < 15) return "Warming up the neural network...";
    if (progress < 40) return "Gathering data ingredients...";
    if (progress < 70) return "Cooking your questions...";
    if (progress < 90) return "Garnishing with analytics...";
    if (progress < 100) return "Plating the final quiz...";
    return "Ready to serve!";
  };

  // Logic: Flip the scene every 25%
  // At 100% (4th quarter), it gracefully returns to the original left-to-right state.
  const isFlipped = Math.floor(progress / 25) % 2 !== 0 && progress !== 100;

  // 3D Spin transition for the entire scene
  const sceneFlipStyle = {
    transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
    transformOrigin: '160px 140px', // Exact center of the 320x280 SVG viewBox
    transition: 'transform 0.7s cubic-bezier(0.68, -0.1, 0.265, 1.1)' // Springy, swift snap
  };

  // Counter-spin for text to prevent them from becoming mirror images
  const textFlipStyle = {
    transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
    transformOrigin: 'center',
    transformBox: 'fill-box' as const,
    transition: 'transform 0.7s cubic-bezier(0.68, -0.1, 0.265, 1.1)'
  };

  return (
    <div className="w-full flex flex-col items-center justify-center font-sans h-full min-h-[60vh]">
      <style>
        {`
          /* --- Robot Arm Animation --- */
          @keyframes stirMotion {
            0% { transform: rotate(-8deg); }
            50% { transform: rotate(8deg); }
            100% { transform: rotate(-8deg); }
          }
          .stir-group {
            transform-origin: 100px 145px;
            animation: stirMotion 2s infinite ease-in-out;
          }

          /* --- Question Bubbles Animation --- */
          @keyframes floatBubble {
            0% { transform: translateY(0) scale(0.3) rotate(-10deg); opacity: 0; }
            20% { opacity: 1; transform: translateY(-15px) scale(0.8) rotate(5deg); }
            80% { opacity: 0.9; }
            100% { transform: translateY(-70px) scale(1.3) rotate(-15deg); opacity: 0; }
          }
          .bubble {
            animation: floatBubble 2.2s infinite cubic-bezier(0.35, 0.1, 0.25, 1);
            transform-origin: center;
          }
          .b-delay-1 { animation-delay: 0.2s; }
          .b-delay-2 { animation-delay: 1.1s; }
          .b-delay-3 { animation-delay: 1.7s; }

          /* --- ADVANCED FLAME ANIMATIONS --- */
          @keyframes flameFlicker {
            0%   { transform: scaleY(0.85) scaleX(0.95); opacity: 0.9; }
            33%  { transform: scaleY(1.1) scaleX(1.05) skewX(3deg); opacity: 1; }
            66%  { transform: scaleY(0.9) scaleX(0.98) skewX(-2deg); opacity: 0.85; }
            100% { transform: scaleY(1.15) scaleX(1.02); opacity: 1; }
          }
          .flame-group {
            transform-origin: 200px 248px;
            animation: flameFlicker 0.45s infinite alternate ease-in-out;
          }

          @keyframes haloGlow {
            0%, 100% { opacity: 0.3; transform: scale(1); }
            50%      { opacity: 0.6; transform: scale(1.08); }
          }
          .flame-halo {
            animation: haloGlow 0.8s infinite alternate ease-in-out;
            transform-origin: 200px 250px;
          }

          /* --- STEAM/VAPOUR ANIMATIONS --- */
          @keyframes steamRise {
            0%   { transform: translateY(0) scaleX(1); opacity: 0; }
            15%  { opacity: 0.6; }
            60%  { opacity: 0.35; transform: translateY(-55px) scaleX(1.4) skewX(8deg); }
            100% { transform: translateY(-90px) scaleX(0.8) skewX(-5deg); opacity: 0; }
          }
          .steam {
            animation: steamRise 2.8s infinite cubic-bezier(0.25, 0.1, 0.25, 1);
          }
          .s1 { animation-delay: 0s; }
          .s2 { animation-delay: 0.9s; }
          .s3 { animation-delay: 1.8s; }

          /* --- Robot Eyes Animation --- */
          @keyframes blink {
            0%, 96%, 100% { transform: scaleY(1); }
            98% { transform: scaleY(0.1); }
          }
          .eyes {
            transform-origin: center;
            animation: blink 4s infinite;
          }

          /* --- Progress Bar Shimmer --- */
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(200%); }
          }
        `}
      </style>

      {/* Main UI Card */}
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-3xl overflow-hidden shadow-xl shadow-indigo-100/50 dark:shadow-none flex flex-col items-center py-10 px-6 relative transition-colors duration-300">

        {/* Visual Canvas */}
        <div className="relative w-full aspect-square max-h-72 mb-2" style={{ perspective: '800px' }}>
          <svg viewBox="0 0 320 280" className="w-full h-full" xmlns="http://www.w3.org/2000/svg" style={{ overflow: 'visible' }}>

            <defs>
              <clipPath id="inside-kadahi">
                <rect x="0" y="0" width="320" height="190" />
                <path d="M 124,190 C 124,254 276,254 276,190 Z" />
              </clipPath>

              {/* Advanced Gradients for Flame Integration */}
              <radialGradient id="flameOuter" cx="50%" cy="80%" r="60%">
                <stop offset="0%" stopColor="#fff7ed" />
                <stop offset="30%" stopColor="#fcd34d" />
                <stop offset="70%" stopColor="#ea580c" />
                <stop offset="100%" stopColor="#9a3412" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="flameInner" cx="50%" cy="80%" r="50%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="40%" stopColor="#fef08a" />
                <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
              </radialGradient>

              <filter id="softGlow">
                <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>

            {/* Soft background aura (Outside the flip wrapper to remain static) */}
            <ellipse cx="160" cy="180" rx="140" ry="80" className="fill-purple-100 dark:fill-purple-900/30 opacity-40 dark:opacity-20" />

            {/* --- FLIP SCENE WRAPPER --- */}
            {/* All interactive/character elements are placed here so they flip smoothly together */}
            <g style={sceneFlipStyle}>

              {/* Ambient floor glow from flames */}
              <ellipse cx="200" cy="250" rx="70" ry="15" fill="rgba(234,88,12,0.15)" filter="url(#softGlow)" className="flame-halo" />

              {/* --- LAYER 1: STOVE BASE --- */}
              <path d="M 140,242 L 260,242 L 250,252 L 150,252 Z" className="fill-slate-600 dark:fill-slate-700" />
              <path d="M 145,252 L 255,252 L 250,256 L 150,256 Z" className="fill-slate-700 dark:fill-slate-800" />

              {/* --- LAYER 2: CHEF BOT (BACKGROUND BODY) --- */}
              <g id="chef-bot">
                <rect x="50" y="140" width="50" height="90" rx="15" className="fill-slate-200 dark:fill-slate-700" />
                <path d="M 50,160 L 100,160 L 100,230 Q 75,240 50,230 Z" className="fill-slate-300 dark:fill-slate-600" />
                <rect x="65" y="125" width="20" height="20" className="fill-slate-400 dark:fill-slate-500" />
                <rect x="40" y="70" width="70" height="60" rx="12" className="fill-slate-50 dark:fill-slate-800 stroke-slate-300 dark:stroke-slate-600" strokeWidth="2" />
                <rect x="48" y="80" width="54" height="35" rx="6" className="fill-slate-800 dark:fill-slate-900" />

                <g className="eyes">
                  <path d="M 55,95 Q 60,90 65,95" fill="none" stroke="#22d3ee" strokeWidth="3" strokeLinecap="round" />
                  <path d="M 85,95 Q 90,90 95,95" fill="none" stroke="#22d3ee" strokeWidth="3" strokeLinecap="round" />
                </g>

                <g className="fill-white dark:fill-slate-800 stroke-slate-200 dark:stroke-slate-600" strokeWidth="1.5">
                  <circle cx="55" cy="55" r="18" />
                  <circle cx="95" cy="55" r="18" />
                  <circle cx="75" cy="40" r="22" />
                  <rect x="45" y="60" width="60" height="15" rx="4" stroke="none" />
                  <path d="M 45,60 L 105,60" fill="none" className="stroke-slate-200 dark:stroke-slate-600" strokeWidth="1.5" />
                </g>
              </g>

              {/* --- LAYER 3: KADAHI SOLID BODY --- */}
              <g id="kadahi-body">
                <path d="M 120,190 C 120,260 280,260 280,190 Z" className="fill-slate-700 dark:fill-slate-900" />
                <ellipse cx="200" cy="190" rx="80" ry="20" className="fill-slate-800 dark:fill-black" />
                <ellipse cx="200" cy="195" rx="73" ry="15" className="fill-purple-600 dark:fill-purple-800" />
              </g>

              {/* --- LAYER 4: ADVANCED FLAMES --- */}
              <g className="flame-group">
                <ellipse cx="200" cy="245" rx="45" ry="12" fill="rgba(234,88,12,0.3)" filter="url(#softGlow)" />
                <path d="M 162,248 Q 170,218 180,248 Q 188,222 196,248 Q 204,220 212,248 Q 220,222 228,248 Q 236,220 242,248 Z" fill="url(#flameOuter)" opacity="0.9" />
                <path d="M 172,248 Q 180,230 188,248 Q 196,228 204,248 Q 212,228 220,248 Q 228,232 232,248 Z" fill="#f97316" opacity="0.85" />
                <path d="M 180,248 Q 188,235 196,248 Q 204,234 212,248 Q 218,237 224,248 Z" fill="url(#flameInner)" opacity="0.95" />
                <path d="M 188,248 Q 194,240 200,248 Q 206,239 212,248 Z" fill="white" opacity="0.7" />
              </g>

              {/* --- LAYER 5: THE ARM & LADLE --- */}
              <g className="stir-group" clipPath="url(#inside-kadahi)">
                <circle cx="90" cy="150" r="10" className="fill-slate-500 dark:fill-slate-400" />
                <line x1="90" y1="150" x2="135" y2="165" className="stroke-slate-400 dark:stroke-slate-300" strokeWidth="12" strokeLinecap="round" />

                <circle cx="135" cy="165" r="12" className="fill-slate-300 dark:fill-slate-200" />
                <circle cx="135" cy="165" r="6" className="fill-slate-400 dark:fill-slate-300" />

                <line x1="125" y1="160" x2="175" y2="190" className="stroke-amber-700 dark:stroke-amber-600" strokeWidth="7" strokeLinecap="round" />
                <ellipse cx="175" cy="190" rx="18" ry="7" className="fill-amber-600 dark:fill-amber-500" transform="rotate(30, 175, 190)" />
              </g>

              {/* --- LAYER 6: THE FOREGROUND SOUP --- */}
              <ellipse cx="200" cy="196" rx="70" ry="14" className="fill-purple-700 dark:fill-purple-600" opacity="0.6" />
              <path d="M 170,205 Q 195,215 220,200 Q 200,215 170,205 Z" className="fill-purple-500 dark:fill-purple-400" opacity="0.9" />

              {/* --- LAYER 7: KADAHI FRONT LIP --- */}
              <path d="M 120,190 A 80 20 0 0 0 280,190" fill="none" className="stroke-slate-600 dark:stroke-slate-700" strokeWidth="6" strokeLinecap="round" />
              <path d="M 120,190 C 105,190 105,210 120,210" fill="none" className="stroke-slate-700 dark:stroke-slate-800" strokeWidth="8" strokeLinecap="round" />
              <path d="M 280,190 C 295,190 295,210 280,210" fill="none" className="stroke-slate-700 dark:stroke-slate-800" strokeWidth="8" strokeLinecap="round" />

              {/* --- LAYER 8: STEAM WISPS --- */}
              <g opacity="0.8" filter="url(#softGlow)">
                <path className="steam s1" d="M 175,190 Q 168,170 175,155 Q 182,140 175,125" fill="none" stroke="rgba(167, 139, 250, 0.6)" strokeWidth="4.5" strokeLinecap="round" />
                <path className="steam s2" d="M 200,188 Q 208,168 200,152 Q 192,136 200,120" fill="none" stroke="rgba(196, 181, 253, 0.5)" strokeWidth="6" strokeLinecap="round" />
                <path className="steam s3" d="M 225,190 Q 232,170 225,155 Q 218,140 226,125" fill="none" stroke="rgba(167, 139, 250, 0.5)" strokeWidth="4" strokeLinecap="round" />
              </g>

              {/* --- LAYER 9: FLOATING QUESTIONS --- */}
              <g className="bubble b-delay-1" fill="#c084fc" fontWeight="800" fontSize="32" fontFamily="monospace">
                <text x="170" y="180" style={textFlipStyle}>?</text>
              </g>
              <g className="bubble b-delay-2" fill="#a855f7" fontWeight="800" fontSize="24" fontFamily="monospace">
                <text x="210" y="190" style={textFlipStyle}>?</text>
              </g>
              <g className="bubble b-delay-3" fill="#9333ea" fontWeight="800" fontSize="38" fontFamily="monospace">
                <text x="190" y="170" style={textFlipStyle}>?</text>
              </g>

            </g> {/* END OF FLIP SCENE WRAPPER */}
          </svg>
        </div>

        {/* Text Details */}
        <div className="text-center w-full px-2">
          <h2 className="text-2xl font-extrabold text-slate-800 dark:text-gray-100 mb-2 transition-colors duration-500">
            {progress === 100 ? "Sync Complete!" : "Syncing Question Bank"}
          </h2>
          <div className="text-[15px] font-semibold text-[#7c3aed] dark:text-purple-400 h-6 flex items-center justify-center space-x-1">
            <span>{getStatusText()}</span>
            {progress < 100 && (
              <span className="flex space-x-1 mt-1">
                <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
                <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
                <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
              </span>
            )}
          </div>
        </div>

        {/* Progress Metrics Area - Circular Burner Ring */}
        <div className="w-full mt-8 flex justify-center items-center">
          <div className="relative flex justify-center items-center" style={{ width: 140, height: 140 }}>
            <svg
              width={140}
              height={140}
              viewBox="0 0 140 140"
              className="transform -rotate-90 drop-shadow-[0_0_10px_rgba(234,88,12,0.3)]"
            >
              {/* Defs for gradients and glow */}
              <defs>
                <linearGradient id="burnerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#fcd34d" />
                  <stop offset="50%" stopColor="#f97316" />
                  <stop offset="100%" stopColor="#ea580c" />
                </linearGradient>
                <filter id="burnerGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Background Track Ring */}
              <circle
                cx={70}
                cy={70}
                r={60}
                fill="none"
                stroke="currentColor"
                strokeWidth={10}
                className="text-slate-100 dark:text-slate-800"
              />

              {/* Foreground Progress Ring */}
              <circle
                cx={70}
                cy={70}
                r={60}
                fill="none"
                stroke="url(#burnerGradient)"
                strokeWidth={10}
                strokeLinecap="round"
                filter="url(#burnerGlow)"
                style={{
                  strokeDasharray: `${2 * Math.PI * 60}`,
                  strokeDashoffset: `${(2 * Math.PI * 60) - ((progress / 100) * (2 * Math.PI * 60))}`,
                  transition: 'stroke-dashoffset 0.5s ease-out'
                }}
              />
            </svg>

            {/* Center Percentage Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-slate-800 dark:text-gray-100 drop-shadow-md">
                {Math.round(progress)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
