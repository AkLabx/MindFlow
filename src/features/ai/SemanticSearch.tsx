import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Bot, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/utils/cn';

interface SearchResult {
    id: string;
    question: string;
    subject: string;
    topic: string;
    subtopic: string;
    difficulty: string;
    similarity: number;
}

export const SemanticSearch: React.FC = () => {
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [results, setResults] = useState<SearchResult[]>([]);
    const [error, setError] = useState<string | null>(null);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setIsSearching(true);
        setError(null);

        try {
            // 1. Get embedding for the user's query from Google Gemini API
            const apiKey = process.env.GOOGLE_AI_KEY || process.env.GEMINI_API_KEY;
            if (!apiKey) {
                throw new Error("AI API Key is missing. Please configure GOOGLE_AI_KEY.");
            }

            // Must use the exact same model we used to generate the database embeddings
            const modelName = 'models/gemini-embedding-2-preview';
            const url = `https://generativelanguage.googleapis.com/v1beta/${modelName}:embedContent?key=${apiKey}`;

            const embedResponse = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: modelName,
                    content: {
                        parts: [{ text: query }]
                    }
                })
            });

            if (!embedResponse.ok) {
                const errData = await embedResponse.json();
                throw new Error(errData.error?.message || "Failed to generate search embedding");
            }

            const embedData = await embedResponse.json();
            const embeddingVector = embedData.embedding?.values;

            if (!embeddingVector || !Array.isArray(embeddingVector)) {
                throw new Error("Invalid embedding returned from Google API");
            }

            // Format vector for pgvector (needs to be a string formatted like an array "[1.2, 0.4, ...]")
            const queryVectorStr = `[${embeddingVector.join(',')}]`;

            // 2. Query Supabase using the match_questions RPC function
            const { data: searchResults, error: rpcError } = await supabase.rpc('match_questions', {
                query_embedding: queryVectorStr,
                match_threshold: 0.6, // Start with a safe threshold (Cosine similarity: 1 is exact match)
                match_count: 10 // Top 10 results
            });

            if (rpcError) {
                console.error("Supabase RPC Error:", rpcError);
                throw new Error("Failed to search database: " + rpcError.message);
            }

            setResults(searchResults || []);

        } catch (err: any) {
            console.error("Semantic Search Error:", err);
            setError(err.message || "An unexpected error occurred.");
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-4 pb-32 animate-fade-in w-full mx-auto relative flex flex-col items-center">
            <div className="w-full max-w-3xl mx-auto flex flex-col">
                {/* Header */}
                <header className="mb-8 mt-2 flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 -ml-2 rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800 transition-colors"
                        aria-label="Go back"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/50 rounded-2xl flex items-center justify-center">
                            <Bot className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                Semantic Search
                            </h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Search by meaning, not just keywords</p>
                        </div>
                    </div>
                </header>

                {/* Search Box */}
                <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700/50 mb-8">
                    <form onSubmit={handleSearch} className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="e.g., questions about the first war of independence..."
                            className="block w-full pl-12 pr-24 py-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                            disabled={isSearching}
                        />
                        <button
                            type="submit"
                            disabled={isSearching || !query.trim()}
                            className="absolute inset-y-2 right-2 flex items-center gap-2 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSearching ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <span>Search</span>
                                    <Sparkles className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>
                    <p className="mt-3 text-xs text-center text-gray-500 dark:text-gray-400">
                        Powered by Google Gemini Embeddings
                    </p>
                </div>

                {/* Results Section */}
                <div className="space-y-4">
                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-2xl flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                            <p className="text-sm font-medium">{error}</p>
                        </div>
                    )}

                    {!isSearching && results.length > 0 && (
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                                Found {results.length} results
                            </h2>
                            <div className="grid gap-4">
                                {results.map((result) => (
                                    <div
                                        key={result.id}
                                        className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50 hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors"
                                    >
                                        <div className="flex flex-wrap items-center gap-2 mb-3">
                                            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/50">
                                                {result.subject}
                                            </span>
                                            {result.topic && (
                                                <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                                    {result.topic}
                                                </span>
                                            )}
                                            <div className="ml-auto flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-lg">
                                                <Sparkles className="w-3 h-3" />
                                                {(result.similarity * 100).toFixed(1)}% Match
                                            </div>
                                        </div>
                                        <p className="text-gray-800 dark:text-gray-200 font-medium leading-relaxed">
                                            {result.question}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {!isSearching && query && results.length === 0 && !error && (
                        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700">
                            <Bot className="w-12 h-12 text-gray-400 mx-auto mb-4 opacity-50" />
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No matches found</h3>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">
                                Try adjusting your search query or using different words. Note: Ensure you have populated the database with embeddings first!
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
