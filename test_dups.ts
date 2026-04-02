import { fetchQuestionMetadata } from './src/features/quiz/services/questionService';

async function run() {
  console.log("Fetching...");
  const data = await fetchQuestionMetadata();
  console.log("Total Fetched:", data.length);

  const ids = new Set();
  const v1_ids = new Set();

  let duplicateIds = 0;
  let duplicateV1Ids = 0;

  data.forEach(q => {
      if (ids.has(q.id)) { duplicateIds++; }
      ids.add(q.id);

      if (q.v1_id && v1_ids.has(q.v1_id)) { duplicateV1Ids++; }
      if (q.v1_id) { v1_ids.add(q.v1_id); }
  });

  console.log("Duplicate IDs:", duplicateIds);
  console.log("Duplicate v1_ids:", duplicateV1Ids);
}

run().catch(console.error);
