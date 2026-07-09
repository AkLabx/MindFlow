import React, { useState, useMemo, useEffect } from 'react';
import { QuestionLightweight } from '../types/questionBuilder.types';
import { Trash2, AlertTriangle, ChevronDown, ChevronRight, CheckCircle2, Loader2, RefreshCw, GripVertical, CheckSquare, ListFilter, Undo2 } from 'lucide-react';
import DOMPurify from "dompurify";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

const renderMathText = (text: string) => DOMPurify.sanitize(text);

interface SortableQuestionItemProps {
    question: QuestionLightweight;
    index: number;
    isSelected: boolean;
    onToggleSelect: (id: string, checked: boolean) => void;
    onRemove: (id: string) => void;
}

const SortableQuestionItem = ({ question, index, isSelected, onToggleSelect, onRemove }: SortableQuestionItemProps) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: question.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition: transition || 'transform 200ms cubic-bezier(0.2, 0, 0, 1)',
        zIndex: isDragging ? 50 : 'auto',
    };

    const truncate = (str: string, max = 80) => str.length > max ? str.substring(0, max) + '...' : str;

    // Check for quality warnings
    const hasExplanation = !!question.explanation?.summary || !!question.explanation?.analysis_correct || !!question.explanation?.analysis_incorrect || !!question.explanation?.fact;
    const hasOptions = Array.isArray(question.options) && question.options.length > 0;
    const hasCorrect = !!question.correct;

    const warnings = [];
    if (!hasExplanation) warnings.push("No explanation");
    if (!hasOptions && question.questionType !== 'Subjective') warnings.push("No options");
    if (!hasCorrect) warnings.push("No correct answer");

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`bg-white dark:bg-slate-800 p-3 rounded-xl border ${isSelected ? 'border-indigo-300 dark:border-indigo-600 ring-1 ring-indigo-500/20' : 'border-slate-200 dark:border-slate-700'} shadow-sm flex gap-3 group relative transition-colors ${isDragging ? 'opacity-80 shadow-lg scale-[1.02]' : ''}`}
        >
            <div
                {...attributes}
                {...listeners}
                className="flex items-center justify-center cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
                <GripVertical className="w-4 h-4" />
            </div>

            <div className="pt-0.5 flex flex-col gap-2 items-center">
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => onToggleSelect(question.id, e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer dark:border-slate-600 dark:bg-slate-800"
                />
                <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 w-6 text-center">
                    {index + 1}
                </div>
            </div>

            <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className="flex items-center gap-2 flex-wrap text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                    <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-700 dark:text-slate-300">
                        {question.v1_id || 'NO-ID'}
                    </span>
                    {question.subject && <span>• {question.subject}</span>}
                    {warnings.length > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/50">
                            ⚠ {warnings.length}
                        </span>
                    )}
                </div>
                <div
                    className="text-sm text-slate-700 dark:text-slate-200 line-clamp-2 prose prose-sm dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: truncate(renderMathText(question.question)) }}
                />
            </div>

            <button
                onClick={() => onRemove(question.id)}
                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 h-fit"
                title="Remove Question"
            >
                <Trash2 className="w-4 h-4" />
            </button>
        </div>
    );
};

interface Props {
    selectedQuestions: QuestionLightweight[];
    onRemove: (id: string) => void;
    onRemoveMultiple: (ids: string[]) => void;
    onRemoveAll: () => void;
    onReorder: (newOrder: QuestionLightweight[]) => void;
    onBulkSort: (newOrder: QuestionLightweight[]) => void;
    onAdvancedImport: (uuids: string) => Promise<void>;
    isImporting: boolean;
    onUndo: () => void;
    canUndo: boolean;
}

export const SelectedQuestionsPanel: React.FC<Props> = ({
    selectedQuestions,
    onRemove,
    onRemoveMultiple,
    onRemoveAll,
    onReorder,
    onBulkSort,
    onAdvancedImport,
    isImporting,
    onUndo,
    canUndo
}) => {
    const [importText, setImportText] = useState('');
    const [showImport, setShowImport] = useState(false);
    const [showQuality, setShowQuality] = useState(false);
    const [showStats, setShowStats] = useState(false);
    const [rightSelectedIds, setRightSelectedIds] = useState<Set<string>>(new Set());

    // Auto-open quality panel if there are issues
    useEffect(() => {
        if (selectedQuestions.length > 0) {
            const hasIssues = selectedQuestions.some(q => {
                const noExpl = !q.explanation?.summary && !q.explanation?.analysis_correct && !q.explanation?.analysis_incorrect && !q.explanation?.fact;
                const noOpt = (!q.options || q.options.length === 0) && q.questionType !== 'Subjective';
                const noCorr = !q.correct;
                return noExpl || noOpt || noCorr;
            });

            const ids = selectedQuestions.map(q => q.id);
            const hasDups = new Set(ids).size !== ids.length;

            if (hasIssues || hasDups) {
                setShowQuality(true);
            } else {
                setShowQuality(false);
            }
        }
    }, [selectedQuestions]);

    const handleImportSubmit = async () => {
        if (!importText.trim()) return;
        await onAdvancedImport(importText);
        setImportText('');
        setShowImport(false);
    };

    // Multi-select handlers
    const handleToggleRightSelect = (id: string, checked: boolean) => {
        setRightSelectedIds(prev => {
            const newSet = new Set(prev);
            if (checked) newSet.add(id);
            else newSet.delete(id);
            return newSet;
        });
    };

    const handleSelectAll = () => {
        if (rightSelectedIds.size === selectedQuestions.length) {
            setRightSelectedIds(new Set());
        } else {
            setRightSelectedIds(new Set(selectedQuestions.map(q => q.id)));
        }
    };

    const handleRemoveSelected = () => {
        if (rightSelectedIds.size === 0) return;
        onRemoveMultiple(Array.from(rightSelectedIds));
        setRightSelectedIds(new Set());
    };

    // DND handlers
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5, // 5px drag distance before activation
            }
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = selectedQuestions.findIndex((q) => q.id === active.id);
            const newIndex = selectedQuestions.findIndex((q) => q.id === over.id);

            const newOrder = arrayMove(selectedQuestions, oldIndex, newIndex);
            onReorder(newOrder);
        }
    };

    // Bulk Sort Handlers
    const sortBySubject = () => {
        const sorted = [...selectedQuestions].sort((a, b) => {
            const subA = a.subject || '';
            const subB = b.subject || '';
            return subA.localeCompare(subB);
        });
        onBulkSort(sorted);
    };

    const sortByDifficulty = () => {
        const diffMap: Record<string, number> = { 'Easy': 1, 'Medium': 2, 'Hard': 3 };
        const sorted = [...selectedQuestions].sort((a, b) => {
            const valA = diffMap[a.difficulty || ''] || 0;
            const valB = diffMap[b.difficulty || ''] || 0;
            return valA - valB;
        });
        onBulkSort(sorted);
    };

    // Stats calculation
    const stats = useMemo(() => {
        const subjects: Record<string, number> = {};
        const difficulties: Record<string, number> = {};

        let warningsCount = 0;
        const seenIds = new Set<string>();
        let dupCount = 0;

        selectedQuestions.forEach(q => {
            // Demographics
            if (q.subject) subjects[q.subject] = (subjects[q.subject] || 0) + 1;
            if (q.difficulty) difficulties[q.difficulty] = (difficulties[q.difficulty] || 0) + 1;

            // Warnings
            const noExpl = !q.explanation?.summary && !q.explanation?.analysis_correct && !q.explanation?.analysis_incorrect && !q.explanation?.fact;
            const noOpt = (!q.options || q.options.length === 0) && q.questionType !== 'Subjective';
            const noCorr = !q.correct;
            if (noExpl || noOpt || noCorr) warningsCount++;

            // Duplicates
            if (seenIds.has(q.id)) dupCount++;
            else seenIds.add(q.id);
        });

        return { subjects, difficulties, warningsCount, dupCount };
    }, [selectedQuestions]);

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700">
            {/* Header Toolbar (Module 1) */}
            <div className="p-3 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm z-20 sticky top-0 flex flex-col gap-3">

                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                            Selected
                            <span className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 px-2 py-0.5 rounded-full text-xs font-bold">
                                {selectedQuestions.length}
                            </span>
                        </h3>
                        {canUndo && (
                            <button
                                onClick={onUndo}
                                className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md"
                            >
                                <Undo2 className="w-3.5 h-3.5" />
                                Undo
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowStats(!showStats)}
                            className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${showStats ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                            title="Toggle Statistics"
                        >
                            Stats
                        </button>
                        <button
                            onClick={() => setShowQuality(!showQuality)}
                            className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors ${showQuality ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                            title="Toggle Quality Panel"
                        >
                            {(stats.warningsCount > 0 || stats.dupCount > 0) && <AlertTriangle className="w-3.5 h-3.5" />}
                            Quality
                        </button>
                    </div>
                </div>

                {/* Secondary Action Bar (Module 2 & 7) */}
                {selectedQuestions.length > 0 && (
                    <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-3">
                            <label className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300 cursor-pointer pl-1">
                                <input
                                    type="checkbox"
                                    checked={rightSelectedIds.size > 0 && rightSelectedIds.size === selectedQuestions.length}
                                    ref={input => {
                                      if (input) {
                                        input.indeterminate = rightSelectedIds.size > 0 && rightSelectedIds.size < selectedQuestions.length;
                                      }
                                    }}
                                    onChange={handleSelectAll}
                                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer dark:border-slate-600 dark:bg-slate-800"
                                />
                                {rightSelectedIds.size > 0 ? `${rightSelectedIds.size} Selected` : 'Select All'}
                            </label>
                        </div>

                        <div className="flex items-center gap-2">
                            {rightSelectedIds.size > 0 ? (
                                <button
                                    onClick={handleRemoveSelected}
                                    className="text-xs font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 px-3 py-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-1"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Remove
                                </button>
                            ) : (
                                <>
                                    <DropdownMenu.Root>
                                        <DropdownMenu.Trigger asChild>
                                            <button className="text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white px-3 py-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1">
                                                <ListFilter className="w-3.5 h-3.5" />
                                                Sort
                                            </button>
                                        </DropdownMenu.Trigger>
                                        <DropdownMenu.Portal>
                                            <DropdownMenu.Content className="min-w-[140px] bg-white dark:bg-slate-800 rounded-lg p-1 shadow-xl border border-slate-200 dark:border-slate-700 z-50 text-sm">
                                                <DropdownMenu.Item onSelect={sortBySubject} className="px-3 py-2 rounded-md outline-none cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200">
                                                    Sort by Subject
                                                </DropdownMenu.Item>
                                                <DropdownMenu.Item onSelect={sortByDifficulty} className="px-3 py-2 rounded-md outline-none cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200">
                                                    Sort by Difficulty
                                                </DropdownMenu.Item>
                                            </DropdownMenu.Content>
                                        </DropdownMenu.Portal>
                                    </DropdownMenu.Root>

                                    <DropdownMenu.Root>
                                        <DropdownMenu.Trigger asChild>
                                            <button className="text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white px-3 py-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1">
                                                More
                                            </button>
                                        </DropdownMenu.Trigger>
                                        <DropdownMenu.Portal>
                                            <DropdownMenu.Content className="min-w-[140px] bg-white dark:bg-slate-800 rounded-lg p-1 shadow-xl border border-slate-200 dark:border-slate-700 z-50 text-sm">
                                                <DropdownMenu.Item
                                                    onSelect={() => {
                                                        if(window.confirm('Clear all questions?')) onRemoveAll();
                                                    }}
                                                    className="px-3 py-2 rounded-md outline-none cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 font-medium"
                                                >
                                                    Clear All
                                                </DropdownMenu.Item>
                                            </DropdownMenu.Content>
                                        </DropdownMenu.Portal>
                                    </DropdownMenu.Root>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Statistics Panel (Module 4) */}
            {showStats && selectedQuestions.length > 0 && (
                <div className="border-b border-slate-200 dark:border-slate-700 bg-blue-50/50 dark:bg-blue-900/10 p-4 text-xs">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <div className="text-slate-500 font-semibold mb-1 uppercase tracking-wider text-[10px]">Overview</div>
                            <div className="flex justify-between py-0.5"><span className="text-slate-600 dark:text-slate-400">Total Count:</span><span className="font-bold text-slate-900 dark:text-white">{selectedQuestions.length}</span></div>
                            <div className="flex justify-between py-0.5"><span className="text-slate-600 dark:text-slate-400">Est. Marks:</span><span className="font-bold text-slate-900 dark:text-white">{selectedQuestions.length}</span></div>
                        </div>

                        <div>
                            <div className="text-slate-500 font-semibold mb-1 uppercase tracking-wider text-[10px]">Difficulty</div>
                            {Object.keys(stats.difficulties).length === 0 ? <span className="text-slate-400">N/A</span> :
                                Object.entries(stats.difficulties).map(([k, v]) => (
                                    <div key={k} className="flex justify-between py-0.5"><span className="text-slate-600 dark:text-slate-400">{k}:</span><span className="font-medium text-slate-900 dark:text-white">{v}</span></div>
                                ))
                            }
                        </div>
                    </div>

                    <div className="mt-3">
                        <div className="text-slate-500 font-semibold mb-1 uppercase tracking-wider text-[10px]">Subjects</div>
                        <div className="flex gap-2 flex-wrap">
                            {Object.keys(stats.subjects).length === 0 ? <span className="text-slate-400">N/A</span> :
                                Object.entries(stats.subjects).map(([k, v]) => (
                                    <span key={k} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded-md text-slate-700 dark:text-slate-300 shadow-sm">
                                        {k}: <strong>{v}</strong>
                                    </span>
                                ))
                            }
                        </div>
                    </div>
                </div>
            )}

            {/* Quality Panel (Module 5) */}
            {showQuality && selectedQuestions.length > 0 && (
                <div className="border-b border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-900/10 p-4 text-xs">
                    <div className="text-amber-800 dark:text-amber-500 font-bold mb-2 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                        <AlertTriangle className="w-3.5 h-3.5" /> Quality Report
                    </div>

                    <ul className="space-y-1.5">
                        {stats.dupCount > 0 ? (
                            <li className="flex gap-2 text-red-600 dark:text-red-400 font-medium">
                                <span>❌</span> {stats.dupCount} Duplicate ID{stats.dupCount > 1 ? 's' : ''} detected. Must remove before publishing.
                            </li>
                        ) : (
                            <li className="flex gap-2 text-emerald-600 dark:text-emerald-400 font-medium">
                                <span>✔</span> No duplicate IDs found.
                            </li>
                        )}

                        {stats.warningsCount > 0 ? (
                            <li className="flex gap-2 text-amber-700 dark:text-amber-400">
                                <span>⚠</span> {stats.warningsCount} question{stats.warningsCount > 1 ? 's' : ''} missing explanations, options, or correct answers.
                            </li>
                        ) : (
                            <li className="flex gap-2 text-emerald-600 dark:text-emerald-400 font-medium">
                                <span>✔</span> All questions have basic metadata.
                            </li>
                        )}
                    </ul>
                </div>
            )}

            {/* Advanced Import Accordion */}
            <div className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80">
                <button
                    onClick={() => setShowImport(!showImport)}
                    className="w-full flex items-center justify-between p-3 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                    <span className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 text-slate-400" />
                        Advanced UUID Import
                    </span>
                    {showImport ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>

                {showImport && (
                    <div className="p-4 pt-0 space-y-3 animate-in slide-in-from-top-2 duration-200">
                        <div className="text-xs text-slate-500 dark:text-slate-400 bg-blue-50 dark:bg-blue-900/20 p-2.5 rounded-lg border border-blue-100 dark:border-blue-800/50">
                            Paste comma-separated UUIDs. They will be validated, fetched, and visually merged below.
                        </div>
                        <textarea
                            rows={3}
                            value={importText}
                            onChange={e => setImportText(e.target.value)}
                            placeholder="e.g. 123e4567-e89b-12d3-a456-426614174000..."
                            className="w-full text-xs font-mono p-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                            disabled={isImporting}
                        />
                        <button
                            onClick={handleImportSubmit}
                            disabled={isImporting || !importText.trim()}
                            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors flex justify-center items-center gap-2"
                        >
                            {isImporting ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Importing...</>
                            ) : (
                                'Import & Merge'
                            )}
                        </button>
                    </div>
                )}
            </div>

            {/* Selected List with Drag & Drop */}
            <div className="flex-1 overflow-y-auto p-4 min-h-0 relative">
                {selectedQuestions.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4 p-8 text-center animate-in fade-in">
                        <CheckCircle2 className="w-12 h-12 text-slate-200 dark:text-slate-700" />
                        <p className="text-sm">No questions selected yet.<br/>Search and select questions from the left panel.</p>
                    </div>
                ) : (
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={selectedQuestions.map(q => q.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <div className="space-y-3 pb-12">
                                {selectedQuestions.map((q, index) => (
                                    <SortableQuestionItem
                                        key={q.id}
                                        question={q}
                                        index={index}
                                        isSelected={rightSelectedIds.has(q.id)}
                                        onToggleSelect={handleToggleRightSelect}
                                        onRemove={onRemove}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>
                )}
            </div>
        </div>
    );
};
