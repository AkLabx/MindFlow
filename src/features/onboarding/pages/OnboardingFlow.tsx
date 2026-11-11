import React, { useState, useEffect, useLayoutEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { motion } from 'framer-motion';
import {
  ChevronLeft,
  ArrowRight,
  FlaskConical,
  X,
} from 'lucide-react';
import { useAuth } from '@/features/auth';
import { OnboardingPolicy } from '@/lib/navigation/policies/OnboardingPolicy';
import { IntentPolicy } from '@/lib/navigation/policies/IntentPolicy';
import { supabase } from '@/lib/supabase';
import { useExamContextStore } from '@/stores/useExamContextStore';
import { useAppConfigStore } from '@/stores/useAppConfigStore';
import { CANONICAL_EXAMS } from '@/features/dashboard/constants/examRegistry';
import { triggerHaptic } from '@/lib/haptics';
import { BrandSpinner } from '@/components/brand';
import {
  ALL_ONBOARDING_STEP_IDS,
  OnboardingStepId,
  CrewCompanionConfig,
  CrewCompanionId,
  mergeOnboardingConfig,
  interpolatePrompt,
} from '../config/onboardingConfigSchema';
import {
  CrewMascot,
  ProgressiveBrandHeader,
  HeroCrewConstellation,
  MiloGuideHeader,
  LivingNameTiles,
  FinaleCrewCelebration,
  AvatarFlightOverlay,
  AvatarFlightItem,
  AvatarFlightRect,
} from '../components/MindFlowCrewMascots';
import {
  PlanetaryExamWheel,
  WakeUpCrewList,
  CrewShowcaseCarousel,
  FirstTaskLiveDemo,
  ConnectToolsStage,
  MorningNudgeStage,
} from '../components/OnboardingInteractiveStages';

const DRAFT_STORAGE_KEY = 'mindflow_onboarding_draft_v3';

interface OnboardingDraftState {
  stepId: OnboardingStepId;
  fullName: string;
  selectedExamId: string;
  awakenedCrewIds: string[];
  connectedToolIds: string[];
  nudgeEnabled: boolean;
}

type MascotIdKey = CrewCompanionId | 'milo';

function captureScreenMascotRects(): Partial<Record<MascotIdKey, AvatarFlightRect>> {
  const map: Partial<Record<MascotIdKey, AvatarFlightRect>> = {};
  if (typeof document === 'undefined') return map;
  const nodes = document.querySelectorAll<HTMLElement>('[data-mascot-id]');
  nodes.forEach((node) => {
    const id = node.getAttribute('data-mascot-id') as MascotIdKey | null;
    if (!id || map[id]) return;
    const r = node.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) {
      map[id] = {
        left: r.left,
        top: r.top,
        width: r.width,
        height: r.height,
      };
    }
  });
  return map;
}

/**
 * Fallback Error Boundary so an unexpected WebView rendering quirk never traps a user in Onboarding.
 */
class OnboardingErrorBoundary extends React.Component<
  { onFallbackComplete: (examId: string) => void; children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { onFallbackComplete: (examId: string) => void; children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 space-y-4 text-center">
          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            Select Your Target Exam
          </h2>
          <div className="grid grid-cols-1 gap-2.5">
            {CANONICAL_EXAMS.map((exam) => (
              <button
                key={exam.id}
                type="button"
                onClick={() => this.props.onFallbackComplete(exam.id)}
                className="w-full min-h-[48px] p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-left font-bold text-sm text-slate-900 dark:text-white flex items-center justify-between"
              >
                <span>{exam.displayName}</span>
                <ArrowRight className="w-4 h-4 text-indigo-600" />
              </button>
            ))}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export const OnboardingFlow: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isPreview = searchParams.get('preview') === '1';

  const { config, previewConfig, clearPreview } = useAppConfigStore();
  const onboardingConfig = useMemo(() => {
    const rawOnboarding = isPreview
      ? previewConfig?.branding?.onboarding ?? config.branding?.onboarding
      : config.branding?.onboarding;
    return mergeOnboardingConfig(rawOnboarding);
  }, [isPreview, previewConfig, config.branding?.onboarding]);

  const activeSteps = useMemo<OnboardingStepId[]>(() => {
    return ALL_ONBOARDING_STEP_IDS.filter(
      (id) =>
        id === 'hero' ||
        id === 'exam_wheel' ||
        id === 'finale' ||
        onboardingConfig.enabledSteps[id] !== false
    );
  }, [onboardingConfig.enabledSteps]);

  // Extract clean first name if available from Google Auth metadata
  const defaultFirstName = useMemo(() => {
    const metaName = user?.user_metadata?.full_name || '';
    return metaName.trim() ? metaName.trim().split(/\s+/)[0] : '';
  }, [user?.user_metadata?.full_name]);

  // Restore in-flight draft state from sessionStorage (Zero-Amnesia Continuity)
  const initialDraft = useMemo<OnboardingDraftState>(() => {
    try {
      const raw = sessionStorage.getItem(DRAFT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<OnboardingDraftState>;
        return {
          stepId: parsed.stepId || 'hero',
          fullName: parsed.fullName ?? defaultFirstName,
          selectedExamId: parsed.selectedExamId || 'ssc_cgl',
          awakenedCrewIds:
            Array.isArray(parsed.awakenedCrewIds) && parsed.awakenedCrewIds.length > 0
              ? parsed.awakenedCrewIds
              : ['pyqo', 'velo', 'doci'],
          connectedToolIds:
            Array.isArray(parsed.connectedToolIds) && parsed.connectedToolIds.length > 0
              ? parsed.connectedToolIds
              : ['pyq_bank'],
          nudgeEnabled: parsed.nudgeEnabled ?? false,
        };
      }
    } catch {
      // Ignore storage read errors
    }
    return {
      stepId: 'hero',
      fullName: defaultFirstName,
      selectedExamId: useExamContextStore.getState().activeExamId || 'ssc_cgl',
      awakenedCrewIds: ['pyqo', 'velo', 'doci'],
      connectedToolIds: ['pyq_bank'],
      nudgeEnabled: false,
    };
  }, [defaultFirstName]);

  const [currentStepId, setCurrentStepId] = useState<OnboardingStepId>(initialDraft.stepId);
  const [fullName, setFullName] = useState<string>(initialDraft.fullName);
  const [selectedExamId, setSelectedExamId] = useState<string>(initialDraft.selectedExamId);
  const [awakenedCrewIds, setAwakenedCrewIds] = useState<string[]>(initialDraft.awakenedCrewIds);
  const [connectedToolIds, setConnectedToolIds] = useState<string[]>(initialDraft.connectedToolIds);
  const [nudgeEnabled, setNudgeEnabled] = useState<boolean>(initialDraft.nudgeEnabled);
  const [reactionMessage, setReactionMessage] = useState<string | null>(null);
  const [activeFlights, setActiveFlights] = useState<AvatarFlightItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const lastTypingHapticRef = useRef<number>(0);
  const beforeRectsRef = useRef<Partial<Record<MascotIdKey, AvatarFlightRect>> | null>(null);
  const prevStepIdRef = useRef<OnboardingStepId>(initialDraft.stepId);
  const flightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Resolve current step index safely against activeSteps
  const activeStepIndex = useMemo(() => {
    const idx = activeSteps.indexOf(currentStepId);
    return idx >= 0 ? idx : 0;
  }, [activeSteps, currentStepId]);

  const resolvedStepId = activeSteps[activeStepIndex] || 'hero';

  const inFlightIds = useMemo<MascotIdKey[]>(
    () => activeFlights.map((f) => f.id),
    [activeFlights]
  );

  /**
   * Transitions to `nextStepId` while capturing all current avatar bounding boxes
   * so `<AvatarFlightOverlay />` physically flies them to their new screen positions!
   */
  const transitionToStep = useCallback((nextStepId: OnboardingStepId) => {
    beforeRectsRef.current = captureScreenMascotRects();
    setCurrentStepId(nextStepId);
  }, []);

  /**
   * Real-time FLIP measurement after `resolvedStepId` updates:
   * Computes exact `from -> to` flight paths between old and new screen positions.
   */
  useLayoutEffect(() => {
    const prevStep = prevStepIdRef.current;
    if (prevStep === resolvedStepId) return;
    prevStepIdRef.current = resolvedStepId;

    const beforeMap = beforeRectsRef.current;
    beforeRectsRef.current = null;
    if (!beforeMap) return;

    const afterMap = captureScreenMascotRects();
    const flights: AvatarFlightItem[] = [];

    const allIds: MascotIdKey[] = ['milo', 'pyqo', 'velo', 'doci', 'gkia', 'lexi', 'mocky'];
    const heroCenter = beforeMap.milo;

    allIds.forEach((id, idx) => {
      const fromRect = beforeMap[id];
      const toRect = afterMap[id];

      if (fromRect && toRect) {
        // Avatar exists on both screens: fly if its position or size changed, or hop if stationary guide!
        const dx = Math.abs(fromRect.left - toRect.left);
        const dy = Math.abs(fromRect.top - toRect.top);
        const dw = Math.abs(fromRect.width - toRect.width);
        if (dx > 6 || dy > 6 || dw > 6) {
          flights.push({
            id,
            from: { ...fromRect, tiltDeg: -10 },
            to: { ...toRect, tiltDeg: 0 },
            state: 'cheering',
            delay: idx * 0.014,
            peakScale: 1.16,
          });
        } else if (id === 'milo') {
          // Lively guide hop when Ada stays in the top-left header across steps 2..8
          flights.push({
            id,
            from: {
              ...fromRect,
              top: fromRect.top - 10,
              tiltDeg: -12,
            },
            to: { ...toRect, tiltDeg: -3 },
            state: 'cheering',
            peakScale: 1.18,
          });
        }
      } else if (fromRect && !toRect && prevStep === 'hero' && heroCenter) {
        // Step 1 -> Step 2: Orbiting 6 letters scatter radially outward while Ada flies to top-left!
        const vx = fromRect.left - heroCenter.left;
        const vy = fromRect.top - heroCenter.top;
        flights.push({
          id,
          from: { ...fromRect, tiltDeg: -6 },
          to: {
            left: fromRect.left + vx * 0.65,
            top: fromRect.top + vy * 0.65,
            width: fromRect.width * 0.7,
            height: fromRect.height * 0.7,
            tiltDeg: vx >= 0 ? 22 : -22,
          },
          state: 'cheering',
          delay: idx * 0.012,
          endOpacity: 0,
          peakScale: 1.08,
        });
      } else if (!fromRect && toRect && resolvedStepId === 'wake_crew') {
        // Step 3 -> Step 4: The 6 crew letters glide in from a staggered right arc into their vertical list rows!
        flights.push({
          id,
          from: {
            left: toRect.left + 120 + (idx % 2) * 35,
            top: toRect.top - 24 + idx * 6,
            width: 48,
            height: 48,
            tiltDeg: 14,
          },
          to: { ...toRect, tiltDeg: 0 },
          state: awakenedCrewIds.includes(id) ? 'cheering' : 'sleeping',
          delay: idx * 0.018,
          peakScale: 1.12,
        });
      } else if (!fromRect && toRect && resolvedStepId === 'finale') {
        // Step 8 -> Step 9: Gigi ('pyqo') & Olo ('velo') fly in from the wings to join Ada & Pip in the Finale lineup!
        flights.push({
          id,
          from: {
            left: toRect.left + (id === 'pyqo' ? -75 : 75),
            top: toRect.top + 52,
            width: 38,
            height: 38,
            tiltDeg: id === 'pyqo' ? -18 : 18,
          },
          to: { ...toRect, tiltDeg: 0 },
          state: 'cheering',
          delay: 0.03,
          peakScale: 1.16,
        });
      }
    });

    if (flights.length > 0) {
      if (flightTimerRef.current) clearTimeout(flightTimerRef.current);
      setActiveFlights(flights);
      flightTimerRef.current = setTimeout(() => {
        setActiveFlights([]);
      }, 430);
    }
  }, [resolvedStepId, awakenedCrewIds]);

  // Closure-safe refs for Capacitor Android hardware back listener
  const activeStepIndexRef = useRef<number>(activeStepIndex);
  activeStepIndexRef.current = activeStepIndex;
  const activeStepsRef = useRef<OnboardingStepId[]>(activeSteps);
  activeStepsRef.current = activeSteps;
  const isPreviewRef = useRef<boolean>(isPreview);
  isPreviewRef.current = isPreview;

  // Save draft to sessionStorage on changes
  useEffect(() => {
    if (isPreview) return;
    try {
      const draft: OnboardingDraftState = {
        stepId: resolvedStepId,
        fullName,
        selectedExamId,
        awakenedCrewIds,
        connectedToolIds,
        nudgeEnabled,
      };
      sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
    } catch {
      // Ignore storage quota errors
    }
  }, [
    isPreview,
    resolvedStepId,
    fullName,
    selectedExamId,
    awakenedCrewIds,
    connectedToolIds,
    nudgeEnabled,
  ]);

  // Mark onboarding started for authenticated non-preview users
  useEffect(() => {
    if (user && !isPreview) {
      const status = OnboardingPolicy.getStatus(user.id);
      if (status === 'NOT_STARTED') {
        OnboardingPolicy.markStarted(user.id);
      }
    }
  }, [user, isPreview]);

  // Clear temporary reaction bubble when changing steps
  useEffect(() => {
    setReactionMessage(null);
  }, [resolvedStepId]);

  // Capacitor Android Hardware & Gesture Back Button Listener (Closure-Safe)
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let listenerHandle: { remove: () => Promise<void> } | null = null;
    const registerBackHandler = async () => {
      listenerHandle = await App.addListener('backButton', () => {
        const currentIdx = activeStepIndexRef.current;
        const stepsList = activeStepsRef.current;
        if (currentIdx > 0) {
          triggerHaptic('light');
          transitionToStep(stepsList[currentIdx - 1]);
        } else if (isPreviewRef.current) {
          clearPreview();
          navigate('/admin/app-config', { replace: true });
        } else {
          App.minimizeApp();
        }
      });
    };

    registerBackHandler();

    return () => {
      if (listenerHandle?.remove) {
        listenerHandle.remove();
      }
    };
  }, [clearPreview, navigate, transitionToStep]);

  const selectedExamObj = useMemo(() => {
    return (
      CANONICAL_EXAMS.find((e) => e.id === selectedExamId) || CANONICAL_EXAMS[0]
    );
  }, [selectedExamId]);

  const awakenedCrewObjects = useMemo(() => {
    const matched = onboardingConfig.crew.filter((c) => awakenedCrewIds.includes(c.id));
    return matched.length > 0 ? matched : onboardingConfig.crew.slice(0, 3);
  }, [onboardingConfig.crew, awakenedCrewIds]);

  const firstNameDisplay = useMemo(() => {
    return fullName.trim() ? fullName.trim().split(/\s+/)[0] : 'Ritu';
  }, [fullName]);

  const stepPromptText = useMemo(() => {
    const rawTemplate = onboardingConfig.prompts[resolvedStepId] || '';
    return interpolatePrompt(rawTemplate, {
      name: fullName,
      exam: selectedExamObj.displayName,
    });
  }, [onboardingConfig.prompts, resolvedStepId, fullName, selectedExamObj.displayName]);

  const handleExitPreview = () => {
    triggerHaptic('light');
    clearPreview();
    navigate('/admin/app-config', { replace: true });
  };

  const handleBackStep = () => {
    triggerHaptic('light');
    if (activeStepIndex > 0) {
      transitionToStep(activeSteps[activeStepIndex - 1]);
    } else if (isPreview) {
      handleExitPreview();
    }
  };

  /**
   * Commits onboarding completion offline-first (0ms local stores before background network sync).
   */
  const finalizeOnboarding = (customRoute?: string, overrideExamId?: string) => {
    if (isSubmitting) return;
    triggerHaptic('success');

    if (isPreview) {
      handleExitPreview();
      return;
    }

    setIsSubmitting(true);
    const finalExamId = overrideExamId || selectedExamId || 'ssc_cgl';

    // 1. Synchronous 0ms Store & Policy Commit
    const examStore = useExamContextStore.getState();
    examStore.setPinnedExams([finalExamId]);
    examStore.setActiveExam(finalExamId, 'onboarding');

    if (user) {
      OnboardingPolicy.markCompleted(user.id);
    }

    try {
      sessionStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch {
      // Ignore storage error
    }

    // 2. Non-Blocking Background Supabase User Metadata Sync
    if (user) {
      supabase.auth
        .updateUser({
          data: {
            onboarding_completed: true,
            full_name: fullName.trim() || undefined,
            target_exam: finalExamId,
            onboarding_crew: awakenedCrewIds,
            connected_tools: connectedToolIds,
            morning_nudge_enabled: nudgeEnabled,
          },
        })
        .catch((err) => {
          console.warn('Non-blocking onboarding profile sync warning:', err);
        });
    }

    // 3. Sanitized Destination Routing
    const poppedIntent = IntentPolicy.popIntent();
    const isSafeIntent =
      poppedIntent &&
      !poppedIntent.startsWith('/onboarding') &&
      !poppedIntent.startsWith('/login') &&
      poppedIntent !== '/';

    const targetDestination = customRoute || (isSafeIntent ? poppedIntent! : '/dashboard');
    navigate(targetDestination, { replace: true });
  };

  const handleNextStep = () => {
    triggerHaptic('light');

    // Commit exam selection to global store when advancing past the exam wheel
    if (resolvedStepId === 'exam_wheel' && !isPreview) {
      useExamContextStore.getState().setActiveExam(selectedExamId, 'onboarding');
    }

    const nextIdx = activeStepIndex + 1;
    if (nextIdx >= activeSteps.length) {
      finalizeOnboarding();
      return;
    }

    transitionToStep(activeSteps[nextIdx]);
  };

  const handleToggleCrew = (member: CrewCompanionConfig) => {
    const isCurrentlyAwake = awakenedCrewIds.includes(member.id);
    if (isCurrentlyAwake) {
      if (awakenedCrewIds.length <= 1) {
        triggerHaptic('warning');
        return;
      }
      triggerHaptic('light');
      setAwakenedCrewIds((prev) => prev.filter((id) => id !== member.id));
      setReactionMessage(`${member.name} is napping.`);
    } else {
      triggerHaptic('selection');
      setAwakenedCrewIds((prev) => [...prev, member.id]);
      setReactionMessage(`${member.name} is up!`);
    }
  };

  const handleConnectTool = (toolId: string, crewName: string) => {
    setConnectedToolIds((prev) => (prev.includes(toolId) ? prev : [...prev, toolId]));
    setReactionMessage(`Calendar is in. ${crewName} is thrilled!`);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextVal = e.target.value;
    setFullName(nextVal);
    const now = Date.now();
    if (now - lastTypingHapticRef.current > 110) {
      lastTypingHapticRef.current = now;
      triggerHaptic('selection');
    }
  };

  // Dynamic Bottom Primary CTA Label matching the reference video (00.00s - 30.60s)
  const isNameEmpty = resolvedStepId === 'name' && fullName.trim().length === 0;

  const primaryCtaLabel = useMemo(() => {
    switch (resolvedStepId) {
      case 'hero':
        return onboardingConfig.hero.ctaText || 'Meet the crew';
      case 'name':
        return fullName.trim().length === 0 ? 'Type your name' : 'Nice to meet you';
      case 'exam_wheel':
      case 'connect_tools':
        return 'Continue';
      case 'wake_crew':
        return 'Meet my crew';
      case 'crew_carousel':
        return 'See them in action';
      case 'first_task':
        return 'Nice, keep going';
      case 'morning_nudge':
        return nudgeEnabled ? 'Nudges on' : 'Turn on nudges';
      case 'finale':
      default:
        return 'Start working';
    }
  }, [resolvedStepId, onboardingConfig.hero.ctaText, fullName, nudgeEnabled]);

  const handlePrimaryCtaClick = () => {
    if (resolvedStepId === 'morning_nudge' && !nudgeEnabled) {
      triggerHaptic('success');
      setNudgeEnabled(true);
      setReactionMessage('Nudges on. See you at 8:30!');
      setTimeout(() => {
        handleNextStep();
      }, 480);
      return;
    }
    handleNextStep();
  };

  return (
    <main
      id="main-content"
      role="main"
      className="min-h-[100dvh] w-full flex flex-col justify-between bg-[#fcfcfd] dark:bg-slate-950 md:bg-gradient-to-br md:from-[#f3f0ff] md:via-[#fdfaf6] md:to-[#ffeef2] md:dark:from-slate-950 md:dark:via-slate-900 md:dark:to-indigo-950/40 p-0 md:p-6 overflow-x-clip select-none md:items-center md:justify-center"
    >
      {/* Real-Time FLIP Avatar Flight Overlay: Moves avatars physically from place to place across steps */}
      <AvatarFlightOverlay flights={activeFlights} />

      {/* Main Responsive Stage: Edge-to-Edge on Mobile, Phone Frame on Desktop */}
      <div className="relative z-10 w-full max-w-[430px] mx-auto flex-1 flex flex-col justify-between bg-[#ffffff] dark:bg-slate-900 md:rounded-[40px] md:shadow-[0_24px_70px_rgba(15,23,42,0.12)] md:border md:border-slate-200/80 md:dark:border-slate-800 min-h-[100dvh] md:min-h-[720px] md:max-h-[90vh] overflow-x-clip">
        {/* Soft Dreamy Pastel Aurora Glows (Matches Video Canvas) */}
        <div
          className="pointer-events-none absolute -top-10 right-0 w-64 h-64 rounded-full bg-gradient-to-bl from-[#e4e9ff]/75 via-[#fde8f1]/40 to-transparent dark:from-indigo-500/10 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute bottom-12 -left-10 w-64 h-64 rounded-full bg-gradient-to-tr from-[#fef6db]/60 via-[#fdece2]/35 to-transparent dark:from-amber-500/10 blur-3xl"
          aria-hidden="true"
        />

        {/* Admin Sandbox Preview Banner */}
        {isPreview && (
          <div className="relative z-30 bg-indigo-600 text-white px-4 py-2 text-xs font-bold flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5">
              <FlaskConical className="w-3.5 h-3.5" />
              <span>Admin Sandbox Preview</span>
            </span>
            <button
              type="button"
              onClick={handleExitPreview}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/20 hover:bg-white/30 text-white text-xs font-bold active:scale-95"
            >
              <span>Exit Preview</span>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Top Chrome: lowercase wordmark on Step 1; (< | Progressive M I N D F L O W | Skip) on Steps 2..9 */}
        <header className="relative z-20 px-5 sm:px-6 pt-[max(env(safe-area-inset-top,0px),14px)] pb-1 flex items-center justify-between min-h-[54px] shrink-0">
          {activeStepIndex === 0 ? (
            <span className="text-[20px] font-black tracking-tight text-[#141416] dark:text-white">
              mindflow
            </span>
          ) : (
            <button
              type="button"
              onClick={handleBackStep}
              aria-label="Previous step"
              className="w-11 h-11 -ml-2.5 rounded-full flex items-center justify-center text-[#141416] dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all"
            >
              <ChevronLeft className="w-5 h-5 stroke-[2.2]" />
            </button>
          )}

          {activeStepIndex > 0 && (
            <ProgressiveBrandHeader
              litCount={activeStepIndex}
              isFinale={resolvedStepId === 'finale'}
            />
          )}

          {resolvedStepId !== 'finale' ? (
            <button
              type="button"
              onClick={() => finalizeOnboarding()}
              className="min-h-[44px] px-2 -mr-1 text-[13.5px] font-medium text-[#68676e] dark:text-slate-400 hover:text-[#141416] dark:hover:text-white active:scale-95 transition-colors"
            >
              Skip
            </button>
          ) : (
            <div className="w-11" aria-hidden="true" />
          )}
        </header>

        {/* Scrollable Stage Content Zone — Top-Aligned on Steps 2..8 so Header & Guide Never Jump */}
        <OnboardingErrorBoundary
          onFallbackComplete={(examId) => finalizeOnboarding('/dashboard', examId)}
        >
          <div className="relative z-10 flex-1 w-full overflow-y-auto min-h-0 px-5 sm:px-6 pt-1.5 pb-2 flex flex-col">
            {/* Persistent Top-Left Ada Guide + Typing Bubble on Steps 2..8 */}
            {resolvedStepId !== 'hero' && resolvedStepId !== 'finale' && (
              <div className="mb-2.5 shrink-0">
                <MiloGuideHeader
                  message={stepPromptText}
                  reactionBadge={reactionMessage}
                  isFlightHidden={inFlightIds.includes('milo')}
                />
              </div>
            )}

            {/* Animated Stage Body with Blur-Dissolve Transition */}
            <motion.div
              key={resolvedStepId}
              initial={{ opacity: 0, y: 8, filter: 'blur(5px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="flex-1 flex flex-col"
            >
              {/* STEP 1: HERO WELCOME & ORBITAL CREW CONSTELLATION */}
              {resolvedStepId === 'hero' && (
                <div className="flex-1 flex flex-col justify-between py-2">
                  <div className="my-auto">
                    <HeroCrewConstellation
                      greetings={onboardingConfig.hero.greetings}
                      inFlightIds={inFlightIds}
                    />
                  </div>

                  <div className="space-y-2.5 pt-2 pb-1">
                    <h1 className="text-[32px] sm:text-[34px] font-extrabold text-[#141416] dark:text-white tracking-[-0.03em] leading-[1.08]">
                      {onboardingConfig.hero.headline}
                    </h1>
                    <p className="text-[14.5px] text-[#68676e] dark:text-slate-400 leading-[1.45]">
                      {onboardingConfig.hero.subtitle}
                    </p>
                  </div>
                </div>
              )}

              {/* STEP 2: WHAT'S YOUR NAME? + SQUIRCLE LETTER TILES */}
              {resolvedStepId === 'name' && (
                <div className="flex-1 flex flex-col justify-between pt-1">
                  <div className="space-y-4">
                    <h1 className="text-[28px] sm:text-[30px] font-extrabold text-[#141416] dark:text-white tracking-[-0.025em] leading-tight">
                      What&apos;s your name?
                    </h1>

                    <div className="space-y-1.5 pt-1">
                      <label
                        htmlFor="onboarding-firstname-input"
                        className="block text-xs font-medium text-[#68676e] dark:text-slate-400"
                      >
                        First name
                      </label>
                      <input
                        id="onboarding-firstname-input"
                        type="text"
                        autoComplete="name"
                        inputMode="text"
                        enterKeyHint="next"
                        maxLength={24}
                        value={fullName}
                        onChange={handleNameChange}
                        onFocus={(e) => {
                          setTimeout(() => {
                            e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          }, 160);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleNextStep();
                          }
                        }}
                        placeholder="e.g. Ritu"
                        className="select-text block w-full px-4 min-h-[54px] rounded-[16px] bg-white dark:bg-slate-800 border-2 border-[#375dfb] text-[#141416] dark:text-white placeholder-slate-400 text-[17px] font-semibold focus:outline-none focus:ring-4 focus:ring-[#375dfb]/15 transition-all"
                      />
                    </div>

                    <LivingNameTiles name={fullName} />
                  </div>

                  <p className="text-xs text-[#8e8d94] dark:text-slate-500 text-center pt-6 pb-1">
                    Only used to greet you. You can change it anytime.
                  </p>
                </div>
              )}

              {/* STEP 3: C-SHAPED DOTTED ORBITAL ARC WHEEL */}
              {resolvedStepId === 'exam_wheel' && (
                <div className="space-y-1 pt-1">
                  <h1 className="text-[28px] sm:text-[30px] font-extrabold text-[#141416] dark:text-white tracking-[-0.025em] leading-[1.12]">
                    Which exam are you preparing for?
                  </h1>

                  <PlanetaryExamWheel
                    selectedExamId={selectedExamId}
                    onSelectExam={setSelectedExamId}
                  />
                </div>
              )}

              {/* STEP 4: WAKE UP YOUR CREW LIST */}
              {resolvedStepId === 'wake_crew' && (
                <div className="space-y-3 pt-1">
                  <h1 className="text-[28px] sm:text-[30px] font-extrabold text-[#141416] dark:text-white tracking-[-0.025em] leading-tight">
                    What eats up your study week?
                  </h1>

                  <WakeUpCrewList
                    crew={onboardingConfig.crew}
                    awakenedIds={awakenedCrewIds}
                    onToggleCrew={handleToggleCrew}
                    inFlightIds={inFlightIds}
                  />
                </div>
              )}

              {/* STEP 5: PEEK-A-BOO CREW SHOWCASE CAROUSEL */}
              {resolvedStepId === 'crew_carousel' && (
                <div className="space-y-3 pt-1">
                  <h1 className="text-[28px] sm:text-[30px] font-extrabold text-[#141416] dark:text-white tracking-[-0.025em] leading-tight">
                    Say hi to your crew
                  </h1>

                  <CrewShowcaseCarousel
                    crew={awakenedCrewObjects}
                    inFlightIds={inFlightIds}
                  />
                </div>
              )}

              {/* STEP 6: YOUR FIRST TASK LIVE MICRO-DEMO */}
              {resolvedStepId === 'first_task' && (
                <div className="space-y-3 pt-1">
                  <h1 className="text-[28px] sm:text-[30px] font-extrabold text-[#141416] dark:text-white tracking-[-0.025em] leading-tight">
                    Your first task
                  </h1>

                  <FirstTaskLiveDemo
                    userName={fullName}
                    examDisplayName={selectedExamObj.displayName}
                    inFlightIds={inFlightIds}
                    onTaskDone={() =>
                      setReactionMessage("Ta-da! That's your first task done.")
                    }
                  />
                </div>
              )}

              {/* STEP 7: CONNECT YOUR STUDY TOOLS + NATIVE BOTTOM SHEET */}
              {resolvedStepId === 'connect_tools' && (
                <div className="space-y-3 pt-1">
                  <h1 className="text-[28px] sm:text-[30px] font-extrabold text-[#141416] dark:text-white tracking-[-0.025em] leading-tight">
                    Connect your study tools
                  </h1>

                  <ConnectToolsStage
                    connectedIds={connectedToolIds}
                    onConnectTool={handleConnectTool}
                  />
                </div>
              )}

              {/* STEP 8: MORNING NUDGE FROM PIP */}
              {resolvedStepId === 'morning_nudge' && (
                <div className="flex-1 flex flex-col justify-between pt-1">
                  <MorningNudgeStage
                    userName={fullName}
                    examDisplayName={selectedExamObj.displayName}
                    nudgeEnabled={nudgeEnabled}
                    inFlightIds={inFlightIds}
                    onToggleNudge={(enabled) => {
                      setNudgeEnabled(enabled);
                      if (enabled) {
                        setReactionMessage('Nudges on. See you at 8:30!');
                      } else {
                        setReactionMessage(null);
                      }
                    }}
                  />
                </div>
              )}

              {/* STEP 9: CONFETTI FINALE & STARTER ACTIONS */}
              {resolvedStepId === 'finale' && (
                <div className="flex-1 flex flex-col justify-between py-1">
                  <FinaleCrewCelebration
                    awakenedCrew={awakenedCrewObjects}
                    inFlightIds={inFlightIds}
                  />

                  <div className="text-center space-y-1.5 my-2">
                    <h1 className="text-[28px] sm:text-[30px] font-extrabold text-[#141416] dark:text-white tracking-[-0.025em]">
                      You&apos;re all set, {firstNameDisplay}!
                    </h1>
                    <p className="text-xs sm:text-[13.5px] text-[#68676e] dark:text-slate-400 max-w-xs mx-auto leading-snug">
                      Your {awakenedCrewObjects.length} Letters are awake and ready. Pick a
                      starter below or jump straight in.
                    </p>
                  </div>

                  {/* "START WITH ONE OF THESE" Container */}
                  <div className="rounded-[24px] bg-[#f5f5f7] dark:bg-slate-800/75 p-3.5 space-y-2">
                    <div className="px-1 text-[11px] font-extrabold uppercase tracking-wider text-[#8e8d94] dark:text-slate-400">
                      START WITH ONE OF THESE
                    </div>

                    <div className="space-y-2">
                      {onboardingConfig.starterActions.map((action) => (
                        <button
                          key={action.id}
                          type="button"
                          onClick={() => finalizeOnboarding(action.route)}
                          className="w-full min-h-[50px] px-3.5 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/80 flex items-center justify-between gap-2.5 text-left hover:border-indigo-300 active:scale-[0.985] transition-all shadow-2xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <CrewMascot
                              id={action.crewId}
                              size="xs"
                              state="awake"
                              disableFlightAnchor
                            />
                            <div className="text-xs sm:text-[13px] text-[#141416] dark:text-slate-200 truncate">
                              <span className="font-extrabold text-[#141416] dark:text-white bg-[#f0f0f3] dark:bg-slate-800 px-1.5 py-0.5 rounded-md mr-1.5">
                                {action.crewHandle}
                              </span>
                              <span className="text-slate-600 dark:text-slate-300 font-medium">
                                {action.label}
                              </span>
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </OnboardingErrorBoundary>

        {/* Bottom-Pinned Primary CTA Bar (Exact #141416 Pill Button from Video) */}
        <footer className="relative z-20 px-5 sm:px-6 pt-2 pb-[max(env(safe-area-inset-bottom,0px),18px)] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shrink-0 space-y-1.5">
          <button
            type="button"
            onClick={handlePrimaryCtaClick}
            disabled={isSubmitting}
            className={`relative w-full min-h-[54px] px-6 rounded-[18px] text-white text-[15px] font-bold flex items-center justify-center transition-all select-none touch-manipulation active:scale-[0.985] disabled:opacity-50 ${
              isNameEmpty
                ? 'bg-[#b0b4be] dark:bg-slate-700 shadow-none'
                : 'bg-[#141416] hover:bg-[#232326] dark:bg-indigo-600 dark:hover:bg-indigo-500 shadow-[0_8px_20px_rgba(20,20,22,0.16)]'
            }`}
          >
            {isSubmitting ? (
              <span className="inline-flex items-center gap-2">
                <BrandSpinner variant="inline" size="sm" />
                <span>Opening your workspace...</span>
              </span>
            ) : (
              <>
                <span>{primaryCtaLabel}</span>
                {(resolvedStepId === 'hero' ||
                  (resolvedStepId === 'name' && !isNameEmpty)) && (
                  <ArrowRight className="w-4 h-4 absolute right-5" />
                )}
              </>
            )}
          </button>

          {resolvedStepId === 'connect_tools' && (
            <button
              type="button"
              onClick={handleNextStep}
              className="w-full min-h-[34px] text-xs font-semibold text-[#68676e] dark:text-slate-400 hover:text-[#141416] dark:hover:text-white active:scale-95 transition-colors"
            >
              I&apos;ll do this later
            </button>
          )}

          {resolvedStepId === 'morning_nudge' && (
            <button
              type="button"
              onClick={handleNextStep}
              className="w-full min-h-[34px] text-xs font-semibold text-[#68676e] dark:text-slate-400 hover:text-[#141416] dark:hover:text-white active:scale-95 transition-colors"
            >
              Not now
            </button>
          )}
        </footer>
      </div>
    </main>
  );
};

export default OnboardingFlow;
