import re

with open('src/features/dashboard/components/subject/TopicCard.tsx', 'r') as f:
    content = f.read()

# Update the subtopic button rendering to fix the layout:
# - Left section: subtopic name (flex-grow, wrap, break-words)
# - Right section: 14Q pill, StatusBadge, Chevron (shrink-0, flex gap-3 items-center)
# Remove truncate on subtopic name
# Change 0 Questions to 0Q
# Move StatusBadge to right side

replacement = """              <button
                key={sub}
                onClick={(e) => onSubTopicClick?.(sub, e)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-slate-900/20 dark:border-slate-100/20 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:border-indigo-600/30 dark:hover:border-indigo-400/30 hover:shadow-sm transition-all text-left min-h-[52px]"
              >
                <span className="text-sm font-semibold break-words whitespace-normal flex-grow min-w-0">{sub}</span>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 px-2 py-1 rounded-full min-w-[36px] text-center">
                    {!hasCount ? (
                      <span className="inline-flex gap-1 justify-center">
                        <span className="animate-bounce" style={{ animationDelay: "0ms" }}>.</span>
                        <span className="animate-bounce" style={{ animationDelay: "150ms" }}>.</span>
                        <span className="animate-bounce" style={{ animationDelay: "300ms" }}>.</span>
                      </span>
                    ) : countVal! > 0 ? (
                      <AnimatedCount target={countVal!} />
                    ) : (
                      <span>0Q</span>
                    )}
                  </span>

                  {status && <StatusBadge status={status} />}

                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
                </div>
              </button>"""

content = re.sub(
    r'<button\s+key=\{sub\}.*?</button>',
    replacement,
    content,
    flags=re.DOTALL
)

with open('src/features/dashboard/components/subject/TopicCard.tsx', 'w') as f:
    f.write(content)
