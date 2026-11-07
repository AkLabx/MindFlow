import React from 'react';
import { RotateCcw } from 'lucide-react';
import { useHistogramSlider } from '../../hooks/useHistogramSlider';
import { HistogramSlider } from '../visuals/HistogramSlider';
import { MetricTile } from '../common/MetricTile';
import { SectionHeader } from '../common/SectionHeader';
import { formatIndianNumber, formatMarks } from '../../utils/format';

interface MarksDistributionSectionProps {
  examId: string;
  candidateMark: number;
  initialCategory?: string;
}

const CATEGORIES = ['all', 'UR', 'OBC', 'EWS', 'SC', 'ST'];

export const MarksDistributionSection: React.FC<MarksDistributionSectionProps> = ({
  examId,
  candidateMark,
  initialCategory = 'all',
}) => {
  const {
    selectedMark,
    selectedCategory,
    setSelectedCategory,
    bins,
    metrics,
    resetToCandidateMarks,
    handleSliderChange,
    handleKeyDown,
  } = useHistogramSlider({
    examId,
    candidateMark,
    initialScopeKey: initialCategory,
  });

  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-card-dark border border-slate-200/80 dark:border-white/10 shadow-sm space-y-4">
      <SectionHeader
        title="Candidates On Each Mark"
        subtitle="Distribution histogram and candidate density scrubber"
        badge="Interactive Scrubber"
        badgeColor="indigo"
        action={
          <button
            onClick={resetToCandidateMarks}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-all border border-indigo-200/60 dark:border-indigo-500/20"
            title="Reset scrubber to your raw marks"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Go to My Marks</span>
          </button>
        }
      />

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 ${
              selectedCategory === cat
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'
            }`}
          >
            {cat.toUpperCase()}
          </button>
        ))}
      </div>

      {/* SVG Histogram & Scrubber */}
      <HistogramSlider
        bins={bins}
        selectedMark={selectedMark}
        candidateMark={candidateMark}
        onSliderChange={handleSliderChange}
        onKeyDown={handleKeyDown}
      />

      {/* 3 Dynamic Counter Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
        <MetricTile
          label={`Candidates At ${formatMarks(selectedMark)} Marks`}
          value={formatIndianNumber(metrics.binCount)}
          subtitle="Exact half-mark bin"
          accentColor="brand"
        />

        <MetricTile
          label={`Candidates At Or Above (≥ ${formatMarks(selectedMark)})`}
          value={formatIndianNumber(metrics.atOrAboveCount)}
          subtitle={`Top ${metrics.topPct}% of all candidates`}
          accentColor="emerald"
        />

        <MetricTile
          label={`Candidates Below (< ${formatMarks(selectedMark)})`}
          value={formatIndianNumber(metrics.belowCount)}
          subtitle="Lower scoring candidates"
          accentColor="amber"
        />
      </div>
    </div>
  );
};
