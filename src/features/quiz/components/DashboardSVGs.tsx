import React from 'react';
import { motion } from 'framer-motion';

// 1. Create Quiz (Indigo)
export const CreateQuizSVG = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg" style={{ perspective: '800px' }}>
    <defs>
      <linearGradient id="createGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#818CF8" />
        <stop offset="100%" stopColor="#6366F1" />
      </linearGradient>
    </defs>
    {/* Floating Building Blocks */}
    {[
      { x: 30, y: 50, w: 20, h: 20, rx: 4, d: 0 },
      { x: 55, y: 30, w: 25, h: 20, rx: 4, d: 0.3 },
      { x: 40, y: 20, w: 15, h: 15, rx: 4, d: 0.6 },
    ].map((block, i) => (
      <motion.rect
        key={i}
        x={block.x} y={block.y} width={block.w} height={block.h} rx={block.rx}
        fill="url(#createGrad)" opacity="0.8"
        animate={{ y: [block.y, block.y - 10, block.y], rotateZ: [0, 5, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: block.d }}
      />
    ))}
    {/* Dynamic Connecting Lines */}
    <motion.path
      d="M20 70 Q40 50 60 70 T80 50"
      fill="none" stroke="#C7D2FE" strokeWidth="3" strokeLinecap="round"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", repeatType: "reverse" }}
    />
    {/* Plus Icon Center */}
    <motion.g animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>
      <circle cx="70" cy="70" r="12" fill="#4F46E5" />
      <path d="M70 64 L70 76 M64 70 L76 70" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </motion.g>
  </svg>
);

// 2. Created Quizzes (Emerald)
export const SavedQuizzesSVG = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
    <defs>
      <linearGradient id="savedGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#34D399" />
        <stop offset="100%" stopColor="#059669" />
      </linearGradient>
    </defs>
    {/* Background Papers */}
    <motion.rect x="30" y="25" width="40" height="50" rx="4" fill="#A7F3D0" opacity="0.5" animate={{ y: [25, 23, 25], rotateZ: [-5, -7, -5] }} transition={{ duration: 3, repeat: Infinity }} />
    <motion.rect x="30" y="30" width="40" height="50" rx="4" fill="#6EE7B7" opacity="0.8" animate={{ y: [30, 28, 30], rotateZ: [5, 7, 5] }} transition={{ duration: 3, repeat: Infinity, delay: 0.2 }} />

    {/* Foreground Paper with Checkmark */}
    <motion.g animate={{ y: [35, 30, 35] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
      <rect x="30" y="35" width="40" height="50" rx="4" fill="url(#savedGrad)" />
      {/* Animated Checkmark */}
      <motion.path
        d="M40 55 L47 62 L60 45"
        fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1 }}
      />
    </motion.g>
  </svg>
);

// 3. English Zone (Rose)
export const EnglishZoneSVG = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
    <defs>
      <linearGradient id="englishGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FB7185" />
        <stop offset="100%" stopColor="#E11D48" />
      </linearGradient>
    </defs>
    {/* Pulsing Speech Bubbles */}
    <motion.path
      d="M20 50 C20 30, 45 30, 45 50 C45 70, 20 70, 20 50 Z"
      fill="#FECDD3" opacity="0.6"
      animate={{ scale: [1, 1.1, 1], x: [0, -5, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
    />
    <motion.path
      d="M50 40 C50 20, 80 20, 80 40 C80 60, 50 60, 50 40 Z"
      fill="url(#englishGrad)"
      animate={{ scale: [1, 1.05, 1], x: [0, 5, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
    />
    {/* Floating Letters */}
    <motion.text x="58" y="48" fill="white" fontSize="18" fontWeight="bold" animate={{ y: [48, 45, 48] }} transition={{ duration: 2, repeat: Infinity }}>A</motion.text>
    <motion.text x="30" y="55" fill="#BE185D" fontSize="14" fontWeight="bold" animate={{ y: [55, 52, 55] }} transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}>Z</motion.text>

    {/* Connection lines */}
    <motion.path d="M45 45 L50 40" stroke="#F43F5E" strokeWidth="2" strokeDasharray="2 2" animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1.5, repeat: Infinity }} />
  </svg>
);

// 4. Tools (Amber)
export const ToolsSVG = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
    <defs>
      <linearGradient id="toolsGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FBBF24" />
        <stop offset="100%" stopColor="#D97706" />
      </linearGradient>
    </defs>
    {/* Rotating Gears */}
    <motion.g animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }} style={{ transformOrigin: '35px 35px' }}>
      <circle cx="35" cy="35" r="15" fill="#FDE68A" />
      <circle cx="35" cy="35" r="5" fill="white" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => (
         <rect key={deg} x="32" y="15" width="6" height="5" fill="#FDE68A" transform={`rotate(${deg} 35 35)`} />
      ))}
    </motion.g>

    <motion.g animate={{ rotate: -360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }} style={{ transformOrigin: '65px 65px' }}>
      <circle cx="65" cy="65" r="20" fill="url(#toolsGrad)" />
      <circle cx="65" cy="65" r="8" fill="white" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => (
         <rect key={deg} x="61" y="40" width="8" height="6" fill="url(#toolsGrad)" transform={`rotate(${deg} 65 65)`} />
      ))}
    </motion.g>

    {/* Floating Wrench/Spanner */}
    <motion.path
      d="M20 80 L40 60 A10 10 0 1 1 50 50 L30 70 A10 10 0 1 1 20 80 Z"
      fill="#F59E0B" opacity="0.8"
      animate={{ x: [-2, 2, -2], y: [2, -2, 2] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
    />
  </svg>
);

// 5. Analytics (Blue)
export const AnalyticsSVG = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
    <defs>
      <linearGradient id="analyticsGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#60A5FA" />
        <stop offset="100%" stopColor="#2563EB" />
      </linearGradient>
      <linearGradient id="barGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#93C5FD" />
        <stop offset="100%" stopColor="#3B82F6" />
      </linearGradient>
    </defs>
    {/* Grid Lines */}
    {[20, 40, 60, 80].map(y => (
      <line key={y} x1="10" y1={y} x2="90" y2={y} stroke="#DBEAFE" strokeWidth="1" strokeDasharray="4 4" />
    ))}
    {/* Growing Bars */}
    {[
      { x: 20, h: 30, d: 0 },
      { x: 40, h: 50, d: 0.2 },
      { x: 60, h: 20, d: 0.4 },
      { x: 80, h: 65, d: 0.6 }
    ].map((bar, i) => (
      <motion.rect
        key={i}
        x={bar.x} y={80 - bar.h} width="12" rx="3"
        fill="url(#barGrad)"
        initial={{ height: 0, y: 80 }}
        animate={{ height: bar.h, y: 80 - bar.h }}
        transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse", delay: bar.d }}
      />
    ))}
    {/* Rising Line Graph */}
    <motion.path
      d="M26 50 L46 30 L66 60 L86 15"
      fill="none" stroke="url(#analyticsGrad)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
    />
    <motion.circle cx="86" cy="15" r="5" fill="#1D4ED8" animate={{ scale: [1, 1.5, 1] }} transition={{ duration: 1, repeat: Infinity }} />
  </svg>
);

// 6. Bookmarks (Violet)
export const BookmarksSVG = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
    <defs>
      <linearGradient id="bookmarkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#A78BFA" />
        <stop offset="100%" stopColor="#7C3AED" />
      </linearGradient>
    </defs>
    {/* Glowing Aura Rings */}
    {[1, 2].map(ring => (
      <motion.circle
        key={ring} cx="50" cy="45" r="20" fill="none" stroke="#DDD6FE" strokeWidth="2"
        initial={{ scale: 1, opacity: 0.8 }}
        animate={{ scale: 2.5, opacity: 0 }}
        transition={{ duration: 2.5, repeat: Infinity, delay: ring * 1.2, ease: "easeOut" }}
      />
    ))}
    {/* Floating Bookmark Ribbon */}
    <motion.path
      d="M35 20 L65 20 L65 80 L50 65 L35 80 Z"
      fill="url(#bookmarkGrad)"
      animate={{ y: [-5, 5, -5] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
    />
    {/* Star center */}
    <motion.g animate={{ rotate: 360, scale: [1, 1.2, 1] }} transition={{ rotate: { duration: 10, repeat: Infinity, ease: "linear" }, scale: { duration: 2, repeat: Infinity } }} style={{ transformOrigin: '50px 40px' }}>
      <path d="M50 30 L53 38 L62 38 L55 43 L58 51 L50 46 L42 51 L45 43 L38 38 L47 38 Z" fill="#FDE047" />
    </motion.g>
  </svg>
);

// 7. About Us (Slate)
export const AboutSVG = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
    <defs>
      <linearGradient id="aboutGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#94A3B8" />
        <stop offset="100%" stopColor="#475569" />
      </linearGradient>
    </defs>
    {/* Expanding Orb */}
    <motion.circle
      cx="50" cy="50" r="30"
      fill="url(#aboutGrad)" opacity="0.8"
      animate={{ scale: [1, 1.05, 1] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
    />
    {/* Orbiting particles */}
    {[
      { rx: 40, ry: 20, d: 0 },
      { rx: 20, ry: 40, d: 1 }
    ].map((orbit, i) => (
      <motion.ellipse
        key={i} cx="50" cy="50" rx={orbit.rx} ry={orbit.ry} fill="none" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="4 4"
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear", delay: orbit.d }}
        style={{ transformOrigin: '50px 50px' }}
      />
    ))}
    {/* Stylized 'i' */}
    <motion.circle cx="50" cy="35" r="5" fill="white" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }} />
    <motion.rect x="46" y="45" width="8" height="25" rx="4" fill="white" animate={{ y: [45, 43, 45] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} />
  </svg>
);
