with open("src/features/ows/components/OWSSession.tsx", "r") as f:
    content = f.read()

# Add Ghost Tutorial and UI variables
ghost_logic = """
  const [hasSeenTutorial, setHasSeenTutorial] = useState(true);

  useEffect(() => {
     const seen = localStorage.getItem('has_seen_swipe_tutorial');
     if (!seen) setHasSeenTutorial(false);
  }, []);

  const dismissTutorial = () => {
     setHasSeenTutorial(true);
     localStorage.setItem('has_seen_swipe_tutorial', 'true');
  };
"""

import re
content = re.sub(r'  const \[isFullScreen, setIsFullScreen\] = useState\(false\);', ghost_logic + '\n  const [isFullScreen, setIsFullScreen] = useState(false);', content)

ghost_ui = """
              {/* Ghost Tutorial */}
              {!hasSeenTutorial && (
                 <motion.div
                   className="absolute inset-0 z-50 rounded-3xl bg-teal-900/40 backdrop-blur-sm flex flex-col items-center justify-center p-6 border-2 border-teal-400 border-dashed"
                   animate={{
                       y: [0, -30, 0, 30, 0],
                       x: [0, 0, -30, 0, 30, 0]
                   }}
                   transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                   onClick={(e) => { e.stopPropagation(); dismissTutorial(); }}
                 >
                     <div className="absolute top-4 font-black text-green-300 text-xl tracking-widest uppercase">⬆️ Mastered</div>
                     <div className="absolute bottom-4 font-black text-red-300 text-xl tracking-widest uppercase">⬇️ Clueless</div>
                     <div className="absolute left-[-20px] font-black text-orange-300 text-xl tracking-widest uppercase -rotate-90">⬅️ Review</div>
                     <div className="absolute right-[-20px] font-black text-blue-300 text-xl tracking-widest uppercase rotate-90">➡️ Tricky</div>

                     <div className="bg-white text-teal-900 p-4 rounded-xl shadow-2xl font-bold text-center mt-12 animate-pulse">
                        Tap here or Swipe card to Start
                     </div>
                 </motion.div>
              )}
"""

content = re.sub(r'\{/\* Overlays \*/\}', ghost_ui + '\n              {/* Overlays */}', content)

with open("src/features/ows/components/OWSSession.tsx", "w") as f:
    f.write(content)
