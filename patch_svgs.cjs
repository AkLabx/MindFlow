const fs = require('fs');

const path = 'src/features/quiz/components/DashboardSVGs.tsx';
let content = fs.readFileSync(path, 'utf8');

const newSVGs = `
// MCQs Quiz (Fuchsia)
export const McqsQuizSVG = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg" style={{ perspective: '800px' }}>
    <defs>
      <linearGradient id="mcqsGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#E879F9" />
        <stop offset="100%" stopColor="#C026D3" />
      </linearGradient>
    </defs>
    {/* Animated checkmarks representing MCQs */}
    {[
      { x: 30, y: 30, delay: 0 },
      { x: 30, y: 50, delay: 0.3 },
      { x: 30, y: 70, delay: 0.6 },
    ].map((item, i) => (
      <motion.g key={i} initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0] }} transition={{ duration: 3, repeat: Infinity, delay: item.delay }}>
        <rect x={item.x} y={item.y - 8} width="40" height="16" rx="8" fill="url(#mcqsGrad)" opacity="0.3" />
        <circle cx={item.x + 8} cy={item.y} r="4" fill="#F0ABFC" />
        <path d={\`M \${item.x + 18} \${item.y} L \${item.x + 22} \${item.y + 4} L \${item.x + 30} \${item.y - 4}\`} fill="none" stroke="#FDF4FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </motion.g>
    ))}

    {/* Floating elements */}
    <motion.circle cx="75" cy="25" r="8" fill="url(#mcqsGrad)" animate={{ y: [0, -5, 0], scale: [1, 1.1, 1] }} transition={{ duration: 4, repeat: Infinity }} />
    <motion.rect x="15" y="80" width="10" height="10" rx="2" fill="url(#mcqsGrad)" opacity="0.8" animate={{ rotate: [0, 90, 180, 270, 360] }} transition={{ duration: 6, repeat: Infinity, ease: "linear" }} />
  </svg>
);

// Attempted Quizzes (Amber)
export const AttemptedQuizzesSVG = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
    <defs>
      <linearGradient id="attemptedGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FBBF24" />
        <stop offset="100%" stopColor="#D97706" />
      </linearGradient>
    </defs>
    {/* Base Document */}
    <motion.path
      d="M30 20 h30 a10 10 0 0 1 10 10 v40 a10 10 0 0 1 -10 10 h-40 a10 10 0 0 1 -10 -10 v-30 l20 -20 z"
      fill="url(#attemptedGrad)" opacity="0.8"
      animate={{ y: [0, -5, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
    />
    {/* Folded Corner */}
    <path d="M30 20 v20 h-20 l20 -20 z" fill="#FDE68A" opacity="0.5" />

    {/* Progress Checkmarks */}
    {[
      { d: "M35 45 l5 5 l15 -15", delay: 0 },
      { d: "M35 60 l5 5 l15 -15", delay: 0.5 },
      { d: "M35 75 l5 5 l15 -15", delay: 1.0 },
    ].map((mark, i) => (
      <motion.path
        key={i}
        d={mark.d}
        fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.5, repeat: Infinity, delay: mark.delay, repeatType: "reverse" }}
      />
    ))}
    {/* Score badge */}
    <motion.g animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>
      <circle cx="75" cy="75" r="15" fill="#B45309" />
      <text x="75" y="80" fill="white" fontSize="12" fontWeight="bold" textAnchor="middle">A+</text>
    </motion.g>
  </svg>
);
`;

content += '\n' + newSVGs;
fs.writeFileSync(path, content);
console.log('Done adding SVGs!');
