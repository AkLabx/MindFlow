import React from 'react';
import { Info } from 'lucide-react';
import { formatIndianNumber } from '../../utils/format';

interface HonestLabelingBannerProps {
  sampleSize: number;
  className?: string;
  examName?: string;
}

/**
 * Transparent sample size ($N$) disclosure and rank estimation banner.
 * Strict compliance with MindFlow Constitution Section 2.5 (Honest Labeling).
 */
export const HonestLabelingBanner: React.FC<HonestLabelingBannerProps> = ({
  sampleSize,
  className = '',
  examName,
}) => {
  return (
    <div
      role="note"
      aria-label="Sample size and estimate disclosure"
      className={`flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs leading-relaxed ${className}`}
    >
      <Info className="w-4 h-4 mt-0.5 shrink-0 text-amber-500" aria-hidden="true" />
      <div>
        <span className="font-semibold text-amber-800 dark:text-amber-200">
          Rank & Percentile Estimates (N = {formatIndianNumber(sampleSize)} Submissions)
        </span>
        <p className="mt-0.5 text-amber-700/90 dark:text-amber-300/90">
          Ranks and normalisation percentiles are calculated exclusively among verified MindFlow submissions
          {examName ? ` for ${examName}` : ''}. Official ranks will be declared by the commission upon official result publication.
        </p>
      </div>
    </div>
  );
};
