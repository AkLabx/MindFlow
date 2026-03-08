import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, Star, Trash2, LibraryBig } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../../lib/db';
import { Question } from '../types';
import { Button } from '../../../components/Button/Button';
import { Card } from '../../../components/ui/Card';
import { cn } from '../../../utils/cn';

export const BookmarksPage: React.FC = () => {
    const navigate = useNavigate();
    const [bookmarks, setBookmarks] = useState<Question[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedSubject, setSelectedSubject] = useState<string>('All');

    useEffect(() => {
        const loadBookmarks = async () => {
            try {
                const records = await db.getAllBookmarks();
                setBookmarks(records);
            } catch (error) {
                console.error("Failed to load bookmarks:", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadBookmarks();
    }, []);

    const handleRemoveBookmark = async (id: string) => {
        try {
            await db.removeBookmark(id);
            setBookmarks(prev => prev.filter(b => b.id !== id));
        } catch (error) {
            console.error("Failed to remove bookmark:", error);
        }
    };

    const subjects = useMemo(() => {
        const subs = new Set<string>();
        bookmarks.forEach(q => {
            if (q.classification.subject) subs.add(q.classification.subject);
        });
        return ['All', ...Array.from(subs)];
    }, [bookmarks]);

    const filteredBookmarks = useMemo(() => {
        if (selectedSubject === 'All') return bookmarks;
        return bookmarks.filter(q => q.classification.subject === selectedSubject);
    }, [bookmarks, selectedSubject]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-full min-h-[50vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (bookmarks.length === 0) {
        return (
            <div className="max-w-4xl mx-auto p-4 sm:p-6 pb-24 h-full flex flex-col justify-center items-center text-center">
                <div className="w-24 h-24 bg-amber-50 rounded-full flex items-center justify-center mb-6">
                    <Star className="w-12 h-12 text-amber-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">No Bookmarks Yet</h2>
                <p className="text-gray-500 max-w-md mb-8">
                    Tap the star icon during a quiz to save questions here for later review.
                </p>
                <Button onClick={() => navigate('/dashboard')} className="bg-indigo-600 hover:bg-indigo-700">
                    Back to Dashboard
                </Button>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-6 pb-24 space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center space-x-4">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                    <ChevronLeft className="w-6 h-6 text-gray-600" />
                </button>
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Your Bookmarks</h1>
                    <p className="text-sm text-gray-500 mt-1">Review saved questions sorted by subject.</p>
                </div>
            </div>

            {/* Subject Filters (Capsule Type) */}
            <div className="flex overflow-x-auto py-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide space-x-2">
                {subjects.map(subject => (
                    <button
                        key={subject}
                        onClick={() => setSelectedSubject(subject)}
                        className={cn(
                            "whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold transition-colors duration-200 border",
                            selectedSubject === subject
                                ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200"
                                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                        )}
                    >
                        {subject}
                    </button>
                ))}
            </div>

            {/* Bookmark List */}
            <div className="space-y-4">
                {filteredBookmarks.map((question, index) => (
                    <Card key={question.id} className="p-5 flex flex-col sm:flex-row gap-4 group transition-shadow hover:shadow-md">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs font-bold px-2 py-1 bg-indigo-50 text-indigo-700 rounded uppercase tracking-wider">
                                    {question.classification.subject || 'General'}
                                </span>
                                <span className={cn(
                                    "text-xs font-bold px-2 py-1 rounded uppercase tracking-wider",
                                    question.properties.difficulty === 'Easy' ? "bg-emerald-50 text-emerald-700" :
                                    question.properties.difficulty === 'Medium' ? "bg-amber-50 text-amber-700" :
                                    "bg-rose-50 text-rose-700"
                                )}>
                                    {question.properties.difficulty}
                                </span>
                            </div>

                            <h3 className="text-gray-900 font-medium mb-3">
                                {index + 1}. {question.question}
                            </h3>

                            <div className="space-y-2 mb-4">
                                {question.options.map((opt, i) => (
                                    <div key={i} className={cn(
                                        "p-3 rounded-lg border text-sm flex items-center gap-3",
                                        opt === question.correct
                                            ? "bg-emerald-50 border-emerald-200 text-emerald-900 font-medium"
                                            : "bg-white border-gray-100 text-gray-600"
                                    )}>
                                        <div className={cn(
                                            "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
                                            opt === question.correct
                                                ? "bg-emerald-200 text-emerald-800"
                                                : "bg-gray-100 text-gray-500"
                                        )}>
                                            {String.fromCharCode(65 + i)}
                                        </div>
                                        <span>{opt}</span>
                                    </div>
                                ))}
                            </div>

                            {question.explanation && (
                                <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100/50 text-sm text-blue-900">
                                    <span className="font-bold flex items-center gap-2 mb-1">
                                        <LibraryBig className="w-4 h-4 text-blue-600" />
                                        Explanation
                                    </span>
                                    {question.explanation.summary || question.explanation.fact || "No specific explanation provided."}
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex sm:flex-col justify-end sm:justify-start gap-2">
                            <button
                                onClick={() => handleRemoveBookmark(question.id)}
                                className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-2 sm:w-full justify-center"
                                title="Remove Bookmark"
                            >
                                <Trash2 className="w-5 h-5" />
                                <span className="sm:hidden text-sm font-medium">Remove</span>
                            </button>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};
