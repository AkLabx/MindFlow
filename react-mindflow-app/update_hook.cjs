const fs = require('fs');

let fileContent = fs.readFileSync('src/features/ows/hooks/useOwsFilterCounts.ts', 'utf8');

const oldLogic = `            // Calculate Deck Mode dynamically
            let itemDeckModes: string[] = [];
            if (item.status === 'mastered') {
                itemDeckModes = []; // Completely ignore mastered cards
            } else if (!item.status) {
                itemDeckModes = ['All Unseen', 'Mix'];
            } else if (item.next_review_at && new Date(item.next_review_at).getTime() <= now) {
                itemDeckModes = ['Due for Review', 'Mix'];
            }`;

const newLogic = `            // Calculate Deck Mode dynamically
            let itemDeckModes: string[] = [];
            if (!item.status) {
                itemDeckModes = ['Unseen'];
            } else if (item.status === 'mastered') {
                itemDeckModes = ['Mastered'];
            } else if (item.status === 'review') {
                itemDeckModes = ['Review'];
            } else if (item.status === 'clueless') {
                itemDeckModes = ['Clueless'];
            } else if (item.status === 'tricky') {
                itemDeckModes = ['Tricky'];
            }`;

if (fileContent.includes(oldLogic)) {
    fileContent = fileContent.replace(oldLogic, newLogic);
    fs.writeFileSync('src/features/ows/hooks/useOwsFilterCounts.ts', fileContent, 'utf8');
    console.log("Updated useOwsFilterCounts.ts successfully!");
} else {
    console.error("Could not find old logic in useOwsFilterCounts.ts!");
}
