import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, FileText, ChevronRight, CheckCircle2, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useNotificationStore } from '../../stores/useNotificationStore';
import { cn } from '../../utils/cn';

type MaterialType = 'NCERT Textbook' | 'Study Notes' | 'MCQ Test' | 'Chapter Test' | 'Other Test' | 'Answer Key';

interface StudyMaterial {
    parts?: string | null;
    id: string;
    class: string;
    subject: string;
    chapter: string;
    type: MaterialType;
    title: string;
    file_url: string;
    status: boolean;
}

export const SchoolDownloads: React.FC = () => {
    const navigate = useNavigate();

    const [materials, setMaterials] = useState<StudyMaterial[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { showToast } = useNotificationStore();
    const [downloadStatus, setDownloadStatus] = useState<Record<string, 'loading' | 'success' | null>>({});

    const [selectedClass, setSelectedClass] = useState<string | null>(null);
    const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
    const [selectedChapter, setSelectedChapter] = useState<string | null>(null);
    const [selectedType, setSelectedType] = useState<MaterialType | null>(null);

    // Derived unique options based on current selections
    const classes = Array.from(new Set(materials.map(m => m.class))).sort();

    const availableSubjects = selectedClass
        ? Array.from(new Set(materials.filter(m => m.class === selectedClass).map(m => m.subject))).sort()
        : [];

    const availableChapters = selectedSubject
        ? Array.from(new Set(materials.filter(m => m.class === selectedClass && m.subject === selectedSubject).map(m => m.chapter))).sort()
        : [];

    const availableTypes = selectedChapter
        ? Array.from(new Set(materials.filter(m => m.class === selectedClass && m.subject === selectedSubject && m.chapter === selectedChapter).map(m => m.type))).sort()
        : [];

    const filteredMaterials = materials.filter(m =>
        m.class === selectedClass &&
        m.subject === selectedSubject &&
        m.chapter === selectedChapter &&
        m.type === selectedType
    );

    useEffect(() => {
        const fetchMaterials = async () => {
            setIsLoading(true);
            try {
                const { data, error } = await supabase
                    .from('study_materials')
                    .select('*')
                    .eq('status', true);

                if (error) throw error;
                setMaterials((data as StudyMaterial[]) || []);
            } catch (error) {
                console.error("Error fetching materials:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchMaterials();
    }, []);

    const handleDownload = async (id: string, url: string, suggestedName: string) => {
        setDownloadStatus(prev => ({ ...prev, [id]: 'loading' }));
        showToast({ title: "Downloading...", message: "Your file is being prepared.", variant: "info" });

        try {
            // Attempt 1: Direct Fetch (Works perfectly for Supabase Storage URLs since CORS is configured)

            // Ensure Supabase urls have download parameter to enforce Content-Disposition: attachment
            const downloadUrl = url.includes('supabase.co') && !url.includes('download=')
                ? `${url}?download=`
                : url;
            const directResponse = await fetch(downloadUrl);

            if (directResponse.ok) {
                const blob = await directResponse.blob();
                const blobUrl = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = blobUrl;
                a.download = suggestedName;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(blobUrl);
                setDownloadStatus(prev => ({ ...prev, [id]: 'success' }));
                showToast({ title: "Success", message: "File downloaded successfully!", variant: "success" });
                return;
            } else {
                throw new Error(`Direct fetch failed: ${directResponse.status}`);
            }
        } catch (directError) {
            console.warn("Direct fetch failed, falling back to proxies...", directError);

            try {
                // Attempt 2: Supabase Edge Function Proxy (For Archive.org legacy links)
                const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/proxy-download`;
                const proxyResponse = await fetch(functionUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
                    },
                    body: JSON.stringify({ url, filename: suggestedName })
                });

                if (!proxyResponse.ok) throw new Error(`Proxy failed with status ${proxyResponse.status}`);

                const blob = await proxyResponse.blob();
                const blobUrl = URL.createObjectURL(blob);

                const a = document.createElement('a');
                a.href = blobUrl;
                a.download = suggestedName;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(blobUrl);
                setDownloadStatus(prev => ({ ...prev, [id]: 'success' }));
                showToast({ title: "Success", message: "File downloaded successfully!", variant: "success" });
                return;

            } catch (error) {
                console.warn("Attempt 2 (Edge Function) failed:", error);

                try {
                    // Attempt 3: Free CORS Proxy
                    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
                    const response = await fetch(proxyUrl);

                    if (!response.ok) throw new Error(`CORS proxy failed with status ${response.status}`);

                    const blob = await response.blob();
                    const blobUrl = URL.createObjectURL(blob);

                    const a = document.createElement('a');
                    a.href = blobUrl;
                    a.download = suggestedName;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(blobUrl);
                    setDownloadStatus(prev => ({ ...prev, [id]: 'success' }));
                    showToast({ title: "Success", message: "File downloaded successfully!", variant: "success" });
                    return;

                } catch (proxyError) {
                    console.warn("Attempt 3 (CORS Proxy) failed:", proxyError);

                    // Attempt 4: Ultimate Fallback - Window Open / Anchor Tag
                    const link = document.createElement("a");
                    link.href = url;
                    link.download = suggestedName;
                    link.target = "_blank";
                    link.rel = "noopener noreferrer";
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);

                    setDownloadStatus(prev => ({ ...prev, [id]: 'success' })); // Assume success if browser handles it
                }
            }
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.05 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <div className="min-h-screen pt-4 pb-24 px-4 w-full flex flex-col relative overflow-hidden bg-slate-50 dark:bg-slate-950">
            {/* Header */}
            <header className="flex items-center justify-between mb-6 relative z-10">
                <button
                    onClick={() => navigate('/school')}
                    className="p-2 -ml-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 transition-colors rounded-full hover:bg-slate-200 dark:hover:bg-slate-800"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-cyan-400 dark:to-blue-400">
                    Downloads
                </h1>
                <div className="w-10"></div> {/* Spacer for balance */}
            </header>

            {isLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center">
                    <Loader2 className="w-10 h-10 text-cyan-500 animate-spin mb-4" />
                    <p className="text-slate-500 font-medium">Loading materials...</p>
                </div>
            ) : materials.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                        <FileText className="w-10 h-10 text-slate-400" />
                    </div>
                    <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300">No Materials Yet</h2>
                    <p className="text-slate-500 mt-2">Check back later for new study resources.</p>
                </div>
            ) : (
                <div className="flex-1 flex flex-col space-y-6 relative z-10 max-w-3xl mx-auto w-full">

                    {/* Class Filter */}
                    <div className="space-y-2">
                        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider pl-1">Select Class</h2>
                        <div className="flex flex-wrap gap-2">
                            {classes.map(cls => (
                                <button
                                    key={cls}
                                    onClick={() => {
                                        setSelectedClass(cls);
                                        setSelectedSubject(null);
                                        setSelectedChapter(null);
                                        setSelectedType(null);
                                    }}
                                    className={cn(
                                        "px-4 py-2 rounded-full text-sm font-medium transition-all shadow-sm border",
                                        selectedClass === cls
                                            ? "bg-cyan-500 text-white border-cyan-500 shadow-cyan-500/20"
                                            : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-cyan-300 dark:hover:border-cyan-700"
                                    )}
                                >
                                    {cls}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Subject Filter */}
                    <AnimatePresence>
                        {selectedClass && availableSubjects.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="space-y-2 overflow-hidden"
                            >
                                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider pl-1 flex items-center gap-2">
                                    <ChevronRight className="w-4 h-4" /> Select Subject
                                </h2>
                                <div className="flex flex-wrap gap-2 pl-4 border-l-2 border-slate-200 dark:border-slate-800">
                                    {availableSubjects.map(sub => (
                                        <button
                                            key={sub}
                                            onClick={() => {
                                                setSelectedSubject(sub);
                                                setSelectedChapter(null);
                                                setSelectedType(null);
                                            }}
                                            className={cn(
                                                "px-4 py-2 rounded-full text-sm font-medium transition-all shadow-sm border",
                                                selectedSubject === sub
                                                    ? "bg-blue-500 text-white border-blue-500 shadow-blue-500/20"
                                                    : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700"
                                            )}
                                        >
                                            {sub}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Chapter Filter */}
                    <AnimatePresence>
                        {selectedSubject && availableChapters.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="space-y-2 overflow-hidden"
                            >
                                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider pl-1 flex items-center gap-2">
                                    <ChevronRight className="w-4 h-4 ml-4" /> Select Chapter
                                </h2>
                                <div className="flex flex-wrap gap-2 pl-8 border-l-2 border-slate-200 dark:border-slate-800 ml-4">
                                    {availableChapters.map(chap => (
                                        <button
                                            key={chap}
                                            onClick={() => {
                                                setSelectedChapter(chap);
                                                setSelectedType(null);
                                            }}
                                            className={cn(
                                                "px-4 py-2 rounded-full text-sm font-medium transition-all shadow-sm border",
                                                selectedChapter === chap
                                                    ? "bg-indigo-500 text-white border-indigo-500 shadow-indigo-500/20"
                                                    : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700"
                                            )}
                                        >
                                            {chap}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Material Type Filter */}
                    <AnimatePresence>
                        {selectedChapter && availableTypes.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="space-y-2 overflow-hidden"
                            >
                                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider pl-1 flex items-center gap-2">
                                    <ChevronRight className="w-4 h-4 ml-8" /> Material Type
                                </h2>
                                <div className="flex flex-wrap gap-2 pl-12 border-l-2 border-slate-200 dark:border-slate-800 ml-8">
                                    {availableTypes.map(type => (
                                        <button
                                            key={type}
                                            onClick={() => setSelectedType(type as MaterialType)}
                                            className={cn(
                                                "px-4 py-2 rounded-full text-sm font-medium transition-all shadow-sm border",
                                                selectedType === type
                                                    ? "bg-purple-500 text-white border-purple-500 shadow-purple-500/20"
                                                    : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-700"
                                            )}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Results List */}
                    <AnimatePresence>
                        {selectedType && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="pt-6 mt-4 border-t border-slate-200 dark:border-slate-800"
                            >
                                <h3 className="text-lg font-bold mb-4 text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                                    Available Files
                                </h3>

                                <motion.div
                                    variants={containerVariants}
                                    initial="hidden"
                                    animate="show"
                                    className="grid gap-3"
                                >
                                    {filteredMaterials.map(material => (
                                        <motion.div
                                            key={material.id}
                                            variants={itemVariants}
                                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm flex items-center justify-between gap-4"
                                        >
                                            <div className="flex items-start gap-3 overflow-hidden">
                                                <div className="mt-1 bg-cyan-100 dark:bg-cyan-900/30 p-2 rounded-lg shrink-0">
                                                    <FileText className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">{material.title}</h4>
                                                    <p className="text-xs text-slate-500 mt-0.5">{material.class} • {material.subject} • {material.type}{material.parts ? ` • Part ${material.parts}` : ""}</p>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => handleDownload(material.id, material.file_url, `${material.title}.pdf`)}
                                                disabled={downloadStatus[material.id] === 'loading'}
                                                className={cn(
                                                    "shrink-0 p-2 rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2 px-4 font-medium text-sm disabled:opacity-80 disabled:active:scale-100",
                                                    downloadStatus[material.id] === 'success'
                                                        ? "bg-green-500 text-white"
                                                        : "bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white"
                                                )}
                                            >
                                                {downloadStatus[material.id] === 'loading' ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : downloadStatus[material.id] === 'success' ? (
                                                    <CheckCircle2 className="w-4 h-4" />
                                                ) : (
                                                    <Download className="w-4 h-4" />
                                                )}
                                                <span className="hidden sm:inline">
                                                    {downloadStatus[material.id] === 'loading' ? 'Wait...' : downloadStatus[material.id] === 'success' ? 'Done' : 'Download'}
                                                </span>
                                            </button>
                                        </motion.div>
                                    ))}

                                    {filteredMaterials.length === 0 && (
                                        <div className="text-center p-6 text-slate-500">
                                            No files found for this selection.
                                        </div>
                                    )}
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                </div>
            )}
        </div>
    );
};

// test