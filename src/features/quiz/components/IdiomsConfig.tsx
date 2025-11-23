
import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Play, Loader2, Quote, FileText, Settings } from 'lucide-react';
import { Button } from '../../../components/Button/Button';
import { InitialFilters, QuizMode, Idiom } from '../types';
import { MultiSelectDropdown } from './ui/MultiSelectDropdown';
import { SegmentedControl } from './ui/SegmentedControl';
import { ActiveFiltersBar } from './ui/ActiveFiltersBar';
// Import JSON directly
import idiomsData from '../data/idioms.json';

interface IdiomsConfigProps {
  onStart: (questions: any[], filters?: InitialFilters, mode?: QuizMode) => void; // Kept generic to satisfy strict type checker if needed, but effectively used for Flashcards
  onBack: () => void;
}

const emptyFilters: InitialFilters = {
  subject: [],
  topic: [],
  subTopic: [],
  difficulty: [],
  questionType: [],
  examName: [],
  examYear: [],
  examDateShift: [],
  tags: [],
};

export const IdiomsConfig: React.FC<IdiomsConfigProps> = ({ onStart, onBack }) => {
  const [filters, setFilters] = useState<InitialFilters>(emptyFilters);
  const [metadata, setMetadata] = useState<Idiom[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load data from JSON
  useEffect(() => {
    // Simulate async load for smoother UX
    const timer = setTimeout(() => {
        setMetadata(idiomsData as Idiom[]);
        setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Derived Options
  const allExamNames = useMemo(() => Array.from(new Set(metadata.map(q => q.sourceInfo.pdfName))).sort(), [metadata]);
  const allExamYears = useMemo(() => Array.from(new Set(metadata.map(q => String(q.sourceInfo.examYear)))).sort(), [metadata]);

  // Filter Counts
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    const countFor = (key: keyof InitialFilters | 'pdfName', value: string) => {
        return metadata.filter(q => {
            if (filters.examName.length && !filters.examName.includes(q.sourceInfo.pdfName) && key !== 'pdfName') return false;
            if (filters.examYear.length && !filters.examYear.includes(String(q.sourceInfo.examYear)) && key !== 'examYear') return false;
            if (filters.difficulty.length && !filters.difficulty.includes(q.properties.difficulty) && key !== 'difficulty') return false;
            
            if (key === 'pdfName') return q.sourceInfo.pdfName === value;
            if (key === 'examYear') return String(q.sourceInfo.examYear) === value;
            if (key === 'difficulty') return q.properties.difficulty === value;
            return true;
        }).length;
    };

    allExamNames.forEach(name => c[name] = countFor('pdfName', name));
    allExamYears.forEach(year => c[year] = countFor('examYear', year));
    ['Easy', 'Medium', 'Hard'].forEach(diff => c[diff] = countFor('difficulty', diff));
    
    return c;
  }, [metadata, filters, allExamNames, allExamYears]);

  // Filtered subset for starting
  const filteredIdioms = useMemo(() => {
      return metadata.filter(q => {
          if (filters.examName.length && !filters.examName.includes(q.sourceInfo.pdfName)) return false;
          if (filters.examYear.length && !filters.examYear.includes(String(q.sourceInfo.examYear))) return false;
          if (filters.difficulty.length && !filters.difficulty.includes(q.properties.difficulty)) return false;
          return true;
      });
  }, [metadata, filters]);

  const handleStart = () => {
      if (filteredIdioms.length === 0) {
          alert("No idioms found matching your criteria.");
          return;
      }
      // Pass the idioms directly to the handler. 
      // The parent component will differentiate based on context or we invoke a specific method if passed.
      // Here we assume onStart is generic enough or we trigger the flashcard mode.
      onStart(filteredIdioms, filters, 'learning'); 
  };

  const handleRemoveFilter = (key: keyof InitialFilters, value?: string) => {
      if (value) {
          setFilters(prev => ({ ...prev, [key]: prev[key].filter(v => v !== value) }));
      } else {
          setFilters(prev => ({ ...prev, [key]: [] }));
      }
  };

  if (isLoading) {
      return (
          <div className="flex items-center justify-center min-h-[60vh]">
              <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
          </div>
      );
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] bg-amber-50/30">
        <div className="max-w-3xl mx-auto w-full px-4 py-8 flex-1 flex flex-col">
            
            {/* Header */}
            <div className="mb-8">
                <Button variant="ghost" onClick={onBack} className="text-amber-700 hover:bg-amber-100 pl-0 mb-4 hover:text-amber-900">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Topics
                </Button>
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-amber-100 rounded-2xl text-amber-600">
                        <Quote className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-gray-900">Idioms Practice</h1>
                        <p className="text-amber-700/80 font-medium">Configure your Flashcards</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 space-y-6">
                
                {/* Source Card */}
                <div className="bg-white p-6 rounded-2xl border border-amber-100 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-amber-400" />
                    <div className="flex items-center gap-2 mb-4 text-amber-800 font-bold text-sm uppercase tracking-wider">
                        <FileText className="w-4 h-4" /> Source Material
                    </div>
                    
                    <div className="space-y-4">
                        <MultiSelectDropdown 
                            label="Source Name (e.g., Blackbook)"
                            options={allExamNames}
                            selectedOptions={filters.examName}
                            onSelectionChange={(sel) => setFilters(prev => ({ ...prev, examName: sel }))}
                            counts={counts}
                            placeholder="Select Source"
                        />
                        
                        <MultiSelectDropdown 
                            label="Exam Year"
                            options={allExamYears}
                            selectedOptions={filters.examYear}
                            onSelectionChange={(sel) => setFilters(prev => ({ ...prev, examYear: sel }))}
                            counts={counts}
                            placeholder="Select Years"
                        />
                    </div>
                </div>

                {/* Difficulty Card */}
                <div className="bg-white p-6 rounded-2xl border border-amber-100 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-amber-400" />
                    <div className="flex items-center gap-2 mb-4 text-amber-800 font-bold text-sm uppercase tracking-wider">
                        <Settings className="w-4 h-4" /> Difficulty Level
                    </div>
                    
                    <SegmentedControl 
                        options={['Easy', 'Medium', 'Hard']}
                        selectedOptions={filters.difficulty}
                        onOptionToggle={(opt) => setFilters(prev => {
                            const current = prev.difficulty;
                            return { ...prev, difficulty: current.includes(opt) ? current.filter(i => i !== opt) : [...current, opt] };
                        })}
                        counts={counts}
                    />
                </div>

            </div>

            {/* Footer Action */}
            <div className="mt-8 sticky bottom-4 z-10">
                <div className="bg-white/90 backdrop-blur-md border border-amber-200 shadow-xl rounded-2xl p-4">
                    
                    <div className="mb-4">
                        <ActiveFiltersBar filters={filters} onRemoveFilter={handleRemoveFilter} />
                    </div>

                    <Button 
                        fullWidth 
                        size="lg" 
                        onClick={handleStart}
                        disabled={filteredIdioms.length === 0}
                        className="bg-amber-500 hover:bg-amber-600 text-white border-none shadow-lg shadow-amber-200"
                    >
                        <Play className="w-5 h-5 mr-2 fill-current" /> Start Flashcards ({filteredIdioms.length})
                    </Button>
                </div>
            </div>

        </div>
    </div>
  );
};