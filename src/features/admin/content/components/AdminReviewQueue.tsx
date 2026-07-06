import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CheckSquare, AlertCircle, RefreshCw, CheckCheck, XSquare } from 'lucide-react';
import { fetchPendingReviewQuestions, updateQuestionStatus, bulkUpdateQuestionStatus } from '../services/reviewAdminService';
import { AdminReviewCard } from './AdminReviewCard';
import { AdminEditExtractedModal } from './AdminEditExtractedModal';
import { useNotificationStore } from '@/stores/useNotificationStore';
import type { ExtractedQuestion } from '../types/review';
import { SynapticLoader } from '@/components/ui/SynapticLoader';

export const AdminReviewQueue: React.FC = () => {
    const showToast = useNotificationStore(s => s.showToast);

    const { data: questions, isLoading, error, refetch } = useQuery({
        queryKey: ['pending_questions'],
        queryFn: fetchPendingReviewQuestions
    });

    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [editingQuestion, setEditingQuestion] = useState<ExtractedQuestion | null>(null);
    const [isBulkProcessing, setIsBulkProcessing] = useState(false);
    const [bulkConfirmAction, setBulkConfirmAction] = useState<'APPROVED' | 'REJECTED' | null>(null);

    // Filter/Sort state could be added here later (e.g. by source_document_id)

    const handleSelect = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    const handleSelectAll = () => {
        if (!questions) return;
        if (selectedIds.size === questions.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(questions.map(q => q.id)));
        }
    };

    const handleSingleStatus = async (id: string, status: 'APPROVED' | 'REJECTED') => {
        try {
            await updateQuestionStatus(id, status);
            showToast({ title: 'Success', message: `Question ${status.toLowerCase()}`, variant: 'success' });
            refetch();
            setSelectedIds(prev => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        } catch (err: any) {
            showToast({ title: 'Error', message: err.message, variant: 'error' });
        }
    };

    const confirmBulkStatus = async (status: 'APPROVED' | 'REJECTED') => {
        if (selectedIds.size === 0) return;
        setIsBulkProcessing(true);
        try {
            await bulkUpdateQuestionStatus(Array.from(selectedIds), status);
            showToast({ title: 'Success', message: `${selectedIds.size} questions ${status.toLowerCase()}`, variant: 'success' });
            setSelectedIds(new Set());
            refetch();
        } catch (err: any) {
            showToast({ title: 'Error', message: err.message, variant: 'error' });
        } finally {
            setIsBulkProcessing(false);
            setBulkConfirmAction(null);
        }
    };

    if (isLoading) return <div className="py-20 flex justify-center"><SynapticLoader size="lg" /></div>;

    if (error) return (
        <div className="bg-red-50 text-red-600 p-6 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5" /> Failed to load review queue.
        </div>
    );

    if (!questions || questions.length === 0) return (
        <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckSquare className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">Queue Empty</h3>
            <p className="text-slate-500 max-w-sm mx-auto">No extracted questions pending review. Great job staying on top of the queue!</p>
            <button onClick={() => refetch()} className="mt-6 flex items-center gap-2 text-indigo-600 font-medium mx-auto hover:underline">
                <RefreshCw className="w-4 h-4" /> Check Again
            </button>
        </div>
    );

    return (
        <div className="space-y-6">

            {/* Action Bar */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 sticky top-16 z-20">
                <div className="flex items-center gap-3">
                    <input
                        type="checkbox"
                        checked={selectedIds.size === questions.length && questions.length > 0}
                        onChange={handleSelectAll}
                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 ml-1"
                    />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {selectedIds.size} selected of {questions.length}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    {bulkConfirmAction ? (
                        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-1 rounded-lg">
                            <span className="text-xs font-medium px-2 text-slate-600 dark:text-slate-300">Are you sure?</span>
                            <button
                                onClick={() => confirmBulkStatus(bulkConfirmAction)}
                                disabled={isBulkProcessing}
                                className={`px-3 py-1.5 rounded-md text-xs font-bold text-white transition-colors ${
                                    bulkConfirmAction === 'APPROVED' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-red-600 hover:bg-red-700'
                                }`}
                            >
                                Confirm {bulkConfirmAction === 'APPROVED' ? 'Approve' : 'Reject'}
                            </button>
                            <button
                                onClick={() => setBulkConfirmAction(null)}
                                className="px-3 py-1.5 rounded-md text-xs font-medium bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    ) : (
                        <>
                            <button
                                onClick={() => setBulkConfirmAction('REJECTED')}
                                disabled={selectedIds.size === 0 || isBulkProcessing}
                                className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-400 rounded-lg font-medium transition-colors disabled:opacity-50 text-sm"
                            >
                                <XSquare className="w-4 h-4" /> Bulk Reject
                            </button>
                            <button
                                onClick={() => setBulkConfirmAction('APPROVED')}
                                disabled={selectedIds.size === 0 || isBulkProcessing}
                                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 text-sm"
                            >
                                <CheckCheck className="w-4 h-4" /> Bulk Approve
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Queue Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {questions.map(q => (
                    <AdminReviewCard
                        key={q.id}
                        question={q}
                        isSelected={selectedIds.has(q.id)}
                        onSelect={handleSelect}
                        onApprove={() => handleSingleStatus(q.id, 'APPROVED')}
                        onReject={() => handleSingleStatus(q.id, 'REJECTED')}
                        onEdit={setEditingQuestion}
                    />
                ))}
            </div>

            <AdminEditExtractedModal
                isOpen={!!editingQuestion}
                onClose={() => setEditingQuestion(null)}
                question={editingQuestion}
                onSaved={() => {
                    refetch();
                    setEditingQuestion(null);
                }}
            />
        </div>
    );
};
