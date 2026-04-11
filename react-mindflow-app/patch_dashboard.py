import re

with open('src/features/quiz/components/Dashboard.tsx', 'r') as f:
    content = f.read()

# Fix the broken patch
content = content.replace("""                    </motion.div>

                    {/* Card card-3 */}
                    <motion.div
                        variants={itemVariants}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}

                    {/* Card Blueprints */}
                    <motion.div""", """                    </motion.div>

                    {/* Card Blueprints */}
                    <motion.div""")

content = content.replace("""                    </motion.div>

                    {/* Card card-3 */}
                    onClick={() => handleNavigation('card-3', onEnglish)}
                        className="relative group cursor-pointer aspect-square rounded-[32px] sm:rounded-[40px] p-[1px] overflow-hidden"
                    >""", """                    </motion.div>

                    {/* Card card-3 */}
                    <motion.div
                        variants={itemVariants}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleNavigation('card-3', onEnglish)}
                        className="relative group cursor-pointer aspect-square rounded-[32px] sm:rounded-[40px] p-[1px] overflow-hidden"
                    >""")

with open('src/features/quiz/components/Dashboard.tsx', 'w') as f:
    f.write(content)
