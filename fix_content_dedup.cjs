const fs = require('fs');
const file = 'src/features/quiz/services/questionService.ts';
let code = fs.readFileSync(file, 'utf8');

// We will inject the text-based deduplication logic right after the v1_id deduplication.
const searchStr = `  const uniqueFullQuestions = Array.from(new Map((allData as QuestionDBRow[]).map(item => [item.v1_id || item.id, item])).values());`;

const newCode = `  const uniqueFullQuestionsById = Array.from(new Map((allData as QuestionDBRow[]).map(item => [item.v1_id || item.id, item])).values());

  // Deep deduplication: Filter out questions that have the exact same text content
  // This catches database entry errors where the same question was uploaded twice with different IDs
  const seenContent = new Set<string>();
  const uniqueFullQuestions = uniqueFullQuestionsById.filter((q) => {
    // Normalize text: lowercase and remove all whitespace for robust comparison
    const normEn = (q.question || '').toLowerCase().replace(/\\s+/g, '');
    const normHi = (q.question_hi || '').toLowerCase().replace(/\\s+/g, '');

    // Create a unique composite key. If English is empty, rely on Hindi, and vice versa.
    const contentKey = \`\${normEn}-\${normHi}\`;

    if (!contentKey || contentKey === '-') {
       // Fallback if question text is completely missing, don't deduplicate here
       return true;
    }

    if (seenContent.has(contentKey)) {
      return false; // Duplicate content found, discard
    }

    seenContent.add(contentKey);
    return true;
  });`;

code = code.replace(searchStr, newCode);

fs.writeFileSync(file, code);
