const fs = require('fs');
let content = fs.readFileSync('src/features/quiz/components/QuizConfig.tsx', 'utf8');

// The error on 430 is `src/features/quiz/components/QuizConfig.tsx(430,9): error TS1005: ')' expected.`
// At line 428 there is `</div>`.
// My replacement added `</div>\n        )}\n\n        {/* Sticky Footer Bar */}`
// But the div I was closing wasn't the grid.

content = content.replace(
  `</div>\n        )}\n\n        {/* Sticky Footer Bar */}`,
  `</div>\n        {/* Sticky Footer Bar */}`
);

// At line 528: `)}`
// I'll just remove it and replace the whole block carefully.
// Wait, actually `mode === 'god'` opened a `{mode === 'god' ? ( ... ) : ( <div className="grid ..."> ... </div></div> )}`
// I need to close the `)` for the ternary.

content = content.replace(
  `        {mode === 'god' ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <ExamBlueprintsHub onBack={onBack} onLaunchBlueprint={(bp) => navigate(\`/blueprints/preview/\${bp.id}\`)} />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">`,
  `        {mode === 'god' ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <ExamBlueprintsHub onBack={onBack} onLaunchBlueprint={(bp) => navigate(\`/blueprints/preview/\${bp.id}\`)} />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">`
);

// Close the ternary BEFORE the Sticky Footer.
content = content.replace(
  `          </Accordion>
        </div>
        {/* Sticky Footer Bar */}`,
  `          </Accordion>
        </div>
        )}
        {/* Sticky Footer Bar */}`
);

// Clean up the duplicate )} at the end
content = content.replace(
  `          </div>
        </div>
        )}
      </div>
    </div>`,
  `          </div>
        </div>
      </div>
    </div>`
);

// Fix the footer wrapping
content = content.replace(
  `{mode !== 'god' && (
        <div className="fixed bottom-[80px]`,
  `{mode !== 'god' && (
        <div className="fixed bottom-[80px]`
);

content = content.replace(
  `            </div>
          </div>
        </div>
      </div>
    </div>`,
  `            </div>
          </div>
        </div>
        )}
      </div>
    </div>`
);

fs.writeFileSync('src/features/quiz/components/QuizConfig.tsx', content);
