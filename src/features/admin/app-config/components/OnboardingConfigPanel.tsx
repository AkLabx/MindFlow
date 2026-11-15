import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Loader2 } from 'lucide-react';
import {
  OnboardingConfig,
  OnboardingStepId,
  DEFAULT_ONBOARDING_CONFIG,
  mergeOnboardingConfig,
} from '@/features/onboarding/config/onboardingConfigSchema';
import { useAppConfigStore } from '@/stores/useAppConfigStore';
import { useNotificationStore } from '@/stores/useNotificationStore';

export const OnboardingConfigPanel: React.FC = () => {
  const { config, previewConfig, updateOnboardingConfig, startPreview, isLoading } =
    useAppConfigStore();
  const showToast = useNotificationStore((state) => state.showToast);
  const navigate = useNavigate();

  const initialOnboarding = mergeOnboardingConfig(
    previewConfig?.branding?.onboarding ?? config.branding?.onboarding
  );

  const [draft, setDraft] = useState<OnboardingConfig>(initialOnboarding);

  const toggleableSteps: Array<{ id: OnboardingStepId; label: string; desc: string }> = [
    {
      id: 'name',
      label: 'Step 2: Name Input + Living Eye-Tiles',
      desc: 'Spawns 3D colored character tiles as user types their name.',
    },
    {
      id: 'wake_crew',
      label: 'Step 4: Wake Up Your Crew Toggle List',
      desc: 'Interactive sleeping-to-awake mascot rows + flying burst.',
    },
    {
      id: 'crew_carousel',
      label: 'Step 5: 3D Crew Showcase Carousel',
      desc: 'Horizontal swipeable companion showcase cards.',
    },
    {
      id: 'first_task',
      label: 'Step 6: Instant First-Task Micro-Demo',
      desc: 'Choreographed PYQ & memory trick simulation.',
    },
    {
      id: 'connect_tools',
      label: 'Step 7: Connect Study Tools & Bottom Sheet',
      desc: 'Interactive study tool rows with native permission bottom sheet.',
    },
    {
      id: 'morning_nudge',
      label: 'Step 8: Morning Nudge Opt-In',
      desc: 'Daily study streak reminder opt-in with bell morph.',
    },
  ];

  const handleToggleStep = (stepId: OnboardingStepId, checked: boolean) => {
    setDraft((prev) => ({
      ...prev,
      enabledSteps: {
        ...prev.enabledSteps,
        [stepId]: checked,
      },
    }));
  };

  const handlePromptChange = (stepId: OnboardingStepId, value: string) => {
    setDraft((prev) => ({
      ...prev,
      prompts: {
        ...prev.prompts,
        [stepId]: value,
      },
    }));
  };

  const handleStarterChange = (
    index: number,
    field: 'crewHandle' | 'label' | 'route',
    value: string
  ) => {
    setDraft((prev) => {
      const nextStarters = prev.starterActions.map((item, idx) =>
        idx === index ? { ...item, [field]: value } : item
      );
      return {
        ...prev,
        starterActions: nextStarters,
      };
    });
  };

  const handleReset = () => {
    setDraft(DEFAULT_ONBOARDING_CONFIG);
  };

  const handleLivePreview = () => {
    startPreview({
      branding: {
        ...config.branding,
        onboarding: mergeOnboardingConfig(draft),
      },
    });
    navigate('/onboarding?preview=1');
  };

  const handlePublish = async () => {
    try {
      await updateOnboardingConfig(draft);
      showToast({
        title: 'Published',
        message: 'Onboarding experience updated remotely for Web & Android APK',
        variant: 'success',
      });
    } catch {
      showToast({
        title: 'Error',
        message: 'Failed to publish onboarding config',
        variant: 'error',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">
            Native "Tiny AI Crew" Onboarding Customizer
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Configure hero copy, toggle optional interactive stages, edit Milo's conversational prompts, and customize starter actions over-the-air.
          </p>
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline self-start sm:self-auto"
        >
          Reset to defaults
        </button>
      </div>

      {/* Hero Stage Copy */}
      <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4">
        <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
          1. Hero Welcome Stage (Step 1)
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Hero Headline
            </label>
            <input
              type="text"
              value={draft.hero.headline}
              onChange={(e) =>
                setDraft({ ...draft, hero: { ...draft.hero, headline: e.target.value } })
              }
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Primary CTA Text
            </label>
            <input
              type="text"
              value={draft.hero.ctaText}
              onChange={(e) =>
                setDraft({ ...draft, hero: { ...draft.hero, ctaText: e.target.value } })
              }
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Hero Subtitle
            </label>
            <textarea
              rows={2}
              value={draft.hero.subtitle}
              onChange={(e) =>
                setDraft({ ...draft, hero: { ...draft.hero, subtitle: e.target.value } })
              }
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Milo Greeting Pill #1
            </label>
            <input
              type="text"
              value={draft.hero.greetings[0]}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  hero: {
                    ...draft.hero,
                    greetings: [e.target.value, draft.hero.greetings[1]],
                  },
                })
              }
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Milo Greeting Pill #2
            </label>
            <input
              type="text"
              value={draft.hero.greetings[1]}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  hero: {
                    ...draft.hero,
                    greetings: [draft.hero.greetings[0], e.target.value],
                  },
                })
              }
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Step Toggles */}
      <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
            2. Interactive Stage Visibility Toggles
          </h4>
          <span className="text-xs text-slate-400">
            Hero, Exam Wheel & Finale are always active
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {toggleableSteps.map((step) => {
            const isChecked = draft.enabledSteps[step.id] !== false;
            return (
              <label
                key={step.id}
                className="flex items-start justify-between gap-3 p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 cursor-pointer"
              >
                <div>
                  <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                    {step.label}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">{step.desc}</div>
                </div>
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => handleToggleStep(step.id, e.target.checked)}
                  className="mt-1 h-4 w-4 rounded text-indigo-600"
                />
              </label>
            );
          })}
        </div>
      </div>

      {/* Milo Conversational Prompts */}
      <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
            3. Milo Speech Bubble Prompts
          </h4>
          <span className="text-xs text-slate-400">
            Supports {'{name}'} and {'{exam}'} placeholders
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {(
            [
              ['name', 'Step 2 (Name Input)'],
              ['exam_wheel', 'Step 3 (Planetary Exam Wheel)'],
              ['wake_crew', 'Step 4 (Wake Up Crew List)'],
              ['crew_carousel', 'Step 5 (Crew Carousel)'],
              ['first_task', 'Step 6 (First Task Demo)'],
              ['connect_tools', 'Step 7 (Connect Study Tools)'],
              ['morning_nudge', 'Step 8 (Morning Nudge)'],
            ] as Array<[OnboardingStepId, string]>
          ).map(([stepId, label]) => (
            <div key={stepId}>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                {label}
              </label>
              <input
                type="text"
                value={draft.prompts[stepId] || ''}
                onChange={(e) => handlePromptChange(stepId, e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Finale Starter Actions */}
      <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
        <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
          4. Finale Quick-Start Action Cards (Step 8)
        </h4>
        <div className="space-y-2.5">
          {draft.starterActions.map((starter, idx) => (
            <div
              key={starter.id}
              className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700"
            >
              <input
                type="text"
                value={starter.crewHandle}
                onChange={(e) => handleStarterChange(idx, 'crewHandle', e.target.value)}
                placeholder="@Pyqo"
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
              />
              <input
                type="text"
                value={starter.label}
                onChange={(e) => handleStarterChange(idx, 'label', e.target.value)}
                placeholder="Action label"
                className="sm:col-span-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
              />
              <input
                type="text"
                value={starter.route}
                onChange={(e) => handleStarterChange(idx, 'route', e.target.value)}
                placeholder="/quiz/config"
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={handleLivePreview}
          className="px-5 py-2.5 rounded-xl font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center gap-2 text-sm"
        >
          <Play className="w-4 h-4" /> Live Sandbox Preview
        </button>
        <button
          type="button"
          onClick={handlePublish}
          disabled={isLoading}
          className="px-6 py-2.5 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 text-sm shadow-md shadow-indigo-500/20"
        >
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          Publish Config
        </button>
      </div>
    </div>
  );
};
