
import { supabase } from '../../../lib/supabase';
import { Question, Explanation } from '../types';

// Define the shape of the row directly from your DB Schema
interface QuestionDBRow {
  id: string; // UUID from DB
  v1_id: string; // The ID we use in the app (e.g., "BIO1")
  subject: string;
  topic: string;
  subTopic: string; // Note: Matches "subTopic" in DB schema
  examName: string; // Note: Matches "examName" in DB schema
  examYear: number; // Note: Matches "examYear" in DB schema
  examDateShift: string; // Note: Matches "examDateShift" in DB schema
  difficulty: string;
  questionType: string; // Note: Matches "questionType" in DB schema
  question: string;
  question_hi: string;
  options: string[];
  options_hi: string[];
  correct: string;
  tags: string[];
  explanation: Explanation; // JSONB maps to object/interface
}

// 1. Fetch ONLY Metadata (Fast, for filtering & counts)
export const fetchQuestionMetadata = async (
  onProgress?: (fetchedCount: number, totalCount: number) => void
): Promise<Question[]> => {
  let allRows: Partial<QuestionDBRow>[] = [];
  
  // Get Total Count
  const { count, error: countError } = await supabase
    .from('questions')
    .select('*', { count: 'exact', head: true });

  if (countError) {
      console.error('Error fetching count:', countError);
  }
  const totalRecords = count || 0;
  
  let from = 0;
  const limit = 1000;
  let hasMore = true;

  // We ONLY select columns needed for filtering. 
  // We DO NOT select 'question', 'options', 'explanation', 'correct' to save massive bandwidth.
  const columnsToSelect = 'v1_id, subject, topic, subTopic, examName, examYear, examDateShift, difficulty, questionType, tags';

  try {
    while (hasMore) {
      const { data, error } = await supabase
        .from('questions')
        .select(columnsToSelect)
        .range(from, from + limit - 1);

      if (error) throw error;

      if (data && data.length > 0) {
        allRows = [...allRows, ...data];
        if (onProgress) onProgress(allRows.length, totalRecords);
        
        if (data.length < limit) hasMore = false;
        else from += limit;
      } else {
        hasMore = false;
      }
    }
  } catch (error) {
    console.error("Failed to fetch metadata:", error);
    throw error;
  }

  // Map to Question type, but leave heavy fields empty/undefined.
  // The UI will use this array ONLY for filtering and counts.
  return allRows.map((row) => ({
    id: row.v1_id!, 
    sourceInfo: {
      examName: row.examName || '',
      examYear: row.examYear || 0,
      examDateShift: row.examDateShift,
    },
    classification: {
      subject: row.subject || '',
      topic: row.topic || '',
      subTopic: row.subTopic,
    },
    tags: row.tags || [],
    properties: {
      difficulty: row.difficulty || 'Medium',
      questionType: row.questionType || 'MCQ',
    },
    // Empty fields for metadata items
    question: '',
    options: [],
    correct: '',
    explanation: {},
  }));
};

// 2. Fetch Full Details for Specific IDs (Called when Quiz Starts)
export const fetchQuestionsByIds = async (ids: string[]): Promise<Question[]> => {
  if (ids.length === 0) return [];

  // Supabase .in() filter has a limit on number of items (usually around 65k chars in URL).
  // Since we might start a quiz with many questions, we batch if necessary, 
  // though usually a quiz is 20-100 questions which fits easily.
  
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .in('v1_id', ids);

  if (error) {
    console.error("Error fetching full questions:", error);
    throw error;
  }

  // Map the full data
  return (data as QuestionDBRow[]).map((row) => ({
    id: row.v1_id, 
    sourceInfo: {
      examName: row.examName,
      examYear: row.examYear,
      examDateShift: row.examDateShift,
    },
    classification: {
      subject: row.subject,
      topic: row.topic,
      subTopic: row.subTopic,
    },
    tags: row.tags || [],
    properties: {
      difficulty: row.difficulty,
      questionType: row.questionType,
    },
    question: row.question,
    question_hi: row.question_hi,
    options: row.options,
    options_hi: row.options_hi,
    correct: row.correct,
    explanation: row.explanation,
  }));
};
