const fs = require('fs');

let fileContent = fs.readFileSync('src/features/ows/utils/supabaseOws.ts', 'utf8');

const oldSieve = `        parsedData = parsedData.filter(card => {
             const userState = interactMap.get(card.id);

             // Strip out mastered cards permanently
             if (userState?.status === 'mastered') return false;

             if (mode === 'All Unseen') {
                 return !userState; // Only cards never interacted with
             } else if (mode === 'Due for Review') {
                 if (!userState || !userState.next_review_at) return false;
                 return new Date(userState.next_review_at).getTime() <= now;
             } else if (mode === 'Mix') {
                 // Unseen OR Due
                 if (!userState) return true;
                 if (userState.next_review_at && new Date(userState.next_review_at).getTime() <= now) return true;
                 return false;
             }
             return true;
        });

        // Sort mix: Put "due" ones before "unseen" ones
        if (mode === 'Mix') {
             parsedData.sort((a, b) => {
                 const aDue = interactMap.has(a.id) ? 1 : 0;
                 const bDue = interactMap.has(b.id) ? 1 : 0;
                 return bDue - aDue; // Due ones first
             });
        }`;

const newSieve = `        parsedData = parsedData.filter(card => {
             const userState = interactMap.get(card.id);

             if (mode === 'Unseen') {
                 return !userState || !userState.status; // Only cards never interacted with
             } else if (mode === 'Mastered') {
                 return userState?.status === 'mastered';
             } else if (mode === 'Review') {
                 return userState?.status === 'review';
             } else if (mode === 'Clueless') {
                 return userState?.status === 'clueless';
             } else if (mode === 'Tricky') {
                 return userState?.status === 'tricky';
             }
<<<<<<< HEAD

=======

>>>>>>> origin/main
             return true;
        });`;

if (fileContent.includes(oldSieve)) {
    fileContent = fileContent.replace(oldSieve, newSieve);
    fs.writeFileSync('src/features/ows/utils/supabaseOws.ts', fileContent, 'utf8');
    console.log("Updated supabaseOws.ts successfully!");
} else {
    console.error("Could not find old logic in supabaseOws.ts!");
}
