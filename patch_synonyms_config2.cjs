const fs = require('fs');

let file = 'src/features/synonyms/SynonymsConfig.tsx';
let code = fs.readFileSync(file, 'utf8');

const loadBlockOld = `            try {
                // In a real scenario, this might be a fetch or complex parse
                const parsed = rawSynonymsData as unknown as SynonymWord[];

                // Sort by importance_score descending (Heatmap Hot first)
                parsed.sort((a, b) => b.importance_score - a.importance_score);

                setData(parsed);
            } catch(e) {
                console.error("Failed to load synonyms data", e);
            } finally {
                setIsLoading(false);
            }`;

const loadBlockNew = `            try {
                const parsed = await quizEngine.getPlugin<SynonymWord, string>('synonym').loadQuestions();

                // Sort alphabetically so it starts from A as expected by the user.
                parsed.sort((a, b) => (a.word || '').localeCompare(b.word || ''));

                setData(parsed);
            } catch(e) {
                console.error("Failed to load synonyms data", e);
            } finally {
                setIsLoading(false);
            }`;

code = code.replace(loadBlockOld, loadBlockNew);

fs.writeFileSync(file, code);
