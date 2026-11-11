import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check,
  Zap,
  Bell,
  Copy,
  Lock,
  Plus,
  Calendar,
  BookOpen,
  FileText,
  Gauge,
  BookmarkCheck,
  Landmark,
  Scale,
  Train,
  ShieldAlert,
  Award,
  Shield,
  GraduationCap,
  X,
  Loader2,
} from 'lucide-react';
import { CANONICAL_EXAMS, CanonicalExam } from '@/features/dashboard/constants/examRegistry';
import { triggerHaptic } from '@/lib/haptics';
import { CrewCompanionConfig, CrewCompanionId } from '../config/onboardingConfigSchema';
import { CrewMascot } from './MindFlowCrewMascots';

const EXAM_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Landmark,
  Scale,
  Train,
  ShieldAlert,
  Award,
  Shield,
};

/**
 * Step 3: C-Shaped Dotted Orbital Arc Wheel Selector (Exact match to 05.40s - 07.80s).
 * The dotted blue arc on the right curves INWARD to the left at the vertical center (like a 'C').
 * The selected center item sits furthest LEFT right next to the horizontal blue pill tick (—),
 * while upper and lower items curve OUTWARD to the right along the C-arc!
 */
export const PlanetaryExamWheel: React.FC<{
  selectedExamId: string;
  onSelectExam: (examId: string) => void;
}> = ({ selectedExamId, onSelectExam }) => {
  const exams = CANONICAL_EXAMS;
  const activeIndex = Math.max(
    0,
    exams.findIndex((e) => e.id === selectedExamId)
  );

  const dragStartYRef = useRef<number | null>(null);
  const dragAccumulatedRef = useRef<number>(0);

  const selectByIndex = (nextIdx: number) => {
    const clamped = Math.max(0, Math.min(exams.length - 1, nextIdx));
    if (clamped !== activeIndex) {
      triggerHaptic('selection');
      onSelectExam(exams[clamped].id);
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    dragStartYRef.current = e.clientY;
    dragAccumulatedRef.current = 0;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignore pointer capture errors
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragStartYRef.current === null) return;
    const deltaY = e.clientY - dragStartYRef.current;
    const stepThreshold = 38;
    if (Math.abs(deltaY - dragAccumulatedRef.current) >= stepThreshold) {
      const direction = deltaY > dragAccumulatedRef.current ? -1 : 1;
      dragAccumulatedRef.current = deltaY;
      selectByIndex(activeIndex + direction);
    }
  };

  const handlePointerUp = () => {
    dragStartYRef.current = null;
    dragAccumulatedRef.current = 0;
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (Math.abs(e.deltaY) < 10) return;
    selectByIndex(activeIndex + (e.deltaY > 0 ? 1 : -1));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectByIndex(activeIndex - 1);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectByIndex(activeIndex + 1);
    }
  };

  return (
    <div
      role="listbox"
      tabIndex={0}
      aria-label="Select Your Target Exam"
      onKeyDown={handleKeyDown}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className="relative w-full h-[335px] sm:h-[350px] flex items-center justify-center overflow-hidden select-none touch-none cursor-grab active:cursor-grabbing"
    >
      {/* Dreamy Soft Periwinkle/Lavender Glow Behind Right Orbital Arc (05.40s - 07.80s) */}
      <div
        className="absolute right-0 top-1/2 -translate-y-1/2 w-60 h-60 rounded-full bg-[#dce3ff]/75 dark:bg-indigo-500/15 blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      {/* C-Shaped Dotted Orbital Track on Right Side (Curves inward to the left at vertical center) */}
      <svg
        viewBox="0 0 130 340"
        className="absolute right-0 top-1/2 -translate-y-1/2 w-[130px] h-[340px] pointer-events-none"
        aria-hidden="true"
      >
        <path
          d="M 118 8 A 195 195 0 0 0 118 332"
          fill="none"
          stroke="#748ffc"
          strokeWidth="2"
          strokeDasharray="3 6"
          strokeLinecap="round"
          opacity="0.75"
        />
      </svg>

      {/* Solid Royal Blue Horizontal Pill Indicator (—) at Center-Left Apex of the C-Arc */}
      <div
        className="absolute right-[52px] sm:right-[56px] top-1/2 -translate-y-1/2 w-[22px] h-[6.5px] rounded-full bg-[#375dfb] shadow-2xs pointer-events-none z-20"
        aria-hidden="true"
      />

      {/* Wheel Items Travelling Along the C-Shaped Arc */}
      <div className="relative w-full h-full flex items-center">
        {exams.map((exam: CanonicalExam, index: number) => {
          const offset = index - activeIndex;
          const absOffset = Math.abs(offset);
          if (absOffset > 3) return null;

          // C-curve math: center item (offset=0) is furthest left (x=0); off-center items curve right (+x)
          const angleRad = offset * 0.34;
          const radius = 195;
          const curveRightX = Math.round(radius * (1 - Math.cos(angleRad)));
          const arcY = offset * 56;

          const isSelected = offset === 0;
          const opacity =
            isSelected ? 1 : absOffset === 1 ? 0.55 : absOffset === 2 ? 0.25 : 0.1;
          const scale = isSelected ? 1 : absOffset === 1 ? 0.92 : 0.84;

          const IconComp = EXAM_ICON_MAP[exam.icon] || GraduationCap;

          return (
            <motion.button
              key={exam.id}
              type="button"
              role="option"
              aria-selected={isSelected}
              onClick={(e) => {
                e.stopPropagation();
                selectByIndex(index);
              }}
              animate={{
                x: curveRightX,
                y: arcY,
                scale,
                opacity,
              }}
              transition={{
                type: 'spring',
                stiffness: 350,
                damping: 28,
              }}
              className={`absolute right-[84px] sm:right-[92px] min-h-[48px] py-1.5 px-2 rounded-2xl flex items-center justify-end gap-3.5 text-right will-change-transform ${
                isSelected
                  ? 'z-20 text-[#141416] dark:text-white font-extrabold'
                  : 'z-10 text-[#6c7080] dark:text-slate-400 font-medium'
              }`}
            >
              <span
                className={`tracking-tight whitespace-nowrap transition-all ${
                  isSelected
                    ? 'text-[22px] sm:text-2xl font-extrabold text-[#141416] dark:text-white'
                    : 'text-[16px] font-medium'
                }`}
              >
                {exam.displayName}
              </span>

              {/* Pure White 42x42 Squircle Icon Badge (05.40s - 07.80s) */}
              <div
                className={`w-[42px] h-[42px] rounded-[14px] flex items-center justify-center shrink-0 transition-all ${
                  isSelected
                    ? 'bg-white dark:bg-slate-800 text-[#141416] dark:text-white shadow-[0_4px_14px_rgba(0,0,0,0.07)] border border-slate-200/70 dark:border-slate-700'
                    : 'bg-white/85 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400 border border-slate-200/50 dark:border-slate-700/50'
                }`}
              >
                <IconComp className="w-[18px] h-[18px] stroke-[2]" />
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

/**
 * Step 4: "What eats up your study week?" Interactive Sleeping -> Awake List (08.40s - 10.50s).
 */
export const WakeUpCrewList: React.FC<{
  crew: CrewCompanionConfig[];
  awakenedIds: string[];
  onToggleCrew: (crewMember: CrewCompanionConfig) => void;
  inFlightIds?: Array<CrewCompanionId | 'milo'>;
}> = ({ crew, awakenedIds, onToggleCrew, inFlightIds = [] }) => {
  return (
    <div className="space-y-3">
      {/* Black Status Pill: "● 3 Letters awake" -> "● 5 Letters awake" (08.40s - 10.20s) */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#19191c] text-white text-xs font-semibold shadow-2xs">
        <span className="w-2 h-2 rounded-full bg-[#2ecc71]" />
        <span>
          {awakenedIds.length} {awakenedIds.length === 1 ? 'Letter' : 'Letters'} awake
        </span>
      </div>

      {/* 6 Interactive Study Rows */}
      <div className="space-y-2">
        {crew.map((member) => {
          const isAwake = awakenedIds.includes(member.id);
          return (
            <button
              key={member.id}
              type="button"
              onClick={() => onToggleCrew(member)}
              className={`w-full min-h-[58px] px-3.5 py-2.5 rounded-[18px] border text-left flex items-center justify-between gap-3 transition-all active:scale-[0.985] select-none touch-manipulation ${
                isAwake
                  ? 'bg-white dark:bg-slate-800/95 border-slate-200/85 dark:border-slate-700 shadow-[0_2px_10px_rgba(0,0,0,0.03)]'
                  : 'bg-[#f4f4f6] dark:bg-slate-900/50 border-transparent opacity-85 hover:opacity-100'
              }`}
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <motion.div
                  animate={
                    isAwake
                      ? { scale: [0.85, 1.12, 1], rotate: [0, -6, 0] }
                      : { scale: 1, rotate: 0 }
                  }
                  transition={{ duration: 0.25 }}
                >
                  <CrewMascot
                    id={member.id}
                    size="sm"
                    state={isAwake ? 'awake' : 'sleeping'}
                    tiltDeg={isAwake ? -4 : 0}
                    isFlightHidden={inFlightIds.includes(member.id)}
                  />
                </motion.div>

                <div className="min-w-0">
                  <div
                    className={`text-[13.5px] sm:text-sm font-bold truncate transition-colors ${
                      isAwake
                        ? 'text-[#141416] dark:text-white'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {member.hurdleTitle}
                  </div>
                  <div className="text-xs text-slate-400 dark:text-slate-500 truncate">
                    {isAwake ? member.awakeText : member.sleepingText}
                  </div>
                </div>
              </div>

              {/* Trailing Rounded Checkbox */}
              <div
                className={`w-6 h-6 rounded-[8px] flex items-center justify-center shrink-0 transition-all ${
                  isAwake
                    ? 'bg-[#141416] dark:bg-indigo-600 text-white'
                    : 'bg-[#e4e4e9] dark:bg-slate-800 text-transparent'
                }`}
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

/**
 * Step 4 -> Step 5 Transition: Cascading Diagonal 3D Letter Stream (Exact match to 10.50s in sheet_05!).
 */
export const CrewFlyingBurstOverlay: React.FC<{
  awakenedCrew: CrewCompanionConfig[];
}> = ({ awakenedCrew }) => {
  // Exact diagonal positions from 10.50s frame (g top-left, o mid-left, p mid-right, q far-right, d bottom-right)
  const cascadePositions = [
    { startX: -110, startY: -65, endX: -75, endY: -45, tilt: -10 },
    { startX: -55, startY: -15, endX: -20, endY: -20, tilt: 6 },
    { startX: 15, startY: 35, endX: 45, endY: 15, tilt: -8 },
    { startX: 70, startY: 75, endX: 105, endY: 45, tilt: 12 },
    { startX: 95, startY: 115, endX: 125, endY: 85, tilt: -6 },
  ];

  return (
    <div
      className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center"
      aria-hidden="true"
    >
      {awakenedCrew.slice(0, 5).map((member, idx) => {
        const pos = cascadePositions[idx % cascadePositions.length];
        return (
          <motion.div
            key={member.id}
            initial={{ opacity: 0, scale: 0.5, x: pos.startX, y: pos.startY }}
            animate={{
              opacity: [0, 1, 1, 0],
              scale: [0.6, 1.15, 1.05, 0.85],
              x: pos.endX,
              y: pos.endY,
              rotate: pos.tilt,
            }}
            transition={{ duration: 0.42, delay: idx * 0.03, ease: 'easeOut' }}
            className="absolute will-change-transform"
          >
            <CrewMascot id={member.id} size="md" state="cheering" />
          </motion.div>
        );
      })}
    </div>
  );
};

/**
 * Step 5: Peek-a-Boo Horizontal Card Carousel (Exact match to 10.80s - 13.50s in sheet_06 & sheet_07).
 * Notice in 10.80s, 12.30s, 13.20s:
 * - Each slide has the white main card (`rounded-[24px]`) containing `[Name + Awake + Dark Role Pill]`,
 *   the warm pastel stage (`h-[132px]`), description, `Best at | Works in`, and the dark pill button `✓ In crew`.
 * - AND directly below the white card (`mt-1.5`), a separate full-width vibrant colored pill bar
 *   (`#ff7b1c` orange on Gigi, `#ffc71f` yellow on Olo, `#ff4d94` pink on Pip) with `⚡ Currently ...`!
 */
export const CrewShowcaseCarousel: React.FC<{
  crew: CrewCompanionConfig[];
  inFlightIds?: Array<CrewCompanionId | 'milo'>;
}> = ({ crew, inFlightIds = [] }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const safeCrew = crew.length > 0 ? crew : [];

  if (safeCrew.length === 0) return null;

  const goPrev = () => {
    if (activeIndex > 0) {
      triggerHaptic('selection');
      setActiveIndex((prev) => prev - 1);
    }
  };

  const goNext = () => {
    if (activeIndex < safeCrew.length - 1) {
      triggerHaptic('selection');
      setActiveIndex((prev) => prev + 1);
    }
  };

  return (
    <div className="space-y-2.5 select-none overflow-hidden -mx-5 sm:-mx-7 px-5 sm:px-7">
      {/* Horizontal Peek-a-Boo Sliding Track */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        onDragEnd={(_, info) => {
          if (info.offset.x < -35 && activeIndex < safeCrew.length - 1) {
            goNext();
          } else if (info.offset.x > 35 && activeIndex > 0) {
            goPrev();
          }
        }}
        animate={{
          x: `calc(-${activeIndex * 85}% - ${activeIndex * 14}px)`,
        }}
        transition={{ type: 'spring', stiffness: 320, damping: 30 }}
        className="flex items-stretch gap-3.5 cursor-grab active:cursor-grabbing will-change-transform"
      >
        {safeCrew.map((member, idx) => {
          const isActive = idx === activeIndex;
          // In 10.80s (Gigi orange), text on the bottom pill is dark/white depending on brightness
          const isLightBar = member.id === 'velo' || member.id === 'gkia';
          return (
            <div
              key={member.id}
              onClick={() => {
                if (idx !== activeIndex) {
                  triggerHaptic('selection');
                  setActiveIndex(idx);
                }
              }}
              className={`w-[85%] shrink-0 flex flex-col gap-1.5 transition-opacity duration-200 ${
                isActive ? 'opacity-100' : 'opacity-75'
              }`}
            >
              {/* Main White Card */}
              <div className="rounded-[24px] bg-white dark:bg-slate-800/95 border border-slate-200/80 dark:border-slate-700 shadow-[0_8px_24px_rgba(0,0,0,0.05)] p-4 sm:p-5 space-y-3">
                {/* Header: Name + Awake Status + Dark Role Pill with Mini Letter Mascot */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-xl font-extrabold text-[#141416] dark:text-white tracking-tight leading-tight">
                      {member.name}
                    </h3>
                    <div className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                      <span className="w-2 h-2 rounded-full bg-[#2ecc71]" />
                      <span>Awake</span>
                    </div>
                  </div>

                  <div className="inline-flex items-center gap-1.5 pl-1.5 pr-3 py-1 rounded-full bg-[#141416] dark:bg-slate-950 text-white text-[10.5px] font-extrabold tracking-wider uppercase">
                    <span className="w-4 h-4 inline-flex items-center justify-center">
                      <CrewMascot
                        id={member.id}
                        size="xs"
                        className="scale-[0.55]"
                        disableFlightAnchor
                      />
                    </span>
                    <span>{member.roleBadge}</span>
                  </div>
                </div>

                {/* Warm Pastel Stage with Bouncing Letter + Ground Shadow */}
                <div
                  style={{ backgroundColor: member.pastelBg }}
                  className="w-full h-[128px] rounded-[18px] flex flex-col items-center justify-center relative overflow-hidden"
                >
                  <motion.div
                    animate={
                      isActive ? { y: [0, -5, 0], rotate: [-3, 3, -3] } : { y: 0, rotate: 0 }
                    }
                    transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <CrewMascot
                      id={member.id}
                      size="lg"
                      state="cheering"
                      isFlightHidden={inFlightIds.includes(member.id)}
                    />
                  </motion.div>
                  <div
                    className="w-14 h-2.5 rounded-full bg-black/10 blur-[1px] mt-1"
                    aria-hidden="true"
                  />
                </div>

                {/* Description */}
                <p className="text-xs sm:text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  {member.description}
                </p>

                {/* 2-Column Metadata (Best at | Works in) */}
                <div className="grid grid-cols-2 gap-3 pt-1.5 border-t border-slate-100 dark:border-slate-700/70">
                  <div>
                    <span className="block text-[11px] text-slate-400 dark:text-slate-500">
                      Best at
                    </span>
                    <span className="text-xs sm:text-[13px] font-bold text-[#141416] dark:text-white">
                      {member.bestAt}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[11px] text-slate-400 dark:text-slate-500">
                      Works in
                    </span>
                    <span className="text-xs sm:text-[13px] font-bold text-[#141416] dark:text-white">
                      {member.worksIn}
                    </span>
                  </div>
                </div>

                {/* "✓ In crew" Dark Full-Width Pill Button */}
                <div className="w-full py-2.5 rounded-full bg-[#141416] dark:bg-slate-950 text-white text-xs sm:text-[13px] font-bold flex items-center justify-center gap-1.5">
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>In crew</span>
                </div>
              </div>

              {/* Separate Vibrant Colored Pill Strip Below Card (Exact match to 10.80s, 12.30s, 13.20s!) */}
              <div
                style={{
                  backgroundColor: member.colorHex,
                  color: isLightBar ? '#141416' : '#ffffff',
                }}
                className="px-4 py-2 rounded-[14px] text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Zap className="w-3.5 h-3.5 shrink-0 fill-current" />
                <span className="truncate">{member.liveStatus}</span>
              </div>
            </div>
          );
        })}
      </motion.div>

      {/* Pill-Dot Pagination (10.80s - 13.50s) */}
      <div className="flex items-center justify-center gap-1.5 pt-0.5">
        {safeCrew.map((member, idx) => {
          const isActive = idx === activeIndex;
          return (
            <button
              key={member.id}
              type="button"
              aria-label={`Show ${member.name}`}
              onClick={() => {
                triggerHaptic('selection');
                setActiveIndex(idx);
              }}
              className="min-w-[24px] min-h-[32px] flex items-center justify-center"
            >
              <span
                className={`h-2 rounded-full transition-all duration-300 ${
                  isActive
                    ? 'w-4 bg-[#141416] dark:bg-white'
                    : 'w-2 bg-slate-300 dark:bg-slate-700'
                }`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};

/**
 * Step 6: "Your first task" Choreographed 300ms Demo (Exact match to 14.10s - 17.70s in sheet_07, sheet_08, sheet_09):
 * - 14.10s - 15.60s: Dark prompt bubble + warm peach typing dots (•••)
 * - 15.90s - 16.50s: Solid dark progress bar (#141416) sweeps across top of message body while cream card unblurs line-by-line
 * - 16.80s - 17.70s: 3 action chips pop in + green celebration banner slides in + Ada's top bubble says "Ta-da! That's your first task done."
 */
export const FirstTaskLiveDemo: React.FC<{
  userName: string;
  examDisplayName: string;
  onTaskDone?: () => void;
  inFlightIds?: Array<CrewCompanionId | 'milo'>;
}> = ({ userName, examDisplayName, onTaskDone, inFlightIds = [] }) => {
  const [phase, setPhase] = useState<'typing' | 'unblurring' | 'done'>('typing');
  const [activeChip, setActiveChip] = useState<'simpler' | 'shorter' | 'default'>('default');
  const [copied, setCopied] = useState(false);
  const onTaskDoneRef = useRef(onTaskDone);
  onTaskDoneRef.current = onTaskDone;

  const firstName = userName?.trim() ? userName.trim().split(/\s+/)[0] : 'Ritu';

  useEffect(() => {
    setPhase('typing');
    const t1 = setTimeout(() => {
      setPhase('unblurring');
    }, 650);
    const t2 = setTimeout(() => {
      setPhase('done');
      triggerHaptic('light');
      onTaskDoneRef.current?.();
    }, 1350);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <div className="space-y-2.5">
      {/* Main White Task Card (14.10s - 17.70s) */}
      <div className="rounded-[24px] bg-white dark:bg-slate-800/95 border border-slate-200/85 dark:border-slate-700 shadow-[0_6px_24px_rgba(0,0,0,0.05)] overflow-hidden">
        {/* Card Header: Gigi ('g') + Awake */}
        <div className="px-4 py-3 flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60">
          <div className="flex items-center gap-2.5">
            <CrewMascot
              id="pyqo"
              size="xs"
              state="awake"
              isFlightHidden={inFlightIds.includes('pyqo')}
            />
            <div>
              <div className="text-xs sm:text-sm font-extrabold text-[#141416] dark:text-white leading-tight">
                Gigi
              </div>
              <div className="text-[11px] text-slate-400">PYQ Papers</div>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <span className="w-2 h-2 rounded-full bg-[#2ecc71]" />
            Awake
          </span>
        </div>

        {/* Body */}
        <div className="p-4 space-y-2.5">
          {/* Dark Sweeping Progress Bar at 15.90s -> 16.80s (Exact match to sheet_08 & sheet_09!) */}
          <AnimatePresence mode="wait">
            {phase === 'typing' ? (
              <motion.div
                key="today-label"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center text-[11px] text-slate-400 font-medium"
              >
                Today
              </motion.div>
            ) : (
              <motion.div
                key="dark-progress"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-full h-[4px] rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden"
              >
                <motion.div
                  initial={{ width: '35%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 0.65, ease: 'easeOut' }}
                  className="h-full bg-[#141416] dark:bg-white rounded-full"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Dark User Prompt Bubble (Shown during typing phase 14.10s - 15.60s) */}
          {phase === 'typing' && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="ml-auto max-w-[88%] rounded-2xl bg-[#19191c] text-white px-3.5 py-2.5 text-xs sm:text-[13px] font-medium shadow-2xs"
            >
              <div>
                Show me 1 most-repeated {examDisplayName} question with an easy trick to remember.
              </div>
              <div className="text-right text-[10px] text-slate-400 mt-1">09:41 ✓✓</div>
            </motion.div>
          )}

          {/* Warm Peach Typing Dots (14.70s - 16.80s) */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-[#fdece2]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#e87a3e] animate-bounce [animation-delay:-0.25s]" />
            <span className="w-1.5 h-1.5 rounded-full bg-[#e87a3e] animate-bounce [animation-delay:-0.12s]" />
            <span className="w-1.5 h-1.5 rounded-full bg-[#e87a3e] animate-bounce" />
          </div>

          {/* Warm Cream Generated Card (#fdf3ea) that unblurs line-by-line (15.90s -> 16.80s) */}
          {phase !== 'typing' && (
            <motion.div
              initial={{ opacity: 0.4, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl bg-[#fdf3ea] dark:bg-slate-900/90 border border-[#f5dec9] dark:border-slate-700 p-3.5 space-y-1.5"
            >
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#9c7a5b]">
                REPEATED PYQ • ASKED 14 TIMES
              </div>
              <div className="text-xs sm:text-[13px] font-bold text-[#141416] dark:text-white">
                Q: &ldquo;A person who never makes a mistake&rdquo; →{' '}
                <span className="text-[#d95b06] dark:text-amber-400">Infallible (अचूक)</span>
              </div>

              <motion.div
                animate={{
                  filter: phase === 'unblurring' ? 'blur(4px)' : 'blur(0px)',
                  opacity: phase === 'unblurring' ? 0.68 : 1,
                }}
                transition={{ duration: 0.4 }}
                className="space-y-1.5"
              >
                <p className="text-xs sm:text-[12.5px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  {activeChip === 'simpler'
                    ? 'देसी ट्रिक: In (नहीं) + Fall (गिरना / गलती) = जो कभी गलती न करे (अचूक)!'
                    : activeChip === 'shorter'
                      ? 'Quick Hook: In (Not) + Fall (Fail) = Never fails!'
                      : 'Memory Trick: Break the word → In (Not) + Fall (गिरना/गलती) = One who never falls into error.'}
                </p>

                <div className="text-xs text-slate-600 dark:text-slate-300 pt-0.5">
                  Saved for your revision,
                  <div className="font-bold text-[#141416] dark:text-white">{firstName}</div>
                </div>
              </motion.div>

              {/* 3 White Action Pill Chips Below Cream Card (16.80s - 17.70s: Make it simpler | Shorter | Copy) */}
              {phase === 'done' && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-wrap items-center gap-1.5 pt-1.5"
                >
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('selection');
                      setActiveChip((c) => (c === 'simpler' ? 'default' : 'simpler'));
                    }}
                    className={`px-3 py-1 rounded-full text-[11px] font-semibold border transition-all active:scale-95 ${
                      activeChip === 'simpler'
                        ? 'bg-[#141416] text-white border-[#141416]'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200/90 dark:border-slate-700'
                    }`}
                  >
                    Make it simpler
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('selection');
                      setActiveChip((c) => (c === 'shorter' ? 'default' : 'shorter'));
                    }}
                    className={`px-3 py-1 rounded-full text-[11px] font-semibold border transition-all active:scale-95 ${
                      activeChip === 'shorter'
                        ? 'bg-[#141416] text-white border-[#141416]'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200/90 dark:border-slate-700'
                    }`}
                  >
                    Shorter
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      setCopied(true);
                      setTimeout(() => setCopied(false), 1400);
                    }}
                    className="px-3 py-1 rounded-full text-[11px] font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/90 dark:border-slate-700 inline-flex items-center gap-1 active:scale-95"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* Green Outlined Celebration Banner Below Card (16.80s - 17.70s) */}
      <AnimatePresence>
        {phase === 'done' && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 380, damping: 24 }}
            className="p-3 rounded-[18px] bg-[#eafaf1] dark:bg-emerald-950/50 border border-[#2ecc71] dark:border-emerald-700 flex items-center gap-3 shadow-2xs"
          >
            <div className="w-7 h-7 rounded-full bg-[#2ecc71] text-white flex items-center justify-center shrink-0">
              <Check className="w-4 h-4 stroke-[3]" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-extrabold text-[#141416] dark:text-white">
                Your first task, done!
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-300">
                Gigi wrote it in under a second.
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface StudyToolItem {
  id: string;
  name: string;
  subtitle: string;
  crewId: CrewCompanionId;
  crewName: string;
  iconBg: string;
  iconColor: string;
  Icon: React.ComponentType<{ className?: string }>;
  willList: [string, string];
  wontText: string;
  connectedLine: string;
}

const STUDY_TOOLS: StudyToolItem[] = [
  {
    id: 'pyq_bank',
    name: 'PYQ Shift Bank',
    subtitle: 'Gigi sorts your shift papers',
    crewId: 'pyqo',
    crewName: 'Gigi',
    iconBg: '#fdece2',
    iconColor: '#ff7b1c',
    Icon: FileText,
    willList: [
      'Sort shift-wise Previous Year Questions for your exam',
      'Highlight questions asked 5+ times by SSC & Railway',
    ],
    wontText: 'Show irrelevant out-of-syllabus questions',
    connectedLine: 'Gigi can sort your shift papers now.',
  },
  {
    id: 'daily_planner',
    name: 'Daily Study Planner',
    subtitle: 'Pip plans your day',
    crewId: 'doci',
    crewName: 'Pip',
    iconBg: '#fde8f1',
    iconColor: '#ff4d94',
    Icon: Calendar,
    willList: [
      'See your daily study targets and free revision slots',
      'Suggest 15-minute focus blocks before mocks',
    ],
    wontText: 'Move or delete your study targets on its own',
    connectedLine: 'Pip can plan your days now.',
  },
  {
    id: 'gk_notes',
    name: 'GK & GS Notes Hub',
    subtitle: 'Olo posts revision recaps',
    crewId: 'velo',
    crewName: 'Olo',
    iconBg: '#fef6db',
    iconColor: '#dfa300',
    Icon: BookOpen,
    willList: [
      'Turn Polity, History & Science into 1-liner hooks',
      'Pin high-yield static GK tables for quick recall',
    ],
    wontText: 'Modify your personal study notes without asking',
    connectedLine: 'Olo can post your GK recaps now.',
  },
  {
    id: 'vocab_mocks',
    name: 'Vocab & Mock Sheets',
    subtitle: 'Quinn and Dex track your score',
    crewId: 'gkia',
    crewName: 'Quinn',
    iconBg: '#e3f8fc',
    iconColor: '#089bb8',
    Icon: Gauge,
    willList: [
      'Load 200+ repeated BlackBook OWS, Idioms & Synonyms',
      'Track your speed and accuracy per section',
    ],
    wontText: 'Submit or end a live test without confirmation',
    connectedLine: 'Quinn & Dex are ready to track your progress.',
  },
  {
    id: 'mistake_book',
    name: 'Mistake Notebook',
    subtitle: 'Bo saves your wrong attempts',
    crewId: 'mocky',
    crewName: 'Bo',
    iconBg: '#eee8fd',
    iconColor: '#7950f2',
    Icon: BookmarkCheck,
    willList: [
      'Automatically collect every wrong or skipped question',
      'Build a 1-tap revision quiz before exam day',
    ],
    wontText: 'Clear your mistake history unless you say so',
    connectedLine: 'Bo can guard your mistake notebook now.',
  },
];

/**
 * Step 7: "Connect your tools" + 3-Stage Native Bottom Sheet Modal
 * Verified across 18.00s - 21.90s in sheet_10, sheet_11, sheet_12:
 * - Stage 1 ('prompt', 18.60s - 19.50s): "Connect {Tool}" + [Icon ••• Mascot] + Will/Won't card + "Allow access"
 * - Stage 2 ('connecting', 19.80s - 20.10s): Button shows spinning loader + "Connecting"
 * - Stage 3 ('connected', 20.40s - 21.00s): Sheet morphs to "{Tool} connected" + Giant cheering mascot + "{Bot} can plan your days now." + "Done" button!
 */
export const ConnectToolsStage: React.FC<{
  connectedIds: string[];
  onConnectTool: (toolId: string, crewName: string) => void;
}> = ({ connectedIds, onConnectTool }) => {
  const [activeSheetTool, setActiveSheetTool] = useState<StudyToolItem | null>(null);
  const [sheetStage, setSheetStage] = useState<'prompt' | 'connecting' | 'connected'>('prompt');

  const handleOpenTool = (tool: StudyToolItem) => {
    if (connectedIds.includes(tool.id)) return;
    triggerHaptic('selection');
    setSheetStage('prompt');
    setActiveSheetTool(tool);
  };

  const handleAllowAccess = () => {
    if (!activeSheetTool || sheetStage !== 'prompt') return;
    triggerHaptic('light');
    setSheetStage('connecting');
    setTimeout(() => {
      triggerHaptic('success');
      setSheetStage('connected');
    }, 520);
  };

  const handleDoneSheet = () => {
    if (!activeSheetTool) return;
    triggerHaptic('light');
    onConnectTool(activeSheetTool.id, activeSheetTool.crewName);
    setActiveSheetTool(null);
    setSheetStage('prompt');
  };

  return (
    <div className="space-y-2.5 select-none">
      {/* 5 White Tool Rows (18.00s - 21.90s) */}
      <div className="space-y-2">
        {STUDY_TOOLS.map((tool) => {
          const isConnected = connectedIds.includes(tool.id);
          const IconComp = tool.Icon;
          return (
            <div
              key={tool.id}
              onClick={() => handleOpenTool(tool)}
              className={`w-full min-h-[54px] px-3.5 py-2 rounded-[18px] bg-white dark:bg-slate-800/95 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between gap-3 shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-transform ${
                !isConnected ? 'cursor-pointer active:scale-[0.985]' : ''
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  data-mascot-id={tool.crewId}
                  style={{ backgroundColor: tool.iconBg, color: tool.iconColor }}
                  className="w-9 h-9 rounded-[12px] flex items-center justify-center shrink-0"
                >
                  <IconComp className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs sm:text-[13.5px] font-bold text-[#141416] dark:text-white truncate">
                    {tool.name}
                  </div>
                  <div className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                    {tool.subtitle}
                  </div>
                </div>
              </div>

              {isConnected ? (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#eafaf1] dark:bg-emerald-950/60 text-[#16a34a] dark:text-emerald-400 text-xs font-bold shrink-0">
                  <Check className="w-3.5 h-3.5 stroke-[2.8]" />
                  <span>Connected</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenTool(tool);
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#f1f3f5] dark:bg-slate-700 text-[#141416] dark:text-white text-xs font-bold shrink-0 hover:bg-slate-200 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Connect</span>
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Lavender Privacy & Offline Banner (18.00s - 21.90s) */}
      <div className="px-3.5 py-2.5 rounded-[16px] bg-[#eef1ff] dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/50 flex items-center gap-2.5 text-[11.5px] font-medium text-[#364fc7] dark:text-indigo-300 leading-snug">
        <Lock className="w-4 h-4 shrink-0 text-[#375dfb]" />
        <span>
          Read-only until you say so. Letters always ask before changing anything.
        </span>
      </div>

      {/* Interactive 3-Stage Native Bottom Sheet Modal (Exact match to 18.60s - 21.00s in sheet_10 & sheet_11!) */}
      <AnimatePresence>
        {activeSheetTool && (
          <div className="fixed inset-0 z-50 flex items-end justify-center p-2 sm:p-4">
            {/* Dark Translucent Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveSheetTool(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
            />

            {/* Bottom Sheet Card */}
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={`Connect ${activeSheetTool.name}`}
              initial={{ y: '100%', opacity: 0.6 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', stiffness: 360, damping: 32 }}
              className="relative z-10 w-full max-w-[400px] rounded-[28px] bg-white dark:bg-slate-900 p-5 shadow-2xl border border-slate-100 dark:border-slate-800"
            >
              <AnimatePresence mode="wait">
                {sheetStage !== 'connected' ? (
                  /* STAGE 1 & 2: Permission Prompt & Connecting Spinner (18.60s - 20.10s) */
                  <motion.div
                    key="sheet-prompt"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, filter: 'blur(4px)' }}
                    transition={{ duration: 0.18 }}
                    className="space-y-4"
                  >
                    {/* Header Row: Left Title + Right Circular Close Button (19.20s) */}
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-extrabold text-[#141416] dark:text-white">
                        Connect {activeSheetTool.name}
                      </h3>
                      <button
                        type="button"
                        onClick={() => setActiveSheetTool(null)}
                        aria-label="Close"
                        className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center hover:bg-slate-200"
                      >
                        <X className="w-3.5 h-3.5 stroke-[2.5]" />
                      </button>
                    </div>

                    {/* Tool Squircle  • • •  Letter Mascot (19.20s) */}
                    <div className="flex items-center justify-center gap-3 py-1">
                      <div
                        style={{
                          backgroundColor: activeSheetTool.iconBg,
                          color: activeSheetTool.iconColor,
                        }}
                        className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-2xs"
                      >
                        <activeSheetTool.Icon className="w-5 h-5" />
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                      </div>
                      <CrewMascot id={activeSheetTool.crewId} size="sm" state="cheering" />
                    </div>

                    {/* Will / Won't Permission Card (19.20s) */}
                    <div className="rounded-2xl bg-[#f6f6f7] dark:bg-slate-800/80 p-3.5 space-y-2 text-xs">
                      <div className="space-y-1">
                        <div className="font-bold text-slate-400">
                          {activeSheetTool.crewName} will
                        </div>
                        {activeSheetTool.willList.map((line, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-2 text-[#141416] dark:text-slate-200 font-medium"
                          >
                            <Check className="w-3.5 h-3.5 text-[#16a34a] shrink-0 mt-0.5 stroke-[2.8]" />
                            <span>{line}</span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-1.5 border-t border-slate-200/70 dark:border-slate-700 space-y-1">
                        <div className="font-bold text-slate-400">
                          {activeSheetTool.crewName} won&apos;t
                        </div>
                        <div className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                          <X className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5 stroke-[2.8]" />
                          <span>{activeSheetTool.wontText}</span>
                        </div>
                      </div>
                    </div>

                    {/* Primary Button: "Allow access" -> "◌ Connecting" (19.80s - 20.10s) */}
                    <button
                      type="button"
                      onClick={handleAllowAccess}
                      disabled={sheetStage === 'connecting'}
                      className="w-full min-h-[48px] py-3 rounded-2xl bg-[#141416] dark:bg-white text-white dark:text-[#141416] font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                    >
                      {sheetStage === 'connecting' ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Connecting</span>
                        </>
                      ) : (
                        <span>Allow access</span>
                      )}
                    </button>
                  </motion.div>
                ) : (
                  /* STAGE 3: Connected Celebration Sheet (Exact match to 20.70s & 21.00s in sheet_11!) */
                  <motion.div
                    key="sheet-connected"
                    initial={{ opacity: 0, filter: 'blur(4px)', scale: 0.96 }}
                    animate={{ opacity: 1, filter: 'blur(0px)', scale: 1 }}
                    transition={{ duration: 0.22 }}
                    className="space-y-4 text-center"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-extrabold text-[#141416] dark:text-white">
                        {activeSheetTool.name} connected
                      </h3>
                      <button
                        type="button"
                        onClick={handleDoneSheet}
                        aria-label="Close"
                        className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center"
                      >
                        <X className="w-3.5 h-3.5 stroke-[2.5]" />
                      </button>
                    </div>

                    <div className="py-3 flex flex-col items-center justify-center">
                      <motion.div
                        initial={{ scale: 0.6, y: 10 }}
                        animate={{ scale: 1, y: [0, -6, 0] }}
                        transition={{ duration: 0.45 }}
                      >
                        <CrewMascot id={activeSheetTool.crewId} size="lg" state="cheering" />
                      </motion.div>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-3">
                        {activeSheetTool.connectedLine}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleDoneSheet}
                      className="w-full min-h-[48px] py-3 rounded-2xl bg-[#141416] dark:bg-white text-white dark:text-[#141416] font-bold text-sm flex items-center justify-center transition-all active:scale-[0.98]"
                    >
                      Done
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

/**
 * Step 8: "Want a morning nudge from Pip?" (Exact match to 22.20s - 23.40s in sheet_12 & sheet_13).
 * - 22.20s: Giant Pink 'p' Mascot + Top-Right Tilted Dark Bell Square
 * - 22.50s: Realistic Notification Preview Card slides in below Pip
 * - 23.10s: When turned on, Bell morphs to solid green Checkmark square (#2ecc71) + Ada says "Nudges on. See you at 8:30!"
 */
export const MorningNudgeStage: React.FC<{
  userName: string;
  examDisplayName: string;
  nudgeEnabled: boolean;
  onToggleNudge: (enabled: boolean) => void;
  inFlightIds?: Array<CrewCompanionId | 'milo'>;
}> = ({ userName, examDisplayName, nudgeEnabled, onToggleNudge, inFlightIds = [] }) => {
  const firstName = userName?.trim() ? userName.trim().split(/\s+/)[0] : 'Ritu';

  return (
    <div className="flex flex-col justify-center pt-1 space-y-4 select-none">
      {/* 1. Giant Pink 'p' Mascot + Top-Right Tilted Bell -> Green Checkmark Square (22.20s - 23.40s) */}
      <div className="relative flex flex-col items-center justify-center pt-4 pb-1 mx-auto">
        <div
          className="absolute w-48 h-48 rounded-full bg-pink-200/45 dark:bg-pink-500/15 blur-2xl pointer-events-none"
          aria-hidden="true"
        />

        <div className="relative">
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <CrewMascot
              id="doci"
              size="hero"
              state="cheering"
              tiltDeg={-3}
              isFlightHidden={inFlightIds.includes('doci')}
            />
          </motion.div>

          {/* Floating Tilted Bell Square -> Solid Green Checkmark Square (23.10s & 23.40s) */}
          <motion.button
            type="button"
            onClick={() => {
              triggerHaptic('success');
              onToggleNudge(!nudgeEnabled);
            }}
            aria-label={nudgeEnabled ? 'Disable morning nudge' : 'Enable morning nudge'}
            animate={{
              scale: nudgeEnabled ? [0.85, 1.15, 1] : 1,
              rotate: nudgeEnabled ? 0 : 8,
            }}
            className={`absolute -top-2 -right-3 w-11 h-11 rounded-[14px] flex items-center justify-center shadow-lg transition-colors ${
              nudgeEnabled
                ? 'bg-[#2ecc71] text-white'
                : 'bg-[#212529] text-white'
            }`}
          >
            {nudgeEnabled ? (
              <Check className="w-5 h-5 stroke-[3]" />
            ) : (
              <Bell className="w-5 h-5" />
            )}
          </motion.button>
        </div>

        <div
          className="w-20 h-3 rounded-full bg-pink-950/10 blur-[1px] mt-1"
          aria-hidden="true"
        />
      </div>

      {/* 2. Notification Preview Card (Slides in at 22.50s right below Pip!) */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18, type: 'spring', stiffness: 340, damping: 26 }}
        className="w-full rounded-[20px] bg-white dark:bg-slate-800/95 border border-slate-200/85 dark:border-slate-700 p-4 shadow-[0_6px_20px_rgba(0,0,0,0.05)] space-y-1.5"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CrewMascot id="doci" size="xs" state="awake" disableFlightAnchor />
            <span className="text-xs font-extrabold text-[#141416] dark:text-white">
              Pip
            </span>
          </div>
          <span className="text-xs font-medium text-slate-400">8:30 AM</span>
        </div>
        <p className="text-xs sm:text-[13px] text-slate-700 dark:text-slate-200 font-medium leading-snug">
          Morning, {firstName}! 15 high-yield {examDisplayName} questions today. I held 45
          minutes after lunch for your PYQ review.
        </p>
      </motion.div>

      {/* 3. Left-Aligned Bold Heading & Subtitle Below Notification Card (22.50s - 23.40s) */}
      <div className="space-y-1 pt-1">
        <h1 className="text-2xl sm:text-[26px] font-extrabold tracking-tight text-[#141416] dark:text-white leading-tight">
          Want a morning nudge from Pip?
        </h1>
        <p className="text-xs sm:text-[13.5px] text-slate-500 dark:text-slate-400 leading-relaxed">
          One short plan each morning. You choose what else pings you.
        </p>
      </div>
    </div>
  );
};
