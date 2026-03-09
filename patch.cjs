const fs = require('fs');

const file = 'src/features/tools/quiz-pdf-ppt-generator/QuizPdfPptGenerator.tsx';
const content = fs.readFileSync(file, 'utf8');

const targetStr = `  const handleCreatePPT = async () => {`;

const newFunc = `
  const handleCreateJSON = async () => {
    setGenType('JSON');
    setIsGenerating(true);
    setGenProgress(0);
    setGenDetails('Fetching full questions data...');

    const questions = await validateAndFetchQuestions();

    if (questions && questions.length > 0) {
      try {
        setGenProgress(50);
        setGenDetails('Formatting JSON data...');

        // Clone the questions to avoid mutating the original
        const formattedQuestions = JSON.parse(JSON.stringify(questions));

        // Add metadata to the first question only, matching requested format
        formattedQuestions[0] = {
          ...formattedQuestions[0],
          metadata: {
            generatedAt: new Date().toISOString(),
            filters: filters,
            totalQuestions: questions.length
          }
        };

        const jsonString = JSON.stringify(formattedQuestions, null, 2);

        setGenProgress(80);
        setGenDetails('Preparing download...');

        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        // Construct filename
        let subjectPart = "Mixed-Subjects";
        if (filters.subject.length > 0) {
          subjectPart = filters.subject.join('-').replace(/\\s+/g, '');
        }

        const datePart = new Date().toISOString().split('T')[0];
        const filename = \`\${subjectPart}-\${questions.length}-\${datePart}.json\`;

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();

        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        setGenProgress(100);
        setGenDetails('Complete!');
      } catch (err) {
         console.error(err);
         alert("Error generating JSON.");
      }
    }

    setTimeout(() => {
        setIsGenerating(false);
        setGenType(null);
    }, 500); // Small delay to show 100% complete
  };

  const handleCreatePPT = async () => {`;

const newContent = content.replace(targetStr, newFunc);
fs.writeFileSync(file, newContent);
console.log("Patched successfully.");
