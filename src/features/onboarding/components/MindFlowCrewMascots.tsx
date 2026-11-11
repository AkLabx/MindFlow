import React, { useState, useEffect, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CrewCompanionConfig,
  CrewCompanionId,
} from '../config/onboardingConfigSchema';

export type MascotVisualState = 'awake' | 'sleeping' | 'cheering' | 'curious' | 'waving';

export interface CrewMascotProps {
  id: CrewCompanionId | 'milo';
  state?: MascotVisualState;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  className?: string;
  tiltDeg?: number;
  /** When true, omits data-mascot-id so tiny inline badges don't hijack primary avatar flights */
  disableFlightAnchor?: boolean;
  /** Temporarily hides the destination mascot while its flying counterpart lands */
  isFlightHidden?: boolean;
}

const SIZE_MAP: Record<NonNullable<CrewMascotProps['size']>, string> = {
  xs: 'w-7 h-7',
  sm: 'w-10 h-10',
  md: 'w-14 h-14',
  lg: 'w-20 h-20',
  xl: 'w-28 h-28',
  hero: 'w-36 h-36',
};

interface MascotPalette {
  face: string;
  extrude: string;
  cheek: string;
  letter: 'a' | 'g' | 'o' | 'p' | 'q' | 'd' | 'b';
  name: string;
}

/**
 * Exact 7 Letter Characters from the reference video:
 * - Ada ('a', Royal Blue #375dfb) — Primary Guide
 * - Gigi ('g', Warm Orange #ff7b1c) — PYQs
 * - Olo ('o', Golden Yellow #ffc71f) — GK & GS Notes
 * - Pip ('p', Bubblegum Pink #ff4d94) — Daily Study Target
 * - Quinn ('q', Sky Cyan #0dcaf0) — English Vocab
 * - Dex ('d', Mint Green #19b36b) — Mock & Speed
 * - Bo ('b', Soft Violet #7950f2) — Mistake Book
 */
export const MASCOT_PALETTE: Record<CrewCompanionId | 'milo', MascotPalette> = {
  milo: {
    face: '#375dfb',
    extrude: '#2543cc',
    cheek: '#748ffc',
    letter: 'a',
    name: 'Ada',
  },
  pyqo: {
    face: '#ff7b1c',
    extrude: '#d95b06',
    cheek: '#ffb067',
    letter: 'g',
    name: 'Gigi',
  },
  velo: {
    face: '#ffc71f',
    extrude: '#dfa300',
    cheek: '#ffe07d',
    letter: 'o',
    name: 'Olo',
  },
  doci: {
    face: '#ff4d94',
    extrude: '#d6296f',
    cheek: '#ff94be',
    letter: 'p',
    name: 'Pip',
  },
  gkia: {
    face: '#0dcaf0',
    extrude: '#089bb8',
    cheek: '#7ce3f7',
    letter: 'q',
    name: 'Quinn',
  },
  lexi: {
    face: '#19b36b',
    extrude: '#0f8a50',
    cheek: '#6ce3ab',
    letter: 'd',
    name: 'Dex',
  },
  mocky: {
    face: '#7950f2',
    extrude: '#5a33cc',
    cheek: '#b197fc',
    letter: 'b',
    name: 'Bo',
  },
};

interface LetterGeometry {
  bodyPath: string;
  glossPath: string;
  eyeLeft: [number, number];
  eyeRight: [number, number];
  mouthCenter: [number, number];
  mouthRx: number;
  mouthRy: number;
}

/**
 * Authentic Puffy 3D Lowercase Letter Silhouettes matching the video:
 * Instead of cutting a white hole in the bowl of 'a', 'g', 'o', 'p', 'q', 'd', 'b',
 * the wide open dark mouth (`#15162b`) and pink tongue (`#ff7096`) ACT as the counter (hole) of the lowercase letter!
 */
const LETTER_GEOMETRY: Record<MascotPalette['letter'], LetterGeometry> = {
  a: {
    bodyPath:
      'M 48 14 C 24 14, 12 30, 12 52 C 12 75, 26 88, 47 88 C 58 88, 66 83, 70 77 C 71 84, 75 88, 81 88 C 87 88, 90 83, 90 74 L 90 36 C 90 20, 74 14, 48 14 Z',
    glossPath: 'M 21 44 C 21 28, 32 21, 47 21',
    eyeLeft: [38, 36],
    eyeRight: [58, 36],
    mouthCenter: [48, 56],
    mouthRx: 11,
    mouthRy: 12.5,
  },
  g: {
    bodyPath:
      'M 47 12 C 25 12, 13 25, 13 44 C 13 62, 25 74, 44 74 C 53 74, 60 71, 64 66 L 64 75 C 64 83, 57 87, 47 87 C 39 87, 33 85, 28 82 C 23 79, 17 82, 17 87 C 17 93, 29 98, 48 98 C 72 98, 87 86, 87 67 L 87 24 C 87 16, 82 12, 75 12 C 69 12, 65 15, 64 20 C 59 15, 54 12, 47 12 Z',
    glossPath: 'M 21 39 C 21 25, 31 19, 45 19',
    eyeLeft: [38, 32],
    eyeRight: [57, 32],
    mouthCenter: [48, 50],
    mouthRx: 10,
    mouthRy: 11,
  },
  o: {
    bodyPath:
      'M 50 13 C 25 13, 12 29, 12 51 C 12 74, 25 89, 50 89 C 75 89, 88 74, 88 51 C 88 29, 75 13, 50 13 Z',
    glossPath: 'M 21 44 C 21 28, 32 20, 48 20',
    eyeLeft: [39, 35],
    eyeRight: [59, 35],
    mouthCenter: [49, 55],
    mouthRx: 10.5,
    mouthRy: 12,
  },
  p: {
    bodyPath:
      'M 25 13 C 18 13, 13 18, 13 26 L 13 84 C 13 92, 18 96, 26 96 C 34 96, 39 92, 39 84 L 39 77 C 45 81, 52 83, 60 82 C 77 79, 88 65, 88 47 C 88 27, 75 13, 54 13 C 46 13, 41 16, 37 20 C 35 15, 31 13, 25 13 Z',
    glossPath: 'M 22 41 C 22 26, 34 20, 50 20',
    eyeLeft: [40, 34],
    eyeRight: [60, 34],
    mouthCenter: [51, 52],
    mouthRx: 10.5,
    mouthRy: 11.5,
  },
  q: {
    bodyPath:
      'M 46 13 C 25 13, 12 27, 12 47 C 12 65, 23 79, 40 82 C 48 83, 55 81, 61 77 L 61 84 C 61 92, 66 96, 74 96 C 82 96, 87 92, 87 84 L 87 26 C 87 18, 82 13, 75 13 C 69 13, 65 15, 63 20 C 59 16, 54 13, 46 13 Z',
    glossPath: 'M 20 42 C 20 27, 31 20, 45 20',
    eyeLeft: [39, 34],
    eyeRight: [58, 34],
    mouthCenter: [48, 52],
    mouthRx: 10,
    mouthRy: 11.5,
  },
  d: {
    bodyPath:
      'M 75 8 C 67 8, 62 13, 62 21 L 62 27 C 56 23, 49 21, 41 22 C 24 25, 12 39, 12 57 C 12 76, 26 90, 46 90 C 55 90, 61 87, 65 82 C 67 87, 71 90, 77 90 C 84 90, 88 85, 88 77 L 88 21 C 88 13, 83 8, 75 8 Z',
    glossPath: 'M 21 52 C 21 37, 31 29, 45 29',
    eyeLeft: [39, 42],
    eyeRight: [58, 42],
    mouthCenter: [48, 61],
    mouthRx: 10,
    mouthRy: 11,
  },
  b: {
    bodyPath:
      'M 25 8 C 17 8, 12 13, 12 21 L 12 77 C 12 85, 16 90, 23 90 C 29 90, 33 87, 35 82 C 39 87, 45 90, 54 90 C 74 90, 88 76, 88 57 C 88 39, 76 25, 59 22 C 51 21, 44 23, 38 27 L 38 21 C 38 13, 33 8, 25 8 Z',
    glossPath: 'M 20 22 L 20 50',
    eyeLeft: [41, 42],
    eyeRight: [60, 42],
    mouthCenter: [51, 61],
    mouthRx: 10,
    mouthRy: 11,
  },
};

export const CrewMascot: React.FC<CrewMascotProps> = ({
  id,
  state = 'awake',
  size = 'md',
  className = '',
  tiltDeg = 0,
  disableFlightAnchor = false,
  isFlightHidden = false,
}) => {
  const uid = useId().replace(/:/g, '');
  const palette = MASCOT_PALETTE[id] || MASCOT_PALETTE.milo;
  const geom = LETTER_GEOMETRY[palette.letter];
  const isSleeping = state === 'sleeping';

  // In the video (00.00s - 02.40s):
  // - At 00.30s ("Hi! I'm Ada."): happy upward arc eyes `^ ^` + open mouth with pink tongue
  // - At 02.40s ("Need a hand?"): round oval eyes `• •` + smaller curious mouth
  const useRoundEyes =
    state === 'curious' || palette.letter === 'o' || palette.letter === 'q';

  const faceFill = isSleeping ? '#d0d4dc' : palette.face;
  const extrudeFill = isSleeping ? '#aeb4c0' : palette.extrude;
  const [mcx, mcy] = geom.mouthCenter;

  return (
    <div
      data-mascot-id={disableFlightAnchor ? undefined : id}
      className={`relative inline-flex items-center justify-center select-none shrink-0 ${SIZE_MAP[size]} ${className}`}
      style={{
        transform: tiltDeg ? `rotate(${tiltDeg}deg)` : undefined,
        opacity: isFlightHidden ? 0 : 1,
        transition: 'opacity 0.06s ease',
        filter: isSleeping
          ? 'none'
          : 'drop-shadow(0 6px 12px rgba(20, 20, 35, 0.14))',
      }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
        <defs>
          <clipPath id={`mouth-clip-${uid}`}>
            <ellipse
              cx={mcx}
              cy={mcy}
              rx={state === 'curious' ? geom.mouthRx * 0.78 : geom.mouthRx}
              ry={state === 'curious' ? geom.mouthRy * 0.78 : geom.mouthRy}
            />
          </clipPath>
        </defs>

        {/* 3D Bottom-Left Extrusion Rim */}
        <path
          d={geom.bodyPath}
          fill={extrudeFill}
          transform="translate(-1.5, 3)"
        />

        {/* Main Puffy 3D Letter Body */}
        <path d={geom.bodyPath} fill={faceFill} />

        {/* Top-Left Specular Gloss Highlight */}
        <path
          d={geom.glossPath}
          fill="none"
          stroke="#ffffff"
          strokeWidth="4.5"
          strokeLinecap="round"
          opacity={isSleeping ? 0.28 : 0.52}
        />

        {/* Eyes & Mouth inside the Letter Counter */}
        {isSleeping ? (
          <g>
            {/* Closed Sleeping Eye Arcs (08.40s - 09.60s) */}
            <path
              d={`M ${geom.eyeLeft[0] - 4.5} ${geom.eyeLeft[1] + 1} Q ${geom.eyeLeft[0]} ${geom.eyeLeft[1] + 5.5} ${geom.eyeLeft[0] + 4.5} ${geom.eyeLeft[1] + 1}`}
              fill="none"
              stroke="#687082"
              strokeWidth="3.4"
              strokeLinecap="round"
            />
            <path
              d={`M ${geom.eyeRight[0] - 4.5} ${geom.eyeRight[1] + 1} Q ${geom.eyeRight[0]} ${geom.eyeRight[1] + 5.5} ${geom.eyeRight[0] + 4.5} ${geom.eyeRight[1] + 1}`}
              fill="none"
              stroke="#687082"
              strokeWidth="3.4"
              strokeLinecap="round"
            />
            {/* Tiny Sleeping Mouth */}
            <ellipse
              cx={mcx}
              cy={mcy}
              rx={geom.mouthRx * 0.65}
              ry={geom.mouthRy * 0.6}
              fill="#7c8496"
            />
          </g>
        ) : (
          <g>
            {/* Awake / Cheering / Curious Eyes */}
            {useRoundEyes ? (
              <>
                <ellipse
                  cx={geom.eyeLeft[0]}
                  cy={geom.eyeLeft[1]}
                  rx="3.8"
                  ry="4.8"
                  fill="#15162b"
                />
                <ellipse
                  cx={geom.eyeRight[0]}
                  cy={geom.eyeRight[1]}
                  rx="3.8"
                  ry="4.8"
                  fill="#15162b"
                />
              </>
            ) : (
              <>
                <path
                  d={`M ${geom.eyeLeft[0] - 5} ${geom.eyeLeft[1] + 2} Q ${geom.eyeLeft[0]} ${geom.eyeLeft[1] - 4.5} ${geom.eyeLeft[0] + 5} ${geom.eyeLeft[1] + 2}`}
                  fill="none"
                  stroke="#15162b"
                  strokeWidth="3.8"
                  strokeLinecap="round"
                />
                <path
                  d={`M ${geom.eyeRight[0] - 5} ${geom.eyeRight[1] + 2} Q ${geom.eyeRight[0]} ${geom.eyeRight[1] - 4.5} ${geom.eyeRight[0] + 5} ${geom.eyeRight[1] + 2}`}
                  fill="none"
                  stroke="#15162b"
                  strokeWidth="3.8"
                  strokeLinecap="round"
                />
              </>
            )}

            {/* Soft Rosy Cheek Blushes */}
            <ellipse
              cx={mcx - geom.mouthRx - 5.5}
              cy={mcy - 4}
              rx="4.5"
              ry="2.8"
              fill={palette.cheek}
              opacity="0.85"
            />
            <ellipse
              cx={mcx + geom.mouthRx + 5.5}
              cy={mcy - 4}
              rx="4.5"
              ry="2.8"
              fill={palette.cheek}
              opacity="0.85"
            />

            {/* Wide Open Dark Mouth (Acts as the Letter's Counter Hole!) */}
            <ellipse
              cx={mcx}
              cy={mcy}
              rx={state === 'curious' ? geom.mouthRx * 0.78 : geom.mouthRx}
              ry={state === 'curious' ? geom.mouthRy * 0.78 : geom.mouthRy}
              fill="#15162b"
            />

            {/* Pink Tongue Clipped Inside the Mouth Counter */}
            {state !== 'curious' && (
              <g clipPath={`url(#mouth-clip-${uid})`}>
                <ellipse
                  cx={mcx}
                  cy={mcy + geom.mouthRy * 0.62}
                  rx={geom.mouthRx * 0.82}
                  ry={geom.mouthRy * 0.56}
                  fill="#ff7096"
                />
              </g>
            )}
          </g>
        )}
      </svg>
    </div>
  );
};

/**
 * Top Header Progressive Wordmark: "M I N D F L O W" (Exact match to video's "T O G E T H E R" header).
 * Lights up 1 letter per step in royal blue (`#375dfb`), and turns multi-colored rainbow with playful wave on Step 9 Finale!
 */
export const ProgressiveBrandHeader: React.FC<{
  litCount: number;
  isFinale?: boolean;
}> = ({ litCount, isFinale = false }) => {
  const letters = ['M', 'I', 'N', 'D', 'F', 'L', 'O', 'W'];
  const rainbowColors = [
    '#375dfb',
    '#ff7b1c',
    '#ffc71f',
    '#19b36b',
    '#0dcaf0',
    '#ff4d94',
    '#7950f2',
    '#375dfb',
  ];
  const waveOffsets = [-1.5, 1, -2, 1.5, -1, 2, -1.5, 1];

  return (
    <div
      className="inline-flex items-center gap-[4.5px] select-none"
      aria-label={`Onboarding progress: step ${Math.min(litCount, 8)} of 8`}
    >
      {letters.map((char, idx) => {
        const isLit = isFinale || idx < litCount;
        const color = isFinale
          ? rainbowColors[idx % rainbowColors.length]
          : isLit
            ? '#375dfb'
            : '#b8b9c2';

        return (
          <motion.span
            key={idx}
            initial={false}
            animate={{
              color,
              y: isFinale ? waveOffsets[idx] : 0,
              scale: idx === litCount - 1 && !isFinale ? [1, 1.22, 1] : 1,
            }}
            transition={{ duration: 0.28 }}
            className="text-[11px] font-black tracking-[0.04em]"
          >
            {char}
          </motion.span>
        );
      })}
    </div>
  );
};

/**
 * Step 1 Hero Constellation:
 * Verified at 300ms intervals (00.00s -> 02.40s):
 * - 00.00s - 00.30s: Speech bubble pops in with `"Hi! I'm Ada."` while Ada has happy `^ ^` eyes
 * - 01.80s: Speech bubble morphs into a warm cream pill with 3 dark-brown bouncing typing dots (`•••`)
 * - 02.10s - 02.40s: Speech bubble expands to `"Need a hand?"` while Ada switches to round curious eyes (`• •`)!
 */
export const HeroCrewConstellation: React.FC<{
  greetings: [string, string];
  inFlightIds?: Array<CrewCompanionId | 'milo'>;
}> = ({ greetings, inFlightIds = [] }) => {
  const [phase, setPhase] = useState<'first' | 'typing' | 'second'>('first');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('typing'), 1650);
    const t2 = setTimeout(() => setPhase('second'), 2150);
    const t3 = setInterval(() => {
      setPhase((prev) => {
        if (prev === 'second') return 'first';
        return 'typing';
      });
    }, 3200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearInterval(t3);
    };
  }, []);

  useEffect(() => {
    if (phase === 'typing') {
      const t = setTimeout(() => setPhase('second'), 450);
      return () => clearTimeout(t);
    }
  }, [phase]);

  // Exact orbital positions from 00.00s - 02.40s frames:
  // Top-left: pink 'p' (doci)
  // Upper-right: green 'd' (lexi)
  // Mid-left: yellow 'o' (velo)
  // Mid-right: cyan 'q' (gkia)
  // Bottom-left: orange 'g' (pyqo)
  // Bottom-right: purple 'b' (mocky)
  const orbiters: Array<{
    id: CrewCompanionId;
    posClass: string;
    tilt: number;
    delay: number;
  }> = [
    { id: 'doci', posClass: 'top-[10%] left-[8%]', tilt: -14, delay: 0 },
    { id: 'lexi', posClass: 'top-[20%] right-[8%]', tilt: 12, delay: 0.35 },
    { id: 'velo', posClass: 'top-[46%] left-[3%]', tilt: -8, delay: 0.7 },
    { id: 'gkia', posClass: 'top-[52%] right-[5%]', tilt: 10, delay: 0.2 },
    { id: 'pyqo', posClass: 'bottom-[8%] left-[12%]', tilt: -12, delay: 0.5 },
    { id: 'mocky', posClass: 'bottom-[5%] right-[18%]', tilt: 15, delay: 0.85 },
  ];

  return (
    <div className="relative w-full h-[310px] sm:h-[330px] flex items-center justify-center select-none overflow-visible">
      {/* 6 Orbiting Letter Companions */}
      {orbiters.map((orb) => (
        <motion.div
          key={orb.id}
          animate={{ y: [0, -6, 0], rotate: [orb.tilt - 2, orb.tilt + 2, orb.tilt - 2] }}
          transition={{
            duration: 3.1,
            delay: orb.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className={`absolute ${orb.posClass} will-change-transform`}
        >
          <CrewMascot
            id={orb.id}
            size="sm"
            state="awake"
            isFlightHidden={inFlightIds.includes(orb.id)}
          />
        </motion.div>
      ))}

      {/* Center Hero Mascot ('a' Ada) + Floating Speech Bubble + Ground Shadow */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Speech Bubble / Typing Dots (Top-Right of Ada, 00.30s -> 01.80s -> 02.40s) */}
        <div className="absolute -top-6 left-[54%] z-20 whitespace-nowrap">
          <AnimatePresence mode="wait">
            {phase === 'typing' ? (
              <motion.div
                key="typing"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.14 }}
                className="px-3.5 py-2.5 rounded-2xl bg-[#f3e8e2] shadow-md flex items-center gap-1.5"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#8c7a70] animate-bounce [animation-delay:-0.24s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#8c7a70] animate-bounce [animation-delay:-0.12s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#8c7a70] animate-bounce" />
              </motion.div>
            ) : (
              <motion.div
                key={phase}
                initial={{ opacity: 0, scale: 0.85, y: 4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.88, y: -3 }}
                transition={{ type: 'spring', stiffness: 420, damping: 24 }}
                className="px-4 py-2 rounded-2xl bg-white dark:bg-slate-800 text-[#141416] dark:text-white text-[13px] font-bold shadow-[0_6px_20px_rgba(0,0,0,0.08)] border border-slate-100 dark:border-slate-700"
              >
                {phase === 'first' ? greetings[0] : greetings[1]}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Giant Royal Blue 'a' Mascot */}
        <motion.div
          animate={{ y: [0, -7, 0] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
        >
          <CrewMascot
            id="milo"
            size="hero"
            state={phase === 'second' ? 'curious' : 'cheering'}
            tiltDeg={-4}
            isFlightHidden={inFlightIds.includes('milo')}
          />
        </motion.div>

        {/* Soft Blue Elliptical Ground Shadow */}
        <div
          className="w-24 h-3.5 rounded-full bg-[#375dfb]/15 blur-[2px] mt-1"
          aria-hidden="true"
        />
      </div>
    </div>
  );
};

/**
 * Steps 2..8 Top-Left Persistent Guide Header:
 * Verified at 300ms intervals (03.00s, 05.70s, 08.10s, 09.60s, 10.20s, 10.80s, 13.80s, 17.10s, 21.30s, 22.20s, 23.10s):
 * - Whenever `message` or `reactionBadge` changes, briefly flashes the 3-dot typing pill (`180ms`) before popping in the new bubble!
 */
export const MiloGuideHeader: React.FC<{
  message: string;
  reactionBadge?: string | null;
  isFlightHidden?: boolean;
}> = ({ message, reactionBadge, isFlightHidden = false }) => {
  const displayMessage = reactionBadge || message;
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    setIsTyping(true);
    const timer = setTimeout(() => setIsTyping(false), 180);
    return () => clearTimeout(timer);
  }, [displayMessage]);

  return (
    <div className="flex items-center gap-2.5 w-full min-h-[48px]">
      <motion.div
        key={displayMessage}
        initial={{ scale: 0.92, rotate: -6 }}
        animate={{ scale: 1, rotate: -3 }}
        transition={{ type: 'spring', stiffness: 420, damping: 20 }}
      >
        <CrewMascot
          id="milo"
          size="sm"
          state="awake"
          isFlightHidden={isFlightHidden}
        />
      </motion.div>

      <div className="relative flex-1 min-w-0">
        <AnimatePresence mode="wait">
          {isTyping ? (
            <motion.div
              key="typing-dots"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.1 }}
              className="inline-flex items-center gap-1.5 px-3.5 py-3 rounded-2xl bg-[#f3e8e2] dark:bg-slate-800 shadow-xs"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#8c7a70] animate-bounce [animation-delay:-0.2s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#8c7a70] animate-bounce [animation-delay:-0.1s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#8c7a70] animate-bounce" />
            </motion.div>
          ) : (
            <motion.div
              key={displayMessage}
              initial={{ opacity: 0, x: -4, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.16, ease: 'easeOut' }}
              className="inline-block max-w-full rounded-[16px] bg-white dark:bg-slate-800 px-3.5 py-2.5 shadow-[0_4px_16px_rgba(0,0,0,0.05)] border border-slate-200/80 dark:border-slate-700"
            >
              <p className="text-[13px] sm:text-[13.5px] font-medium text-[#141416] dark:text-slate-100 leading-snug">
                {displayMessage}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

/**
 * Step 2: Living Name Squircle Tiles (Exact match to 04.20s - 05.10s frames!).
 * Look closely at frame 05.10s:
 * The typed letters (`R`, `I`, `T`, `U`) are NOT character mascots — they are rounded vertical squircle tiles (`48x58px`, `rounded-2xl`)
 * with two cute dark dot eyes (`• •`) + a tiny curved smile (`⌣`) at the top of the tile, and a bold dark uppercase letter at the bottom!
 * - Tile 1: Warm Orange (`#ff7b24`, text `#3b1700`, tilt `-6deg`)
 * - Tile 2: Golden Yellow (`#ffcc29`, text `#3b2b00`, tilt `+3deg`)
 * - Tile 3: Bubblegum Pink (`#ff6b9d`, text `#3b0519`, tilt `-3deg`)
 * - Tile 4: Sky Cyan (`#22b8cf`, text `#042f36`, tilt `+4deg`)
 */
const NAME_TILE_STYLES = [
  { bg: '#ff7b24', text: '#3b1700', tilt: -6 },
  { bg: '#ffcc29', text: '#3b2b00', tilt: 3 },
  { bg: '#ff6b9d', text: '#3b0519', tilt: -3 },
  { bg: '#22b8cf', text: '#042f36', tilt: 4 },
  { bg: '#19b36b', text: '#04381e', tilt: -4 },
  { bg: '#7950f2', text: '#210c54', tilt: 3 },
];

export const LivingNameTiles: React.FC<{ name: string }> = ({ name }) => {
  const cleanChars = name
    .trim()
    .replace(/\s+/g, '')
    .slice(0, 10)
    .split('');

  return (
    <div
      className="min-h-[68px] flex items-center justify-start flex-wrap gap-1.5 pt-1"
      aria-live="polite"
    >
      <AnimatePresence mode="popLayout">
        {cleanChars.map((char, idx) => {
          const style = NAME_TILE_STYLES[idx % NAME_TILE_STYLES.length];
          return (
            <motion.div
              key={`${idx}-${char.toUpperCase()}`}
              layout
              initial={{ opacity: 0, scale: 0.35, y: 16, rotate: style.tilt - 10 }}
              animate={{ opacity: 1, scale: 1, y: 0, rotate: style.tilt }}
              exit={{ opacity: 0, scale: 0.3, y: 10 }}
              transition={{
                type: 'spring',
                stiffness: 500,
                damping: 22,
              }}
              style={{ backgroundColor: style.bg }}
              className="w-[48px] h-[60px] rounded-[15px] shadow-[0_6px_14px_rgba(0,0,0,0.08)] flex flex-col items-center justify-center pt-1.5 pb-1 select-none will-change-transform"
            >
              {/* Tiny Cute Face on Top Half of Squircle Tile */}
              <svg viewBox="0 0 28 14" className="w-6 h-3 shrink-0">
                <circle cx="9" cy="4.5" r="2" fill="#1e1b18" />
                <circle cx="19" cy="4.5" r="2" fill="#1e1b18" />
                <path
                  d="M 10.5 9.5 Q 14 12.5 17.5 9.5"
                  fill="none"
                  stroke="#1e1b18"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>

              {/* Bold Uppercase Character on Bottom Half */}
              <span
                style={{ color: style.text }}
                className="text-[19px] font-black uppercase leading-none tracking-tight mt-0.5"
              >
                {char}
              </span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

/**
 * Step 9 Finale: 4-Character Celebration Lineup (`g`, giant `a`, `o`, `p`)
 * Exact match to 28.20s - 30.60s frames!
 */
export const FinaleCrewCelebration: React.FC<{
  awakenedCrew?: CrewCompanionConfig[];
  inFlightIds?: Array<CrewCompanionId | 'milo'>;
}> = ({ inFlightIds = [] }) => {
  return (
    <div className="relative flex items-end justify-center gap-2.5 pt-4 pb-2 select-none">
      <motion.div
        animate={{ y: [0, -6, 0], rotate: [-8, -3, -8] }}
        transition={{ duration: 2.2, repeat: Infinity }}
      >
        <CrewMascot
          id="pyqo"
          size="md"
          state="cheering"
          isFlightHidden={inFlightIds.includes('pyqo')}
        />
      </motion.div>
      <motion.div
        animate={{ y: [0, -9, 0], rotate: [2, -3, 2] }}
        transition={{ duration: 2.4, delay: 0.15, repeat: Infinity }}
      >
        <CrewMascot
          id="milo"
          size="lg"
          state="cheering"
          isFlightHidden={inFlightIds.includes('milo')}
        />
      </motion.div>
      <motion.div
        animate={{ y: [0, -6, 0], rotate: [-5, 4, -5] }}
        transition={{ duration: 2.1, delay: 0.3, repeat: Infinity }}
      >
        <CrewMascot
          id="velo"
          size="md"
          state="cheering"
          isFlightHidden={inFlightIds.includes('velo')}
        />
      </motion.div>
      <motion.div
        animate={{ y: [0, -7, 0], rotate: [10, 4, 10] }}
        transition={{ duration: 2.3, delay: 0.45, repeat: Infinity }}
      >
        <CrewMascot
          id="doci"
          size="md"
          state="cheering"
          isFlightHidden={inFlightIds.includes('doci')}
        />
      </motion.div>
    </div>
  );
};

export interface AvatarFlightRect {
  left: number;
  top: number;
  width: number;
  height: number;
  tiltDeg?: number;
}

export interface AvatarFlightItem {
  id: CrewCompanionId | 'milo';
  from: AvatarFlightRect;
  to: AvatarFlightRect;
  state?: MascotVisualState;
  delay?: number;
  endOpacity?: number;
  peakScale?: number;
}

/**
 * Real-Time Shared-Element FLIP Avatar Flight Overlay:
 * Renders each transitioning letter avatar at its exact outgoing screen bounding box (`from`)
 * and physically flies + scales it along a smooth spring curve to its exact incoming screen bounding box (`to`).
 */
export const AvatarFlightOverlay: React.FC<{
  flights: AvatarFlightItem[];
}> = ({ flights }) => {
  if (flights.length === 0) return null;

  return (
    <div
      className="fixed inset-0 z-[70] pointer-events-none overflow-hidden"
      aria-hidden="true"
    >
      {flights.map((item, idx) => (
        <motion.div
          key={`${item.id}-${idx}-${Math.round(item.from.left)}-${Math.round(item.to.left)}`}
          initial={{
            left: item.from.left,
            top: item.from.top,
            width: item.from.width,
            height: item.from.height,
            rotate: item.from.tiltDeg ?? -8,
            scale: 1,
            opacity: 1,
          }}
          animate={{
            left: item.to.left,
            top: item.to.top,
            width: item.to.width,
            height: item.to.height,
            rotate: item.to.tiltDeg ?? 0,
            scale: [1, item.peakScale ?? 1.15, item.endOpacity === 0 ? 0.55 : 1],
            opacity: item.endOpacity ?? 1,
          }}
          transition={{
            type: 'spring',
            stiffness: 310,
            damping: 26,
            mass: 0.85,
            delay: item.delay ?? 0,
          }}
          style={{ position: 'fixed' }}
          className="flex items-center justify-center will-change-transform"
        >
          <CrewMascot
            id={item.id}
            state={item.state || 'cheering'}
            className="!w-full !h-full"
            disableFlightAnchor
          />
        </motion.div>
      ))}
    </div>
  );
};
