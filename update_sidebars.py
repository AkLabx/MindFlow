import re

with open('src/features/ai/chat/AIChatPage.tsx', 'r') as f:
    content = f.read()

# Replace left sidebar and overlay
old_left_sidebar = """            {/* Sidebar (Desktop & Mobile Slide-in) */}
            <div className={cn(
                "fixed inset-y-0 left-0 z-50 w-72 transform bg-gray-50 dark:bg-slate-900 border-r border-gray-200 dark:border-gray-800 transition-transform duration-300 ease-in-out md:relative md:translate-x-0 flex flex-col",
                isSidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>"""

new_left_sidebar = """            {/* Sidebar (Desktop & Mobile Slide-in) */}
            <motion.div
                initial={false}
                animate={{ x: isSidebarOpen ? 0 : "-100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className={cn(
                    "fixed inset-y-0 left-0 z-50 w-72 bg-gray-50 dark:bg-slate-900 border-r border-gray-200 dark:border-gray-800 flex flex-col shadow-xl md:shadow-none",
                    "md:relative md:translate-x-0 md:!transform-none"
                )}
            >"""

content = content.replace(old_left_sidebar, new_left_sidebar)

# Close motion.div for left sidebar instead of regular div
left_close_pattern = r"""                        </div>
                    \)}
                    </div>
                </div>
            </div>"""

left_close_replacement = r"""                        </div>
                    )}
                    </div>
                </div>
            </motion.div>"""

content = re.sub(left_close_pattern, left_close_replacement, content)

# Left overlay
old_left_overlay = """            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 md:hidden transition-opacity"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}"""

new_left_overlay = """            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-40 bg-black/50 md:hidden backdrop-blur-sm"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}
            </AnimatePresence>"""

content = content.replace(old_left_overlay, new_left_overlay)


# Right sidebar
old_right_sidebar = """            {/* Settings Right Sidebar */}
            <div className={cn(
                "fixed inset-y-0 right-0 z-[60] w-72 transform bg-white dark:bg-slate-900 border-l border-gray-200 dark:border-gray-800 transition-transform duration-300 ease-in-out flex flex-col shadow-xl",
                isSettingsOpen ? "translate-x-0" : "translate-x-full"
            )}>"""

new_right_sidebar = """            {/* Settings Right Sidebar */}
            <AnimatePresence>
                {isSettingsOpen && (
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed inset-y-0 right-0 z-[60] w-72 bg-white dark:bg-slate-900 border-l border-gray-200 dark:border-gray-800 flex flex-col shadow-2xl"
                    >"""

content = content.replace(old_right_sidebar, new_right_sidebar)

# Close motion.div and animate presence for right sidebar
right_close_pattern = r"""                    </div>
                </div>
            </div>"""

right_close_replacement = r"""                    </div>
                </div>
                    </motion.div>
                )}
            </AnimatePresence>"""

# Using replace to be safe. Only the last occurrence!
idx = content.rfind(right_close_pattern)
if idx != -1:
    content = content[:idx] + right_close_replacement + content[idx+len(right_close_pattern):]


# Right overlay
old_right_overlay = """            {/* Settings Overlay */}
            {isSettingsOpen && (
                <div
                    className="fixed inset-0 z-50 bg-black/50 transition-opacity"
                    onClick={() => setIsSettingsOpen(false)}
                />
            )}"""

new_right_overlay = """            {/* Settings Overlay */}
            <AnimatePresence>
                {isSettingsOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[55] bg-black/50 backdrop-blur-sm"
                        onClick={() => setIsSettingsOpen(false)}
                    />
                )}
            </AnimatePresence>"""

content = content.replace(old_right_overlay, new_right_overlay)


with open('src/features/ai/chat/AIChatPage.tsx', 'w') as f:
    f.write(content)
