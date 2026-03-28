const fs = require('fs');

const data = fs.readFileSync('src/features/school/components/SchoolOnboarding.tsx', 'utf8');

let updated = data.replace(
  "import { BookOpen, GraduationCap, ChevronRight, Calculator, FlaskConical, PlayCircle, Trophy, CheckCircle2 } from 'lucide-react';",
  "import { BookOpen, GraduationCap, ChevronRight, Calculator, FlaskConical, PlayCircle, Trophy, CheckCircle2 } from 'lucide-react';\nimport { useAuth } from '../../auth/context/AuthContext';\nimport { supabase } from '../../../lib/supabase';\nimport { SchoolAuth } from './SchoolAuth';"
);

updated = updated.replace(
  "import React, { useState } from 'react';",
  "import React, { useState, useEffect } from 'react';"
);

updated = updated.replace(
  "const [selectedClass, setSelectedClass] = useState<string | null>(null);",
  "const [selectedClass, setSelectedClass] = useState<string | null>(null);\n  const { user } = useAuth();"
);

updated = updated.replace(
  "const { setSchoolBoard, setSchoolClass, setSchoolOnboardingSeen } = useSettingsStore();\n\n  const handleNext = () => {\n    if (currentSlide < slides.length) {\n      setCurrentSlide(currentSlide + 1);\n    }\n  };",
  "const { setSchoolBoard, setSchoolClass, setSchoolOnboardingSeen } = useSettingsStore();\n\n  useEffect(() => {\n    if (user && currentSlide < 4) {\n      setCurrentSlide(4);\n    }\n  }, [user, currentSlide]);\n\n  const handleNext = () => {\n    if (currentSlide === 2) {\n      setCurrentSlide(user ? 4 : 3);\n    } else if (currentSlide < 4) {\n      setCurrentSlide(currentSlide + 1);\n    }\n  };"
);

updated = updated.replace(
  "const handleFinish = () => {\n    if (selectedBoard && selectedClass) {\n      setSchoolBoard(selectedBoard);\n      setSchoolClass(selectedClass);\n      setSchoolOnboardingSeen(true);\n      onComplete();\n    }\n  };",
  "const handleFinish = async () => {\n    if (selectedBoard && selectedClass) {\n      setSchoolBoard(selectedBoard);\n      setSchoolClass(selectedClass);\n      setSchoolOnboardingSeen(true);\n      if (user) {\n         await supabase.auth.updateUser({ data: { school_board: selectedBoard, school_class: selectedClass } });\n      }\n      onComplete();\n    }\n  };\n\n  const totalDots = 4;"
);

updated = updated.replace(
  "{/* Progress Dots */}\n      <div className=\"absolute top-8 left-0 right-0 flex justify-center gap-2 z-10\">\n        {[...Array(slides.length + 1)].map((_, i) => (\n          <div\n            key={i}\n            className={`h-2 rounded-full transition-all duration-300 ${\n              i === currentSlide\n                ? 'w-8 bg-emerald-500'\n                : i < currentSlide\n                  ? 'w-2 bg-emerald-500/50'\n                  : 'w-2 bg-slate-300 dark:bg-slate-700'\n            }`}\n          />\n        ))}\n      </div>",
  "{/* Progress Dots */}\n      {(currentSlide < 3 || currentSlide === 4) && (\n        <div className=\"absolute top-8 left-0 right-0 flex justify-center gap-2 z-10\">\n          {[...Array(totalDots)].map((_, i) => {\n            const activeIndex = currentSlide === 4 ? 3 : currentSlide;\n            return (\n              <div\n                key={i}\n                className={`h-2 rounded-full transition-all duration-300 ${\n                  i === activeIndex\n                    ? 'w-8 bg-emerald-500'\n                    : i < activeIndex\n                      ? 'w-2 bg-emerald-500/50'\n                      : 'w-2 bg-slate-300 dark:bg-slate-700'\n                }`}\n              />\n            );\n          })}\n        </div>\n      )}"
);

updated = updated.replace(
  "</motion.div>\n          ) : (\n            <motion.div\n              key=\"setup\"",
  "</motion.div>\n          ) : currentSlide === 3 && !user ? (\n            <motion.div\n               key=\"auth\"\n               initial={{ opacity: 0, scale: 0.95 }}\n               animate={{ opacity: 1, scale: 1 }}\n               className=\"flex flex-col w-full h-full justify-center\"\n            >\n               <SchoolAuth onAuthSuccess={() => setCurrentSlide(4)} />\n            </motion.div>\n          ) : (\n            <motion.div\n              key=\"setup\""
);


updated = updated.replace(
  "{currentSlide < slides.length ? (\n          <button\n            onClick={handleNext}\n            className=\"w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-lg shadow-lg shadow-emerald-500/30 transition-transform active:scale-95 flex items-center justify-center gap-2\"\n          >\n            Continue <ChevronRight className=\"w-5 h-5\" />\n          </button>\n        ) : (\n          <button",
  "{currentSlide < 3 ? (\n          <button\n            onClick={handleNext}\n            className=\"w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-lg shadow-lg shadow-emerald-500/30 transition-transform active:scale-95 flex items-center justify-center gap-2\"\n          >\n            Continue <ChevronRight className=\"w-5 h-5\" />\n          </button>\n        ) : currentSlide === 4 ? (\n          <button"
);

updated = updated.replace(
  "Start Learning <GraduationCap className=\"w-5 h-5\" />\n          </button>\n        )}\n      </div>",
  "Start Learning <GraduationCap className=\"w-5 h-5\" />\n          </button>\n        ) : (\n            <div className=\"h-[60px]\" />\n        )}\n      </div>"
);


fs.writeFileSync('src/features/school/components/SchoolOnboarding.tsx', updated);
console.log('done');
