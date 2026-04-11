const fs = require('fs');

let summaryContent = fs.readFileSync('src/features/flashcards/components/FlashcardSummary.tsx', 'utf8');

// Update Props
const oldPropsInterface = `  /** Callback to return to the dashboard. */
  onHome: () => void;
}`;

const newPropsInterface = `  /** Callback to return to the dashboard. */
  onHome: () => void;
  /** Custom text for the back button. */
  backText?: string;
}`;

summaryContent = summaryContent.replace(oldPropsInterface, newPropsInterface);

// Update Component Signature
const oldSignature = `export const FlashcardSummary: React.FC<FlashcardSummaryProps> = ({
  totalCards,
  filters,
  onRestart,
  onHome
}) => {`;

const newSignature = `export const FlashcardSummary: React.FC<FlashcardSummaryProps> = ({
  totalCards,
  filters,
  onRestart,
  onHome,
  backText = "Dashboard"
}) => {`;

summaryContent = summaryContent.replace(oldSignature, newSignature);

// Update Button Text
const oldButton = `<Home className="w-4 h-4 mr-2" /> Dashboard`;
const newButton = `<Home className="w-4 h-4 mr-2" /> {backText}`;

summaryContent = summaryContent.replace(oldButton, newButton);

fs.writeFileSync('src/features/flashcards/components/FlashcardSummary.tsx', summaryContent, 'utf8');
console.log("Updated FlashcardSummary.tsx successfully!");

// Update AppRoutes.tsx
let routesContent = fs.readFileSync('src/routes/AppRoutes.tsx', 'utf8');

const oldRoute = `                            onRestart={() => {
                                flashcardStore.resetSession();
                                const dest = flashcardStore.type === 'ows' ? '/ows/config' : flashcardStore.type === 'synonyms' ? '/synonyms/config' : '/idioms/config';
                                navTo(dest);
                            }}
                            onHome={navHome}`;

const newRoute = `                            onRestart={() => {
                                flashcardStore.resetSession();
                                const dest = flashcardStore.type === 'ows' ? '/ows/config' : flashcardStore.type === 'synonyms' ? '/synonyms/config' : '/idioms/config';
                                navTo(dest);
                            }}
                            onHome={() => {
                                const dest = flashcardStore.type === 'ows' ? '/ows/config' : flashcardStore.type === 'synonyms' ? '/synonyms/config' : '/idioms/config';
                                navTo(dest);
                            }}
                            backText={flashcardStore.type === 'ows' ? 'Back To OWS Config' : flashcardStore.type === 'synonyms' ? 'Back To Synonyms Config' : 'Back To Idioms Config'}`;

routesContent = routesContent.replace(oldRoute, newRoute);
fs.writeFileSync('src/routes/AppRoutes.tsx', routesContent, 'utf8');
console.log("Updated AppRoutes.tsx successfully!");
