import React, { useState } from 'react';
import { ChevronRight, Layers, LayoutGrid, Search, X } from 'lucide-react';
import { SynonymWord } from '../../quiz/types';
import synonymsDataRaw from '../../quiz/data/processed_synonyms.json';

const synonymsData: SynonymWord[] = synonymsDataRaw as SynonymWord[];

// Group by cluster
const clusters = synonymsData.reduce((acc, word) => {
    if (!acc[word.cluster_id]) acc[word.cluster_id] = [];
    acc[word.cluster_id].push(word);
    return acc;
}, {} as Record<string, SynonymWord[]>);

interface SynonymClusterListProps {
    onExit: () => void;
}

export const SynonymClusterList: React.FC<SynonymClusterListProps> = ({ onExit }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedCluster, setExpandedCluster] = useState<string | null>(null);

    const clusterEntries = Object.entries(clusters).filter(([_, words]) =>
        words.some(w => w.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
                   w.meaning?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 animate-fade-in">
            {/* Header */}
            <header className="bg-white dark:bg-gray-800 shadow-sm z-10 sticky top-0">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={onExit} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                            <ChevronRight className="w-6 h-6 rotate-180 text-gray-500" />
                        </button>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Layers className="w-5 h-5 text-emerald-600" />
                            Semantic Clusters
                        </h1>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="max-w-4xl mx-auto px-4 pb-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search words or meanings..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-10 py-3 bg-gray-100 dark:bg-gray-700 border-none rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 transition-shadow"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full"
                            >
                                <X className="w-4 h-4 text-gray-500" />
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {/* List */}
            <main className="flex-1 overflow-y-auto p-4">
                <div className="max-w-4xl mx-auto space-y-4 pb-24">
                    {clusterEntries.map(([clusterId, words]) => (
                        <div key={clusterId} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                            <button
                                onClick={() => setExpandedCluster(expandedCluster === clusterId ? null : clusterId)}
                                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center font-bold text-emerald-700 dark:text-emerald-400">
                                        {words.length}
                                    </div>
                                    <div className="text-left">
                                        <h3 className="font-bold text-gray-900 dark:text-white uppercase tracking-wider text-sm">
                                            Cluster: {clusterId.replace('cluster_', '')}
                                        </h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {words.slice(0, 3).map(w => w.word).join(', ')}{words.length > 3 ? '...' : ''}
                                        </p>
                                    </div>
                                </div>
                                <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${expandedCluster === clusterId ? 'rotate-90' : ''}`} />
                            </button>

                            {/* Expanded Content */}
                            {expandedCluster === clusterId && (
                                <div className="px-6 pb-4 pt-2 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                                    <div className="grid gap-3 mt-4">
                                        {words.map(word => (
                                            <div key={word.id} className="p-4 bg-white dark:bg-gray-700 rounded-xl shadow-sm">
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="font-bold text-lg text-gray-900 dark:text-white">{word.word}</span>
                                                    <span className="text-xs font-semibold px-2 py-1 bg-gray-100 dark:bg-gray-600 rounded-full text-gray-600 dark:text-gray-300">
                                                        {word.pos}
                                                    </span>
                                                </div>
                                                <p className="text-gray-700 dark:text-gray-300 mb-2">{word.meaning}</p>
                                                {word.hindiMeaning && (
                                                    <p className="text-sm text-blue-600 dark:text-blue-400 mb-3">{word.hindiMeaning}</p>
                                                )}

                                                <div className="grid grid-cols-2 gap-4 mt-4 text-sm border-t border-gray-100 dark:border-gray-600 pt-3">
                                                    <div>
                                                        <span className="text-gray-500 block mb-1">Synonyms</span>
                                                        <div className="flex flex-wrap gap-1">
                                                            {word.synonyms.map((s, i) => (
                                                                <span key={i} className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded text-xs border border-emerald-100 dark:border-emerald-800/50">
                                                                    {s.text}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-500 block mb-1">Antonyms</span>
                                                        <div className="flex flex-wrap gap-1">
                                                            {word.antonyms.map((a, i) => (
                                                                <span key={i} className="px-2 py-0.5 bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 rounded text-xs border border-rose-100 dark:border-rose-800/50">
                                                                    {a.text}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                    {clusterEntries.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-gray-500 dark:text-gray-400">No clusters match your search.</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};
