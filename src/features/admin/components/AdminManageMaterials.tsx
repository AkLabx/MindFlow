import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    FileText,
    Search,
    Plus,
    UploadCloud,
    Edit2,
    Trash2,
    ExternalLink,
    Filter,
    CheckCircle2,
    Loader2,
    BookOpen,
    DownloadCloud
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/context/AuthContext';
import { AuthPolicy } from '@/lib/navigation/policies/AuthPolicy';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { AdminEditMaterialModal, StudyMaterial } from '@/features/admin/components/AdminEditMaterialModal';
import { deleteStudyMaterial } from '@/features/quiz/utils/adminMaterialUtils';
import { cn } from '@/utils/cn';

const CLASSES = ['Class VI', 'Class VII', 'Class VIII', 'Class IX', 'Class X', 'Class XI', 'Class XII'];
const TYPES = ['NCERT Textbook', 'Study Notes', 'MCQ Test', 'Chapter Test', 'Other Test', 'Answer Key'];

export const AdminManageMaterials: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { user, profile, roles, isAdmin } = useAuth();
    const hasAdminAccess = isAdmin || AuthPolicy.isAdmin(user, profile, roles);
    const { showToast } = useNotificationStore();

    const activeTab = searchParams.get('tab') === 'upload' ? 'upload' : 'manage';

    const [materials, setMaterials] = useState<StudyMaterial[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedClassFilter, setSelectedClassFilter] = useState('ALL');
    const [selectedTypeFilter, setSelectedTypeFilter] = useState('ALL');

    // Modals & Actions
    const [editingMaterial, setEditingMaterial] = useState<StudyMaterial | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // Upload Form State
    const [file, setFile] = useState<File | null>(null);
    const [uploadClass, setUploadClass] = useState<string>(CLASSES[3]);
    const [uploadType, setUploadType] = useState<string>(TYPES[1]);
    const [uploadSubject, setUploadSubject] = useState('');
    const [uploadChapter, setUploadChapter] = useState('');
    const [uploadTitle, setUploadTitle] = useState('');
    const [existingSubjects, setExistingSubjects] = useState<string[]>([]);
    const [existingChapters, setExistingChapters] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);

    // Security Gate
    useEffect(() => {
        if (!user || !hasAdminAccess) {
            navigate('/dashboard', { replace: true });
        }
    }, [user, hasAdminAccess, navigate]);

    useEffect(() => {
        if (hasAdminAccess) {
            fetchMaterials();
        }
    }, [hasAdminAccess]);

    const fetchMaterials = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('study_materials')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            const items = (data as StudyMaterial[]) || [];
            setMaterials(items);

            // Populate autocomplete sets
            const subjs = Array.from(new Set(items.map(d => d.subject).filter(Boolean))).sort();
            const chaps = Array.from(new Set(items.map(d => d.chapter).filter(Boolean))).sort();
            setExistingSubjects(subjs);
            setExistingChapters(chaps);
        } catch (error: any) {
            console.error('Error fetching materials:', error);
            showToast({ title: 'Error', message: 'Failed to load study materials.', variant: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (material: StudyMaterial) => {
        const confirmed = window.confirm(`Are you sure you want to delete "${material.title}"?\nThis will remove the record and the stored PDF file.`);
        if (!confirmed) return;

        setDeletingId(material.id);
        try {
            await deleteStudyMaterial(material.id, material.file_url);
            setMaterials(prev => prev.filter(m => m.id !== material.id));
            showToast({ title: 'Deleted', message: 'Material successfully deleted.', variant: 'success' });
        } catch (error: any) {
            showToast({ title: 'Error', message: error.message || 'Failed to delete material.', variant: 'error' });
        } finally {
            setDeletingId(null);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selected = e.target.files[0];
            if (selected.type !== 'application/pdf') {
                showToast({ title: 'Invalid File', message: 'Please select a valid PDF file.', variant: 'error' });
                return;
            }
            setFile(selected);
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !uploadSubject || !uploadChapter || !uploadTitle) {
            showToast({ title: 'Validation Error', message: 'Please fill all fields and select a PDF file.', variant: 'error' });
            return;
        }

        setIsUploading(true);

        try {
            const fileExt = file.name.split('.').pop() || 'pdf';
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `${uploadClass}/${uploadSubject.trim()}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('study_materials')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('study_materials')
                .getPublicUrl(filePath, { download: true });

            const { data: newDoc, error: dbError } = await supabase
                .from('study_materials')
                .insert({
                    class: uploadClass,
                    subject: uploadSubject.trim(),
                    chapter: uploadChapter.trim(),
                    type: uploadType,
                    title: uploadTitle.trim(),
                    file_url: publicUrl,
                    status: true
                })
                .select()
                .single();

            if (dbError) throw dbError;

            showToast({ title: 'Upload Successful', message: 'Material has been uploaded and indexed.', variant: 'success' });
            
            // Add to list and switch to manage tab
            if (newDoc) {
                setMaterials(prev => [newDoc as StudyMaterial, ...prev]);
            }
            setFile(null);
            setUploadTitle('');
            setSearchParams({});
        } catch (error: any) {
            console.error('Upload error:', error);
            showToast({ title: 'Upload Failed', message: error.message || 'An error occurred during upload.', variant: 'error' });
        } finally {
            setIsUploading(false);
        }
    };

    const filteredMaterials = materials.filter(m => {
        const matchesSearch =
            (m.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (m.subject || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (m.chapter || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (m.class || '').toLowerCase().includes(searchQuery.toLowerCase());

        const matchesClass = selectedClassFilter === 'ALL' || m.class === selectedClassFilter;
        const matchesType = selectedTypeFilter === 'ALL' || m.type === selectedTypeFilter;

        return matchesSearch && matchesClass && matchesType;
    });

    if (!user || !hasAdminAccess) return null;

    return (
        <div className="space-y-6 pb-12">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                        <FileText className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                        Study Materials Command Center
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Manage textbooks, chapter notes, answer keys, and uploaded PDF courseware.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setSearchParams(activeTab === 'manage' ? { tab: 'upload' } : {})}
                        className={cn(
                            'px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm',
                            activeTab === 'upload'
                                ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                                : 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-600/20'
                        )}
                    >
                        {activeTab === 'upload' ? (
                            <>
                                <BookOpen className="w-4 h-4" />
                                View Document Library
                            </>
                        ) : (
                            <>
                                <Plus className="w-4 h-4" />
                                Upload New Document
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                <button
                    onClick={() => setSearchParams({})}
                    className={cn(
                        'px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2',
                        activeTab === 'manage'
                            ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800/60'
                            : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                    )}
                >
                    <BookOpen className="w-4 h-4" />
                    Document Library ({materials.length})
                </button>
                <button
                    onClick={() => setSearchParams({ tab: 'upload' })}
                    className={cn(
                        'px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2',
                        activeTab === 'upload'
                            ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800/60'
                            : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                    )}
                >
                    <UploadCloud className="w-4 h-4" />
                    Direct PDF Uploader
                </button>
            </div>

            {activeTab === 'manage' ? (
                <div className="space-y-4">
                    {/* Filter & Search Bar */}
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center gap-3">
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search by title, subject, chapter, or class..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                            />
                        </div>

                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <select
                                value={selectedClassFilter}
                                onChange={(e) => setSelectedClassFilter(e.target.value)}
                                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 outline-none"
                            >
                                <option value="ALL">All Classes</option>
                                {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>

                            <select
                                value={selectedTypeFilter}
                                onChange={(e) => setSelectedTypeFilter(e.target.value)}
                                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 outline-none"
                            >
                                <option value="ALL">All Types</option>
                                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Table View */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        {isLoading ? (
                            <div className="py-20 flex flex-col items-center justify-center">
                                <Loader2 className="w-8 h-8 text-purple-600 animate-spin mb-3" />
                                <p className="text-sm text-slate-500 font-medium">Loading materials repository...</p>
                            </div>
                        ) : filteredMaterials.length === 0 ? (
                            <div className="py-20 text-center flex flex-col items-center justify-center">
                                <FileText className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
                                <p className="text-base font-bold text-slate-700 dark:text-slate-300">No materials found</p>
                                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                                    Try modifying your search or class filter, or upload a new study document.
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold uppercase tracking-wider">
                                        <tr>
                                            <th className="p-4">Title & Description</th>
                                            <th className="p-4">Class</th>
                                            <th className="p-4">Subject & Chapter</th>
                                            <th className="p-4">Category</th>
                                            <th className="p-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {filteredMaterials.map(material => (
                                            <tr key={material.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                                <td className="p-4">
                                                    <div className="font-bold text-slate-900 dark:text-white max-w-md line-clamp-1">
                                                        {material.title}
                                                    </div>
                                                    <span className="text-xs text-slate-400">
                                                        {material.created_at ? new Date(material.created_at).toLocaleDateString() : 'Recent'}
                                                    </span>
                                                </td>
                                                <td className="p-4 whitespace-nowrap">
                                                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300">
                                                        {material.class}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <div className="text-sm font-medium text-slate-800 dark:text-slate-200">{material.subject}</div>
                                                    <div className="text-xs text-slate-400 line-clamp-1">{material.chapter}</div>
                                                </td>
                                                <td className="p-4 whitespace-nowrap">
                                                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800/50">
                                                        {material.type}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-right whitespace-nowrap">
                                                    <div className="flex items-center justify-end gap-1">
                                                        {material.file_url && (
                                                            <a
                                                                href={material.file_url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="p-2 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                                                title="View / Download PDF"
                                                            >
                                                                <ExternalLink className="w-4 h-4" />
                                                            </a>
                                                        )}
                                                        <button
                                                            onClick={() => setEditingMaterial(material)}
                                                            className="p-2 rounded-lg text-slate-500 hover:text-purple-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                                            title="Edit Details"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(material)}
                                                            disabled={deletingId === material.id}
                                                            className="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                                                            title="Delete Material"
                                                        >
                                                            {deletingId === material.id ? (
                                                                <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                                                            ) : (
                                                                <Trash2 className="w-4 h-4" />
                                                            )}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                /* Upload Tab */
                <div className="max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-sm">
                    <div className="flex items-center gap-3 pb-6 border-b border-slate-200 dark:border-slate-800 mb-6">
                        <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-950/60 flex items-center justify-center text-purple-600">
                            <UploadCloud className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Upload New Course Material</h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400">PDFs will be stored in Supabase Storage and registered to the study catalog.</p>
                        </div>
                    </div>

                    <form onSubmit={handleUpload} className="space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Class</label>
                                <select
                                    value={uploadClass}
                                    onChange={(e) => setUploadClass(e.target.value)}
                                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                                >
                                    {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Material Category</label>
                                <select
                                    value={uploadType}
                                    onChange={(e) => setUploadType(e.target.value)}
                                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                                >
                                    {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Subject</label>
                                <input
                                    type="text"
                                    list="subjects-list"
                                    value={uploadSubject}
                                    onChange={(e) => setUploadSubject(e.target.value)}
                                    placeholder="e.g. Science, Mathematics"
                                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                                />
                                <datalist id="subjects-list">
                                    {existingSubjects.map(s => <option key={s} value={s} />)}
                                </datalist>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Chapter</label>
                                <input
                                    type="text"
                                    list="chapters-list"
                                    value={uploadChapter}
                                    onChange={(e) => setUploadChapter(e.target.value)}
                                    placeholder="e.g. Ch-1: Chemical Reactions"
                                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                                />
                                <datalist id="chapters-list">
                                    {existingChapters.map(c => <option key={c} value={c} />)}
                                </datalist>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Display Title</label>
                            <input
                                type="text"
                                value={uploadTitle}
                                onChange={(e) => setUploadTitle(e.target.value)}
                                placeholder="e.g. Class 10 Science Complete Chapter Notes"
                                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">PDF Document File</label>
                            <div className="relative border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-6 flex flex-col items-center justify-center bg-slate-50/60 dark:bg-slate-800/30 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer group">
                                <input
                                    id="file-upload"
                                    type="file"
                                    accept=".pdf"
                                    onChange={handleFileChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                />
                                {file ? (
                                    <div className="flex flex-col items-center text-center">
                                        <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
                                        <span className="text-sm font-bold text-slate-900 dark:text-white">{file.name}</span>
                                        <span className="text-xs text-slate-400 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB PDF</span>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center text-center">
                                        <UploadCloud className="w-8 h-8 text-purple-500 mb-2 group-hover:scale-110 transition-transform" />
                                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Select PDF document to upload</span>
                                        <span className="text-xs text-slate-400 mt-1">Drag and drop or click to browse</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                            <button
                                type="submit"
                                disabled={isUploading || !file}
                                className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-lg shadow-purple-600/25 transition-all flex items-center gap-2 disabled:opacity-50"
                            >
                                {isUploading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Uploading to Storage...
                                    </>
                                ) : (
                                    <>
                                        <UploadCloud className="w-4 h-4" />
                                        Upload & Index Material
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Edit Metadata Modal */}
            <AdminEditMaterialModal
                isOpen={!!editingMaterial}
                material={editingMaterial}
                onClose={() => setEditingMaterial(null)}
                onSuccess={(updated: any) => {
                    setMaterials(prev => prev.map(m => m.id === updated.id ? updated : m));
                }}
            />
        </div>
    );
};
