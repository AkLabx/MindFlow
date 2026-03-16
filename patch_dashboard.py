import re

with open('src/features/quiz/components/Dashboard.tsx', 'r') as f:
    content = f.read()

# Add useAuth import
content = content.replace(
    "import { useNavigate } from 'react-router-dom';",
    "import { useNavigate } from 'react-router-dom';\nimport { useAuth } from '../../auth/context/AuthContext';"
)

# Add useAuth hook inside Dashboard
content = content.replace(
    "const { loadingId, handleNavigation } = useNavSpinner();",
    "const { loadingId, handleNavigation } = useNavSpinner();\n    const { user } = useAuth();"
)

# Helper function for getting the time-based greeting
greeting_logic = """
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };
"""

content = content.replace(
    "const { user } = useAuth();",
    "const { user } = useAuth();\n" + greeting_logic
)

# Replace the heading and remove the button
hero_section_search = """                {/* Hero Section */}
                <div className="relative text-center max-w-4xl mx-auto mt-6">
                    <h1 className="text-4xl sm:text-6xl font-black text-gray-900 dark:text-white leading-tight mb-4 drop-shadow-sm">
                        Master Your <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-500">
                            Knowledge.
                        </span>
                    </h1>

                    <p className="text-base text-gray-600 dark:text-gray-300 mb-8 max-w-md mx-auto leading-relaxed font-medium">
                        Adaptive quizzes, detailed analytics, and instant feedback to help you learn faster.
                    </p>

                    <div className="flex items-center justify-center gap-3 relative z-20">
                        <Button
                            size="lg"
                            onClick={() => handleNavigation('create-btn', onStartQuiz)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl shadow-xl shadow-indigo-200 transition-all transform active:scale-95 relative"
                        >
                            {loadingId === 'create-btn' ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                "Create Quiz"
                            )}
                        </Button>
                    </div>
                </div>"""

hero_section_replace = """                {/* Hero Section */}
                <div className="relative text-center max-w-4xl mx-auto mt-6">
                    <h1 className="text-4xl sm:text-6xl font-black text-gray-900 dark:text-white leading-tight mb-4 drop-shadow-sm">
                        Dashboard
                    </h1>

                    <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-md mx-auto leading-relaxed font-medium">
                        {getGreeting()}, {user?.user_metadata?.first_name || user?.user_metadata?.full_name?.split(' ')[0] || 'buddy'}!
                    </p>
                </div>"""

content = content.replace(hero_section_search, hero_section_replace)

with open('src/features/quiz/components/Dashboard.tsx', 'w') as f:
    f.write(content)
