const fs = require('fs');

const path = 'src/features/quiz/components/SavedQuizzes.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Back to Home Button
content = content.replace(
    '<Home className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />',
    '<motion.div whileHover={{ x: -2, scale: 1.1 }} transition={{ type: "spring", stiffness: 300 }}><Home className="w-4 h-4" /></motion.div>'
);

// 2. View Attempted Quizzes
content = content.replace(
    '<CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />',
    '<motion.div whileHover={{ scale: 1.2, rotate: 15 }} transition={{ type: "spring", stiffness: 300 }}><CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /></motion.div>'
);

// 3. Talk (Mic) button
content = content.replace(
    '<Mic className="w-4 h-4" />',
    '<motion.div whileHover={{ scale: 1.2, y: -2 }} transition={{ type: "spring", stiffness: 300, repeat: Infinity, repeatType: "reverse" }}><Mic className="w-4 h-4" /></motion.div>'
);

// 4. Play (Start/Resume) button
content = content.replace(
    '<Play className="w-4 h-4" />',
    '<motion.div whileHover={{ scale: 1.2, x: 2 }} transition={{ type: "spring", stiffness: 300 }}><Play className="w-4 h-4" /></motion.div>'
);

// 5. Trash2 (Delete) button
content = content.replace(
    '<Trash2 className="w-5 h-5" />',
    '<motion.div whileHover={{ scale: 1.1, rotate: [0, -10, 10, -10, 10, 0] }} transition={{ duration: 0.4 }}><Trash2 className="w-5 h-5" /></motion.div>'
);

// 6. PlusCircle (Empty state)
content = content.replace(
    '<PlusCircle className="w-5 h-5 text-indigo-50 group-hover/btn:scale-110 transition-transform" />',
    '<motion.div whileHover={{ scale: 1.2, rotate: 90 }} transition={{ type: "spring", stiffness: 200 }}><PlusCircle className="w-5 h-5 text-indigo-50" /></motion.div>'
);

fs.writeFileSync(path, content, 'utf8');
