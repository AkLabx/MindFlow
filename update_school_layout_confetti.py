import re

with open("src/features/school/components/SchoolLayout.tsx", "r") as f:
    content = f.read()

import_confetti = "import Confetti from 'react-confetti';\nimport { SchoolOnboarding } from './SchoolOnboarding';"
content = content.replace("import { SchoolOnboarding } from './SchoolOnboarding';", import_confetti)

state_confetti = """  const [showConfetti, setShowConfetti] = useState(false);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 5000); // Stop confetti after 5 seconds
  };

  if (showOnboarding) {
    return <SchoolOnboarding onComplete={handleOnboardingComplete} />;
  }"""

content = content.replace("""  if (showOnboarding) {
    return <SchoolOnboarding onComplete={() => setShowOnboarding(false)} />;
  }""", state_confetti)

jsx_confetti = """    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-outfit selection:bg-emerald-100 selection:text-emerald-900 transition-colors duration-300">
      {showConfetti && <Confetti width={window.innerWidth} height={window.innerHeight} recycle={false} numberOfPieces={500} />}
      """

content = content.replace("""    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-outfit selection:bg-emerald-100 selection:text-emerald-900 transition-colors duration-300">
      """, jsx_confetti)


with open("src/features/school/components/SchoolLayout.tsx", "w") as f:
    f.write(content)
