import re

with open('src/features/quiz/components/Dashboard.tsx', 'r') as f:
    content = f.read()

# 1. Add DownloadSVG to imports
content = content.replace(
    "import { CreateQuizSVG, SavedQuizzesSVG, EnglishZoneSVG, ToolsSVG, AnalyticsSVG, BookmarksSVG, AboutSVG } from './DashboardSVGs';",
    "import { CreateQuizSVG, SavedQuizzesSVG, EnglishZoneSVG, ToolsSVG, AnalyticsSVG, BookmarksSVG, AboutSVG, DownloadSVG } from './DashboardSVGs';"
)

# 2. Add useNotificationStore to imports
if "useNotificationStore" not in content:
    content = content.replace(
        "import { Loader2 } from 'lucide-react';",
        "import { Loader2 } from 'lucide-react';\nimport { useNotification } from '../../../stores/useNotificationStore';"
    )

# 3. Initialize useNotification hook inside Dashboard
content = content.replace(
    "const { user } = useAuth();",
    "const { user } = useAuth();\n    const { showToast } = useNotification();"
)

# 4. Create the handleDownload click handler
content = content.replace(
    "const getGreeting = () => {",
    "const handleDownloadClick = () => {\n        window.open('https://drive.google.com/drive/folders/1Owy8_qnvMOTw5WLRGLQajCiScN-dOHtF', '_blank');\n        showToast({\n            message: 'Your download page has been opened in next tab go and see',\n            variant: 'info',\n            duration: 3000\n        });\n    };\n\n    const getGreeting = () => {"
)

# 5. Insert the new Download Card right before the About Us card
download_card = """
                    {/* Card card-download */}
                    <motion.div
                        variants={itemVariants}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleNavigation('card-download', handleDownloadClick)}
                        className="relative group cursor-pointer aspect-square rounded-[32px] sm:rounded-[40px] p-[1px] overflow-hidden"
                    >
                        {/* Glow Background Layer */}
                        <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl transition-colors duration-300 z-0"></div>
                        <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-white/10 dark:from-white/10 dark:to-transparent z-0"></div>

                        {/* Interactive Inner Shadow / Border */}
                        <div className="absolute inset-0 rounded-[32px] sm:rounded-[40px] border border-white/60 dark:border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] z-10 transition-all duration-300 group-active:border-b-0 border-b-[4px] border-b-cyan-200/50 dark:border-b-cyan-700/50 group-hover:border-cyan-300 dark:group-hover:border-cyan-500"></div>

                        {/* Centered Subtle Glow */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full rounded-full blur-[60px] opacity-40 group-hover:opacity-60 transition-opacity duration-500 z-0 bg-cyan-500"></div>

                        {loadingId === 'card-download' ? (
                            <div className="absolute inset-0 flex items-center justify-center z-20 bg-white/20 dark:bg-black/20 backdrop-blur-sm rounded-[32px] sm:rounded-[40px]">
                                <Loader2 className="w-8 h-8 text-cyan-500 animate-spin drop-shadow-md" />
                            </div>
                        ) : null}

                        <div className={`relative z-20 flex flex-col items-center justify-between h-full w-full p-4 sm:p-6 transition-opacity duration-300 ${loadingId === 'card-download' ? 'opacity-0' : 'opacity-100'}`}>

                            {/* SVG Container */}
                            <motion.div
                                className="w-16 h-16 sm:w-24 sm:h-24 md:w-28 md:h-28 mt-2 relative drop-shadow-xl"
                                initial={{ scale: 0.9, opacity: 0.8 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                            >
                                <DownloadSVG />
                            </motion.div>

                            {/* Text Area */}
                            <div className="flex flex-col items-center justify-end w-full text-center pb-2">
                                <h3 className="text-sm sm:text-lg font-black leading-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-600 to-cyan-900 dark:from-cyan-300 dark:to-cyan-100 mb-1 sm:mb-2">Download</h3>
                                <p className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs font-semibold leading-tight line-clamp-2 max-w-[90%]">
                                    Get study materials & PDFs.
                                </p>
                            </div>
                        </div>
                    </motion.div>

"""

content = content.replace(
    "                    {/* Card card-7 */}",
    download_card + "                    {/* Card card-7 */}"
)

with open('src/features/quiz/components/Dashboard.tsx', 'w') as f:
    f.write(content)

print("Dashboard updated successfully.")
