import re

with open('src/features/dashboard/components/subject/TopicCard.tsx', 'r') as f:
    content = f.read()

# Update AnimatedCount
new_animated_count = """const AnimatedCount: React.FC<{ target: number }> = ({ target }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 800; // ms
    const incrementTime = 30; // ms
    const steps = duration / incrementTime;
    const increment = Math.max(1, Math.floor(target / steps));

    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, incrementTime);

    return () => clearInterval(timer);
  }, [target]);

  return <span>{count}Q</span>;
};"""

content = re.sub(
    r'const AnimatedCount: React\.FC<\{ target: number \}> = \(\{ target \}\) => \{.*?\s+return <span>\{count\} Questions</span>;\n\};',
    new_animated_count,
    content,
    flags=re.DOTALL
)

# Update StatusBadge
new_status_badge = """const StatusBadge: React.FC<{ status?: QuizProgressStatus }> = ({ status }) => {
  const baseClasses = "flex items-center justify-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider min-w-[90px] text-center";

  if (!status || status === "NOT_STARTED") {
    return (
      <span className={`${baseClasses} bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400`}>
        <PlayCircle className="w-3 h-3" />
        Start
      </span>
    );
  }

  if (status === "IN_PROGRESS") {
    return (
      <span className={`${baseClasses} bg-amber-50 text-amber-600 border border-amber-200/50 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20`}>
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
        Resume
      </span>
    );
  }

  if (status === "COMPLETED") {
    return (
      <span className={`${baseClasses} bg-emerald-50 text-emerald-600 border border-emerald-200/50 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20`}>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
        Completed
      </span>
    );
  }

  return null;
};"""

content = re.sub(
    r'const StatusBadge: React\.FC<\{ status\?: QuizProgressStatus \}> = \(\{ status \}\) => \{.*?\n\};',
    new_status_badge,
    content,
    flags=re.DOTALL
)

with open('src/features/dashboard/components/subject/TopicCard.tsx', 'w') as f:
    f.write(content)
