import React from 'react';
import type { ResultDashboardData } from '../../types';
import { CohortComparisonBar } from '../visuals/CohortComparisonBar';
import { SectionHeader } from '../common/SectionHeader';

interface SubjectWiseComparisonSectionProps {
  sections: ResultDashboardData['section_results'];
}

export const SubjectWiseComparisonSection: React.FC<SubjectWiseComparisonSectionProps> = ({
  sections,
}) => {
  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-card-dark border border-slate-200/80 dark:border-white/10 shadow-sm space-y-4">
      <SectionHeader
        title="Subject Wise Comparison with Serious Cohort"
        subtitle="Benchmark against competitors scoring ≥ 100 overall marks (the competitive qualifying zone)"
        badge="Serious Cohort (≥ 100 Marks)"
        badgeColor="indigo"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {sections.map((sec) => (
          <CohortComparisonBar
            key={sec.section_id}
            label={sec.name}
            candidateMarks={sec.marks}
            cohortAvgMarks={sec.serious_cohort_avg_marks}
            maxMarks={50}
            candidateAccuracy={sec.accuracy}
            cohortAccuracy={sec.serious_cohort_avg_accuracy}
            delta={sec.serious_cohort_delta}
          />
        ))}
      </div>
    </div>
  );
};
