const fs = require('fs');

let fileContent = fs.readFileSync('src/features/synonyms/components/SynonymPhase1Session.tsx', 'utf8');

// Insert early return for data loading
fileContent = fileContent.replace(
    '// Load and process data based on grouping mode\n    useEffect(() => {\n        setIsLoading(true);',
    '// Load and process data based on grouping mode\n    useEffect(() => {\n        if (isDataLoading) return;\n        setIsLoading(true);'
);

fs.writeFileSync('src/features/synonyms/components/SynonymPhase1Session.tsx', fileContent);
