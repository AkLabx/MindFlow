import re

filepath = 'src/features/quiz/stores/useQuizSessionStore.ts'

with open(filepath, 'r') as f:
    content = f.read()

search_text = """  submitSessionResults: (results) => set((state) => ({
    answers: results.answers,
    timeTaken: results.timeTaken,
    score: results.score,
    bookmarks: results.bookmarks,
    status: 'result'
  })),"""

replace_text = """  submitSessionResults: (results) => set((state) => ({
    answers: results.answers,
    timeTaken: Object.keys(results.timeTaken).length > 0 ? results.timeTaken : state.timeTaken,
    score: results.score,
    bookmarks: results.bookmarks,
    status: 'result'
  })),"""

if search_text in content:
    content = content.replace(search_text, replace_text)

    with open(filepath, 'w') as f:
        f.write(content)
    print("Successfully patched useQuizSessionStore.ts")
else:
    print("Search text not found in useQuizSessionStore.ts. Showing surrounding text:")
    # Show what's actually there if search failed
    lines = content.split('\n')
    for i, line in enumerate(lines):
        if "submitSessionResults" in line:
            start = max(0, i - 2)
            end = min(len(lines), i + 7)
            print('\n'.join(lines[start:end]))
