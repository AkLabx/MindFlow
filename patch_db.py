import re

with open('src/lib/db.ts', 'r') as f:
    content = f.read()

get_all_quizzes_func = """
    getAllSavedQuizzes: async (): Promise<SavedQuiz[]> => {
        const dbInstance = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = dbInstance.transaction(STORE_NAME, 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },
"""

# Insert after getQuiz
content = re.sub(
    r'(    getQuiz: async \(id: string\): Promise<SavedQuiz \| undefined> => \{.*?\n    \},)',
    r'\1\n' + get_all_quizzes_func,
    content,
    flags=re.DOTALL
)

with open('src/lib/db.ts', 'w') as f:
    f.write(content)
