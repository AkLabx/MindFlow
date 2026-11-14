import React, { useEffect, useId, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronDown } from 'lucide-react';
import { SynapticLoader } from '@/components/ui/SynapticLoader';
import { AnchoredPopover } from '@/components/ui/AnchoredPopover';

import { useEnrichmentMetrics } from '../hooks/useEnrichmentMetrics';
import { PipelineHeroCard } from '../components/PipelineHeroCard';
import { ActionPanel } from '../components/ActionPanel';
import { QualityMetrics } from '../components/QualityMetrics';
import { QueueIntelligence } from '../components/QueueIntelligence';
import { ProgressMatrix } from '../components/ProgressMatrix';
import { TokenEconomicsPanel } from '../components/TokenEconomicsPanel';
import { PhaseLatencyChart } from '../components/PhaseLatencyChart';
import { TaskTuningPanel } from '../components/TaskTuningPanel';
import { DLQInspector } from '../components/DLQInspector';
import { useQuery } from '@tanstack/react-query';
import { retryDlqJob, archiveDlqJob, archiveAllDlq } from '../services/enrichmentAdminService';
import { fetchPipelineDlq } from '../services/pipelineMetricsService';
import { usePipelineStore } from '../stores/usePipelineStore';
import { PIPELINE_REGISTRY, PipelineType } from '../constants/pipelineRegistry';

export const AdminEnrichmentControlCenter: React.FC = () => {
    const navigate = useNavigate();
    const { selectedPipeline, setSelectedPipeline } = usePipelineStore();
    const config = PIPELINE_REGISTRY[selectedPipeline];

    const { data: metrics, isLoading: isMetricsLoading, isError: isMetricsError } = useEnrichmentMetrics();

    const { data: dlq, refetch: refetchDlq } = useQuery({
        queryKey: ['enrichment_dlq', selectedPipeline],
        queryFn: () => fetchPipelineDlq(selectedPipeline),
        refetchInterval: 30000,
    });

    const [isMobile, setIsMobile] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const rawId = useId();
    const sanitizedId = rawId.replace(/[^a-zA-Z0-9_-]/g, '');
    const anchorName = `--pipeline-menu-${sanitizedId}`;
    const menuId = `pipeline-menu-${sanitizedId}`;

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    if (isMetricsLoading && !metrics) {
        return (
            <div className="h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
                <SynapticLoader size="xl" />
            </div>
        );
    }

    if (isMetricsError || !metrics) {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 text-center">
                <div className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-6 rounded-2xl max-w-md">
                    <h2 className="text-xl font-bold mb-2">Metrics Unavailable</h2>
                    <p className="text-sm">Could not connect to the Enrichment Control Center adapter for {config.label}.</p>
                    <button onClick={() => navigate('/admin')} className="mt-6 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium">Return to Admin Home</button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-12">
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-col">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">AI Operations & Pipelines</span>
                    <div className="relative mt-1">
                        <button
                            ref={triggerRef}
                            type="button"
                            aria-haspopup="menu"
                            aria-expanded={isDropdownOpen}
                            aria-controls={menuId}
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            style={{ anchorName } as React.CSSProperties}
                            className="flex items-center gap-2 min-h-[44px] text-2xl font-extrabold text-slate-900 dark:text-slate-100 font-display hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                        >
                            {config.label}
                            <ChevronDown className="w-5 h-5 text-indigo-500" />
                        </button>
                        <AnchoredPopover
                            id={menuId}
                            isOpen={isDropdownOpen}
                            onClose={() => setIsDropdownOpen(false)}
                            triggerRef={triggerRef}
                            anchorName={anchorName}
                            matchAnchorWidth={false}
                            positionArea="block-end span-inline-end"
                            className="w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden"
                        >
                            <div
                                role="menu"
                                aria-label="Select AI Pipeline"
                                onKeyDown={(e) => {
                                    const items = Array.from(
                                        e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="menuitem"]')
                                    );
                                    const idx = items.indexOf(document.activeElement as HTMLButtonElement);
                                    if (e.key === 'ArrowDown') {
                                        e.preventDefault();
                                        items[(idx + 1 + items.length) % items.length]?.focus();
                                    } else if (e.key === 'ArrowUp') {
                                        e.preventDefault();
                                        items[(idx - 1 + items.length) % items.length]?.focus();
                                    }
                                }}
                            >
                                {(Object.keys(PIPELINE_REGISTRY) as PipelineType[]).map((pKey) => (
                                    <button
                                        key={pKey}
                                        type="button"
                                        role="menuitem"
                                        onClick={() => { setSelectedPipeline(pKey); setIsDropdownOpen(false); }}
                                        className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors ${selectedPipeline === pKey ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
                                    >
                                        {PIPELINE_REGISTRY[pKey].label}
                                    </button>
                                ))}
                            </div>
                        </AnchoredPopover>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>DLQ Polling (30s)</span>
                </div>
            </header>

            <div className="space-y-6">
                {config.supportedWidgets.includes('HeroCard') && <PipelineHeroCard metrics={metrics} pipelineConfig={config} />}
                {config.supportedWidgets.includes('ActionPanel') && <ActionPanel isPipelineActive={Boolean(metrics?.hero?.is_active)} isMobile={isMobile} />}
                {config.supportedWidgets.includes('QualityMetrics') && <QualityMetrics metrics={metrics} />}
                {config.supportedWidgets.includes('QueueIntelligence') && <QueueIntelligence metrics={metrics} pipelineConfig={config} />}
                {config.supportedWidgets.includes('PhaseLatency') && <PhaseLatencyChart metrics={metrics} />}
                {config.supportedWidgets.includes('ProgressMatrix') && <ProgressMatrix metrics={metrics} pipelineConfig={config} />}
                {config.supportedWidgets.includes('TokenEconomics') && <TokenEconomicsPanel metrics={metrics} />}
                {config.supportedWidgets.includes('TaskTuning') && <TaskTuningPanel />}
                {config.supportedWidgets.includes('DLQInspector') && (
                    <DLQInspector
                        dlqJobs={dlq || []}
                        onRetry={async (id) => { await retryDlqJob(id); refetchDlq(); }}
                        onArchive={async (id) => { await archiveDlqJob(id); refetchDlq(); }}
                        onArchiveAll={async () => { const count = await archiveAllDlq(); refetchDlq(); return count; }}
                        isMobile={isMobile}
                        pipelineConfig={config}
                    />
                )}
            </div>
        </div>
    );
};
