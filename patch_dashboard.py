import re

with open('src/features/quiz/components/Dashboard.tsx', 'r') as f:
    content = f.read()

# Replace the Hero Section wrapper
# Original:
# <div className="flex-1 flex flex-col items-center justify-center space-y-10 py-6 relative z-10 animate-fade-in">
#                {/* Hero Section */}
#                <div className="relative text-center max-w-4xl mx-auto mt-6">
#                    <h1 className="text-4xl sm:text-6xl font-black text-gray-900 dark:text-white leading-tight mb-4 drop-shadow-sm">
#                        Dashboard
#                    </h1>
#
#                    <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-md mx-auto leading-relaxed font-medium">
#                        {getGreeting()}, {user?.user_metadata?.first_name || user?.user_metadata?.full_name?.split(' ')[0] || 'buddy'}!
#                    </p>
#                </div>
#
#                {/* Cards Grid */}
#                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">

new_hero = """<div className="flex-1 flex flex-col space-y-6 py-4 relative z-10 animate-fade-in w-full">
                {/* Hero Section */}
                <div className="relative text-left w-full mt-2">
                    <h1 className="text-3xl sm:text-5xl font-black text-gray-900 dark:text-white leading-tight mb-1 drop-shadow-sm">
                        Dashboard
                    </h1>

                    <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 mb-2 leading-relaxed font-medium">
                        {getGreeting()}, {user?.user_metadata?.first_name || user?.user_metadata?.full_name?.split(' ')[0] || 'buddy'}!
                    </p>
                </div>

                {/* Cards Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">"""

content = re.sub(
    r'<div className="flex-1 flex flex-col items-center justify-center space-y-10 py-6 relative z-10 animate-fade-in">.*?<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">',
    new_hero,
    content,
    flags=re.DOTALL
)

with open('src/features/quiz/components/Dashboard.tsx', 'w') as f:
    f.write(content)
