const fs = require('fs');

// Patch Bookmark Store
let bmFile = 'src/features/quiz/stores/useBookmarkStore.ts';
let bmCode = fs.readFileSync(bmFile, 'utf8');

bmCode = bmCode.replace(
  /import \{ Question \} from '\.\.\/types';/,
  `import { Question } from '../types';\nimport { useSyncStore } from './useSyncStore';`
);

bmCode = bmCode.replace(
  /import\('\.\.\/\.\.\/\.\.\/lib\/db'\)\.then\(\(\{ db \}\) => db\.removeBookmark\(question\.id\)\.catch\(console\.error\)\);/g,
  `import('../../../lib/db').then(({ db }) => db.removeBookmark(question.id).catch(console.error));
      useSyncStore.getState().addEvent({
        type: 'bookmark_toggled',
        payload: { questionId: question.id, isBookmarked: false }
      });`
);

bmCode = bmCode.replace(
  /import\('\.\.\/\.\.\/\.\.\/lib\/db'\)\.then\(\(\{ db \}\) => db\.saveBookmark\(question\)\.catch\(console\.error\)\);/g,
  `import('../../../lib/db').then(({ db }) => db.saveBookmark(question).catch(console.error));
      useSyncStore.getState().addEvent({
        type: 'bookmark_toggled',
        payload: { questionId: question.id, question, isBookmarked: true }
      });`
);
fs.writeFileSync(bmFile, bmCode);


// Patch Synonym Progress Store to use Sync Queue
let synFile = 'src/features/synonyms/hooks/useSynonymProgress.ts';
if (fs.existsSync(synFile)) {
  let synCode = fs.readFileSync(synFile, 'utf8');
  synCode = synCode.replace(
    /import \{ db \} from '\.\.\/\.\.\/\.\.\/lib\/db';/,
    `import { db } from '../../../lib/db';\nimport { useSyncStore } from '../../quiz/stores/useSyncStore';`
  );

  const interactionBlock = `      await db.saveSynonymInteraction(interaction);`;
  const newInteractionBlock = `      await db.saveSynonymInteraction(interaction);

      useSyncStore.getState().addEvent({
        type: 'flashcard_reviewed',
        payload: interaction
      });`;

  synCode = synCode.replace(interactionBlock, newInteractionBlock);
  fs.writeFileSync(synFile, synCode);
}
