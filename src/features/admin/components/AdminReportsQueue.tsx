import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShieldAlert, CheckCircle2, ShieldQuestion, Clock, MessageSquare, Save, X, ExternalLink, Trash2, Undo, Filter } from 'lucide-react';
import { useAuth } from '../../auth/context/AuthContext';
import { AuthPolicy } from '@/lib/navigation/policies/AuthPolicy';
import { fetchAllReports, updateReportStatus, deleteContentByAdmin, restoreContentByAdmin } from '../../community/api/reportsApi';
import { cn } from '../../../utils/cn';
import { useNotification } from '../../../hooks/useNotification';

type ReportStatus = 'pending' | 'being_reviewed' | 'resolved' | 'ignored';

export const AdminReportsQueue: React.FC = () => {
    const navigate = useNavigate();
    const { user, profile, roles, isAdmin } = useAuth();
    const hasAdminAccess = isAdmin || AuthPolicy.isAdmin(user, profile, roles);
    const queryClient = useQueryClient();
    const { showToast } = useNotification();

    const [selectedReport, setSelectedReport] = useState<any | null>(null);
    const [editingStatus, setEditingStatus] = useState<ReportStatus>('pending');
    const [adminNote, setAdminNote] = useState('');
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [selectedTab, setSelectedTab] = useState<'all' | ReportStatus>('all');

    const handleDeleteContent = async () => {
        if (!selectedReport || selectedReport.target_type === 'user') return;
        setIsActionLoading(true);
        try {
            await deleteContentByAdmin(selectedReport.target_id, selectedReport.target_type as 'post' | 'reel');
            showToast({ title: 'Content Deleted', message: 'Content has been permanently deleted.', variant: 'success' });
            queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
            setSelectedReport(null);
        } catch (err) {
            showToast({ title: 'Error', message: 'Failed to delete content', variant: 'error' });
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleRestoreContent = async () => {
        if (!selectedReport || selectedReport.target_type === 'user') return;
        setIsActionLoading(true);
        try {
            await restoreContentByAdmin(selectedReport.target_id, selectedReport.target_type as 'post' | 'reel');
            await updateReportStatus(selectedReport.id, 'resolved', 'Content restored and verified by admin.');
            showToast({ title: 'Content Restored', message: 'Content is visible again.', variant: 'success' });
            queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
            setSelectedReport(null);
        } catch (err) {
            showToast({ title: 'Error', message: 'Failed to restore content', variant: 'error' });
        } finally {
            setIsActionLoading(false);
        }
    };

    // Strict Guard
    useEffect(() => {
        if (!user || !hasAdminAccess) {
            navigate('/dashboard', { replace: true });
        }
    }, [user, navigate]);

    const { data: reports, isLoading } = useQuery({
        queryKey: ['admin-reports'],
        queryFn: fetchAllReports,
        enabled: Boolean(user && hasAdminAccess),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, status, conclusion }: { id: string, status: ReportStatus, conclusion: string }) =>
            updateReportStatus(id, status, conclusion),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
            showToast({ title: 'Report Updated', message: 'Status and conclusion saved.', variant: 'success' });
            setSelectedReport(null);
        },
        onError: () => {
            showToast({ title: 'Error', message: 'Failed to update report.', variant: 'error' });
        }
    });

    if (!user || !hasAdminAccess) return null;

    const handleOpenReport = (report: any) => {
        setSelectedReport(report);
        setEditingStatus(report.status);
        setAdminNote(report.admin_conclusion || '');
    };

    const handleSave = () => {
        if (!selectedReport) return;
        updateMutation.mutate({
            id: selectedReport.id,
            status: editingStatus,
            conclusion: adminNote
        });
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900/50';
            case 'being_reviewed': return 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200 dark:border-blue-900/50';
            case 'resolved': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50';
            case 'ignored': return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700';
            default: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        }
    };

    const filteredReports = reports?.filter(r => selectedTab === 'all' || r.status === selectedTab) || [];

    return (
        <div className="space-y-6 pb-12">
            {/* Page Header & Metrics */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                        <ShieldAlert className="w-6 h-6 text-red-500" />
                        Governance & Moderation Queue
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Review, moderate, and resolve flags on user-generated posts, reels, and profiles.
                    </p>
                </div>
                {reports && (
                    <div className="flex items-center gap-2">
                        <span className="px-3 py-1.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            {reports.filter(r => r.status === 'pending').length} Pending
                        </span>
                        <span className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300">
                            {reports.length} Total Reports
                        </span>
                    </div>
                )}
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {(['all', 'pending', 'being_reviewed', 'resolved', 'ignored'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setSelectedTab(tab)}
                        className={cn(
                            'px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all border whitespace-nowrap',
                            selectedTab === tab
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20'
                                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                        )}
                    >
                        {tab.replace('_', ' ')}
                        {reports && (
                            <span className={cn(
                                'ml-2 px-1.5 py-0.5 rounded-md text-[10px]',
                                selectedTab === tab ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                            )}>
                                {tab === 'all' ? reports.length : reports.filter(r => r.status === tab).length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            <div>
                {isLoading ? (
                    <div className="space-y-4">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="animate-pulse bg-white dark:bg-slate-900 rounded-3xl p-6 h-24 border border-slate-200 dark:border-slate-800" />
                        ))}
                    </div>
                ) : (
                    <div className="overflow-x-auto bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                                <tr>
                                    <th className="p-4 font-medium">Date</th>
                                    <th className="p-4 font-medium">Reporter</th>
                                    <th className="p-4 font-medium">Target</th>
                                    <th className="p-4 font-medium">Reason</th>
                                    <th className="p-4 font-medium">Status</th>
                                    <th className="p-4 font-medium text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                {filteredReports.map((report) => (
                                    <tr key={report.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="p-4 whitespace-nowrap text-slate-600 dark:text-slate-300">
                                            {new Date(report.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="p-4 font-medium text-slate-900 dark:text-slate-100">
                                            {report.reporter?.full_name || report.reporter?.username || 'Unknown'}
                                        </td>
                                        <td className="p-4 font-medium text-slate-900 dark:text-slate-100">
                                            {report.evidence_data?.full_name || report.evidence_data?.username || 'Unknown'}
                                        </td>
                                        <td className="p-4 text-red-600 dark:text-red-400 font-medium">
                                            {report.reason}
                                        </td>
                                        <td className="p-4">
                                            <span className={cn("px-2.5 py-1 rounded-full text-xs font-bold border", getStatusStyle(report.status))}>
                                                {report.status.replace('_', ' ').toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <button
                                                onClick={() => handleOpenReport(report)}
                                                className="px-4 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-xs"
                                            >
                                                Review
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {filteredReports.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-slate-500">
                                            No reports found. The community is safe!
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Review Modal */}
            <AnimatePresence>
                {selectedReport && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedReport(null)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            {/* Modal Header */}
                            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                                <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                                    <ShieldQuestion className="w-5 h-5 text-indigo-500" /> Review Report
                                </h3>
                                <button onClick={() => setSelectedReport(null)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="p-6 overflow-y-auto space-y-6">
                                {/* Details Grid */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                                        <p className="text-xs font-bold text-slate-500 mb-1 uppercase">Reporter</p>
                                        <p className="font-medium text-slate-900 dark:text-white">{selectedReport.reporter?.full_name}</p>
                                        <p className="text-sm text-slate-500">@{selectedReport.reporter?.username}</p>
                                    </div>
                                    <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/20">
                                        <p className="text-xs font-bold text-red-500 mb-1 uppercase">Reason</p>
                                        <p className="font-bold text-red-700 dark:text-red-400">{selectedReport.reason}</p>
                                        {selectedReport.custom_note && (
                                            <p className="text-sm text-red-600/80 dark:text-red-400/80 mt-2 italic border-t border-red-200 dark:border-red-900/30 pt-2">
                                                "{selectedReport.custom_note}"
                                            </p>
                                        )}
                                    </div>
                                </div>


                                {/* Evidence Snapshot */}
                                <div>
                                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
                                        Snapshot Evidence ({selectedReport.target_type === 'user' ? 'Target Profile' : 'Reported Content'})
                                    </h4>

                                    {selectedReport.target_type === 'user' ? (
                                        <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center gap-4">
                                            {selectedReport.evidence_data?.avatar_url ? (
                                                <img src={selectedReport.evidence_data.avatar_url} alt="Avatar" className="w-16 h-16 rounded-full object-cover" />
                                            ) : (
                                                <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-400 font-bold text-xl">
                                                    {selectedReport.evidence_data?.full_name?.[0] || '?'}
                                                </div>
                                            )}
                                            <div>
                                                <p className="font-bold text-slate-900 dark:text-white text-lg">{selectedReport.evidence_data?.full_name}</p>
                                                <p className="text-sm text-slate-500">@{selectedReport.evidence_data?.username}</p>
                                                {selectedReport.evidence_data?.bio && (
                                                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                                                        "{selectedReport.evidence_data.bio}"
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                                            <div className="flex items-center gap-2 mb-3 text-sm text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-700 pb-2">
                                                Author: {selectedReport.evidence_data?.author_name || 'Unknown'} (ID: {selectedReport.evidence_data?.author_id})
                                            </div>

                                            {selectedReport.evidence_data?.content && (
                                                <p className="text-slate-800 dark:text-slate-200 mb-4 whitespace-pre-wrap">
                                                    {selectedReport.evidence_data.content}
                                                </p>
                                            )}
                                            {selectedReport.evidence_data?.caption && (
                                                <p className="text-slate-800 dark:text-slate-200 mb-4 font-medium">
                                                    Caption: {selectedReport.evidence_data.caption}
                                                </p>
                                            )}

                                            {selectedReport.evidence_data?.media_url && (
                                                <img src={selectedReport.evidence_data.media_url} alt="Evidence Media" className="w-full max-h-64 object-cover rounded-xl" />
                                            )}
                                            {selectedReport.evidence_data?.video_url && (
                                                <video src={selectedReport.evidence_data.video_url} controls className="w-full max-h-64 rounded-xl bg-black" />
                                            )}
                                        </div>
                                    )}
                                </div>


                                {/* Admin Action Area */}
                                <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                                    <div className="flex justify-between items-center mb-2">

        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Admin Actions</h4>
                                        {selectedReport.target_type !== 'user' && (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={handleRestoreContent}
                                                    disabled={isActionLoading}
                                                    className="px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 rounded-lg flex items-center gap-1 transition-colors disabled:opacity-50"
                                                >
                                                    <Undo className="w-3.5 h-3.5" /> Restore
                                                </button>
                                                <button
                                                    onClick={handleDeleteContent}
                                                    disabled={isActionLoading}
                                                    className="px-3 py-1.5 text-xs font-bold text-red-700 bg-red-100 hover:bg-red-200 rounded-lg flex items-center gap-1 transition-colors disabled:opacity-50"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" /> Delete Content
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-2">
                                        {['pending', 'being_reviewed', 'resolved', 'ignored'].map((status) => (
                                            <button
                                                key={status}
                                                onClick={() => setEditingStatus(status as ReportStatus)}
                                                className={cn(
                                                    "px-4 py-2 rounded-xl text-sm font-bold border transition-colors flex-1 capitalize",
                                                    editingStatus === status
                                                        ? "bg-slate-800 text-white border-slate-800 dark:bg-white dark:text-slate-900 dark:border-white"
                                                        : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50"
                                                )}
                                            >
                                                {status.replace('_', ' ')}
                                            </button>
                                        ))}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                            Admin Conclusion Message (Visible to Reporter)
                                        </label>
                                        <textarea
                                            value={adminNote}
                                            onChange={(e) => setAdminNote(e.target.value)}
                                            placeholder="Write a message to the user who reported this..."
                                            className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 resize-none h-24 text-sm dark:text-white"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3">
                                <button
                                    onClick={() => setSelectedReport(null)}
                                    className="px-5 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={updateMutation.isPending || isActionLoading}
                                    className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-lg shadow-indigo-600/20 flex items-center gap-2 disabled:opacity-50"
                                >
                                    <Save className="w-4 h-4" /> Save Actions
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
