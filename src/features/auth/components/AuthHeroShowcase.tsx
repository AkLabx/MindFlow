import React from 'react';
import { Sparkles, Brain, Zap, BookOpen, Award, CheckCircle2 } from 'lucide-react';

export const AuthHeroShowcase: React.FC = () => {
  const pillars = [
    {
      icon: BookOpen,
      title: '10,000+ Exam PYQs & Topic Drills',
      desc: 'Sectional drills for SSC CGL, BPSC, Railways & State exams with instant solutions.'
    },
    {
      icon: Brain,
      title: 'Cognitive Mistake Notebook',
      desc: 'Automatically tracks your incorrect responses with spaced-repetition revision.'
    },
    {
      icon: Zap,
      title: '100% Offline-First Speed',
      desc: 'Instant IndexedDB local storage lets you practice full tests even without connectivity.'
    },
    {
      icon: Sparkles,
      title: 'Adaptive Remedial Coaching',
      desc: 'AI-guided diagnostic sprints identify learning gaps before actual exam day.'
    }
  ];

  return (
    <div className="relative flex flex-col justify-between w-full h-full p-8 lg:p-12 xl:p-16 overflow-hidden bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white rounded-3xl lg:rounded-r-none border-b lg:border-b-0 lg:border-r border-indigo-500/20 shadow-2xl">
      {/* Ambient background glow rings */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-purple-500/15 blur-3xl pointer-events-none" />

      {/* Top Header Badge */}
      <div className="relative z-10 space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold uppercase tracking-wider backdrop-blur-md">
          <Award className="w-4 h-4 text-amber-400" />
          <span>Next-Gen Aspirant Intelligence</span>
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl xl:text-4xl 2xl:text-5xl font-black tracking-tight leading-tight">
            Master Competitive Exams with{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300">
              Cognitive Precision.
            </span>
          </h1>
          <p className="text-slate-300 text-sm xl:text-base max-w-xl leading-relaxed">
            SSC CGL, BPSC, Railways & State PSCs. Practice with real exam timers, mistake remediation, and instant diagnostic feedback.
          </p>
        </div>
      </div>

      {/* Feature Pillars Grid */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-4 my-8 xl:my-10">
        {pillars.map((pillar, idx) => {
          const Icon = pillar.icon;
          return (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] hover:border-indigo-400/40 hover:bg-white/[0.07] transition-all backdrop-blur-sm group"
            >
              <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 mb-3 group-hover:scale-105 transition-transform">
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-100 mb-1">{pillar.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{pillar.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Bottom Proof Bar */}
      <div className="relative z-10 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Open Academic Platform</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Zero Intrusive Tracking</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>DPDP Act 2023 Compliant</span>
        </div>
      </div>
    </div>
  );
};
