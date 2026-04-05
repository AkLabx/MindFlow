const fs = require('fs');

let content = fs.readFileSync('src/features/ows/components/OWSCard.tsx', 'utf8');

// 1. Add imports
content = content.replace(`import { BookOpen, Lightbulb, RotateCw, Target, Tag } from 'lucide-react';`, `import { BookOpen, Lightbulb, RotateCw, Target, Tag, CheckCircle2, Circle } from 'lucide-react';\nimport { useOWSProgress } from '../hooks/useOWSProgress';`);

// 2. Add hook usage
content = content.replace(`export const OWSCard: React.FC<OWSCardProps> = ({ data, serialNumber, isFlipped }) => {`, `export const OWSCard: React.FC<OWSCardProps> = ({ data, serialNumber, isFlipped }) => {
  const { getReadStatus, toggleReadStatus } = useOWSProgress();
  const isRead = getReadStatus(data);
`);

// 3. Add front face badge (optional but nice)
const frontBadge = `
            <div className="absolute top-4 left-4">
              {isRead && (
                <div className="flex items-center gap-1 text-teal-600 font-medium bg-teal-50 px-2 py-1 rounded-md text-xs shadow-sm">
                  <CheckCircle2 className="w-3 h-3" /> Read
                </div>
              )}
            </div>
`;
content = content.replace(`<div className="absolute top-4 right-4 text-teal-100">`, frontBadge + `\n          <div className="absolute top-4 right-4 text-teal-100">`);

// 4. Add action button to the back face header
const backActionButton = `
            <div className="flex items-center gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleReadStatus(data);
                }}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm active:scale-95",
                  isRead
                    ? "bg-teal-600 text-white hover:bg-teal-700 ring-2 ring-teal-200"
                    : "bg-white text-gray-500 hover:text-teal-600 hover:bg-teal-50 border border-gray-200"
                )}
              >
                {isRead ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
                {isRead ? 'Marked as Read' : 'Mark as Read'}
              </button>
              <div className="text-teal-400">
                <BookOpen className="w-5 h-5" />
              </div>
            </div>`;

content = content.replace(`<div className="text-teal-400">\n              <BookOpen className="w-5 h-5" />\n            </div>`, backActionButton);


fs.writeFileSync('src/features/ows/components/OWSCard.tsx', content, 'utf8');
