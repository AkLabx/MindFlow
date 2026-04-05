const fs = require('fs');

let content = fs.readFileSync('src/features/ows/OWSConfig.tsx', 'utf8');

// 1. Add import for useOWSProgress and CheckCircle icon
content = content.replace(`import { ArrowLeft, Play, Loader2, Target, FileText, Settings, Calendar, Type } from 'lucide-react';`, `import { ArrowLeft, Play, Loader2, Target, FileText, Settings, Calendar, Type, CheckCircle } from 'lucide-react';\nimport { useOWSProgress } from './hooks/useOWSProgress';`);

// 2. Add readStatus to emptyFilters
content = content.replace('tags: [],', 'tags: [],\n    readStatus: [],');

// 3. Initialize hook and update counts
content = content.replace('const [isLoading, setIsLoading] = useState(true);', `const [isLoading, setIsLoading] = useState(true);\n    const { isLoaded: isProgressLoaded, getReadStatus } = useOWSProgress();`);

// Wait for both data and progress to load
content = content.replace('if (isLoading)', 'if (isLoading || !isProgressLoaded)');


// 4. Update counts logic to include readStatus
let countsLogic = `
                // Apply readStatus filter to these counts
                if (filters.readStatus && filters.readStatus.length && key !== 'readStatus') {
                    const isRead = getReadStatus(q);
                    if (filters.readStatus.includes('read') && !isRead) return false;
                    if (filters.readStatus.includes('unread') && isRead) return false;
                }

                if (key === 'pdfName') return q.sourceInfo.pdfName === value;`;
content = content.replace(`if (key === 'pdfName') return q.sourceInfo.pdfName === value;`, countsLogic);

let countsLogicRead = `['Easy', 'Medium', 'Hard'].forEach(diff => c[diff] = countFor('difficulty', diff));
        ['read', 'unread'].forEach(status => c[status] = countFor('readStatus' as keyof InitialFilters, status));

        return c;
    }, [metadata, filters, allExamNames, allExamYears, selectedLetter, getReadStatus]);`;
content = content.replace(`['Easy', 'Medium', 'Hard'].forEach(diff => c[diff] = countFor('difficulty', diff));

        return c;
    }, [metadata, filters, allExamNames, allExamYears, selectedLetter]);`, countsLogicRead);

// 5. Update letterCounts logic to include readStatus
let letterCountsLogic = `if (filters.difficulty.length && !filters.difficulty.includes(q.properties.difficulty)) return false;

                if (filters.readStatus && filters.readStatus.length) {
                    const isRead = getReadStatus(q);
                    if (filters.readStatus.includes('read') && !isRead) return false;
                    if (filters.readStatus.includes('unread') && isRead) return false;
                }

                // Check if word starts with this letter`;
content = content.replace(`if (filters.difficulty.length && !filters.difficulty.includes(q.properties.difficulty)) return false;

                // Check if word starts with this letter`, letterCountsLogic);

// Add getReadStatus to dependency array of letterCounts
content = content.replace(`}, [metadata, filters, alphabet]);`, `}, [metadata, filters, alphabet, getReadStatus]);`);


// 6. Update filteredData logic to include readStatus
let filteredDataLogic = `if (filters.difficulty.length && !filters.difficulty.includes(q.properties.difficulty)) return false;

            if (filters.readStatus && filters.readStatus.length) {
                const isRead = getReadStatus(q);
                if (filters.readStatus.includes('read') && !isRead) return false;
                if (filters.readStatus.includes('unread') && isRead) return false;
            }

            if (selectedLetter) {`;
content = content.replace(`if (filters.difficulty.length && !filters.difficulty.includes(q.properties.difficulty)) return false;

            if (selectedLetter) {`, filteredDataLogic);

// Add getReadStatus to dependency array of filteredData
content = content.replace(`}, [metadata, filters, selectedLetter]);`, `}, [metadata, filters, selectedLetter, getReadStatus]);`);

// 7. Render SegmentedControl for Read Status
const readStatusUI = `
                    {/* Read Status Card */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-teal-100 border-l-4 border-l-teal-400 shadow-sm relative">
                        <div className="flex items-center gap-2 mb-4 text-teal-800 font-bold text-sm uppercase tracking-wider">
                            <CheckCircle className="w-4 h-4" /> Read Status
                        </div>

                        <SegmentedControl
                            options={['read', 'unread']}
                            selectedOptions={filters.readStatus || []}
                            onOptionToggle={(opt) => setFilters(prev => {
                                const current = prev.readStatus || [];
                                return { ...prev, readStatus: current.includes(opt as any) ? current.filter(i => i !== opt) : [...current, opt as any] };
                            })}
                            counts={counts}
                        />
                    </div>
`;

content = content.replace(`{/* Difficulty Card */}`, readStatusUI + '\n                    {/* Difficulty Card */}');

fs.writeFileSync('src/features/ows/OWSConfig.tsx', content, 'utf8');
