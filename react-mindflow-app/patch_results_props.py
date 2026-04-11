import re

files_to_patch = ['src/features/quiz/components/GodQuizResult.tsx', 'src/features/quiz/components/MockQuizResult.tsx']

for filepath in files_to_patch:
    with open(filepath, 'r') as f:
        content = f.read()

    # The existing code had:
    # <QuizReview
    #     questions={questions}
    #     answers={answers}
    #     bookmarks={bookmarks}
    #     onToggleBookmark={() => {}}
    # />

    # We need to change it to match the actual QuizReviewProps:
    # userAnswers={answers}
    # bookmarkedQuestions={bookmarks}
    # onBackToScore={() => setActiveTab('overview')}
    # onGoHome={onGoHome || (() => {})}

    old_review = """<QuizReview
                    questions={questions}
                    answers={answers}
                    bookmarks={bookmarks}
                    onToggleBookmark={() => {}} // Read-only in Result
                />"""

    old_review_mock = """<QuizReview
                 questions={questions}
                 answers={answers}
                 bookmarks={bookmarks}
                 onToggleBookmark={() => {}} // Read-only in Result
             />"""

    new_review = """<QuizReview
                    questions={questions}
                    userAnswers={answers}
                    timeTaken={timeTaken}
                    bookmarkedQuestions={bookmarks}
                    onBackToScore={() => setActiveTab('overview')}
                    onGoHome={onGoHome || (() => {})}
                />"""

    content = content.replace(old_review, new_review)
    content = content.replace(old_review_mock, new_review)

    with open(filepath, 'w') as f:
        f.write(content)
