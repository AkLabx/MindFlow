const fs = require('fs');

const file = 'src/features/tools/quiz-pdf-ppt-generator/QuizPdfPptGenerator.tsx';
const content = fs.readFileSync(file, 'utf8');

const targetStr = `              <Button
                size="lg"
                onClick={handleCreatePPT}`;

const newButton = `              <Button
                size="lg"
                onClick={handleCreateJSON}
                disabled={isGenerating}
                className="bg-emerald-600 hover:bg-emerald-700 text-white border-0 shadow-lg shadow-emerald-200 hover:shadow-xl hover:shadow-emerald-300 w-full sm:w-auto px-8 py-3 text-base flex items-center justify-center gap-2"
              >
                <FileJson className="w-5 h-5" />
                Create JSON ({filteredMetadata.length})
              </Button>

              <Button
                size="lg"
                onClick={handleCreatePPT}`;

const newContent = content.replace(targetStr, newButton);
fs.writeFileSync(file, newContent);
console.log("Patched UI successfully.");
