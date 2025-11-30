import { Question, InitialFilters, QuizMode, SavedQuiz } from '../features/quiz/types';
import { QuizState } from '../features/quiz/types/store';

const DB_NAME = 'MindFlowDB';
const DB_VERSION = 1;
const STORE_NAME = 'saved_quizzes';

const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };

        request.onsuccess = (event) => {
            resolve((event.target as IDBOpenDBRequest).result);
        };

        request.onerror = (event) => {
            reject((event.target as IDBOpenDBRequest).error);
        };
    });
};

export const db = {
    saveQuiz: async (quiz: SavedQuiz): Promise<void> => {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.put(quiz);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    },

    getQuizzes: async (): Promise<SavedQuiz[]> => {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    getQuiz: async (id: string): Promise<SavedQuiz | undefined> => {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    deleteQuiz: async (id: string): Promise<void> => {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    },

    updateQuizProgress: async (id: string, state: QuizState): Promise<void> => {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);

            // First get the quiz
            const getRequest = store.get(id);

            getRequest.onsuccess = () => {
                const quiz = getRequest.result as SavedQuiz;
                if (quiz) {
                    // Update state
                    quiz.state = state;
                    const putRequest = store.put(quiz);
                    putRequest.onsuccess = () => resolve();
                    putRequest.onerror = () => reject(putRequest.error);
                } else {
                    reject(new Error(`Quiz with id ${id} not found`));
                }
            };

            getRequest.onerror = () => reject(getRequest.error);
        });
    },

    updateQuizName: async (id: string, name: string): Promise<void> => {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);

            const getRequest = store.get(id);

            getRequest.onsuccess = () => {
                const quiz = getRequest.result as SavedQuiz;
                if (quiz) {
                    quiz.name = name;
                    const putRequest = store.put(quiz);
                    putRequest.onsuccess = () => resolve();
                    putRequest.onerror = () => reject(putRequest.error);
                } else {
                    reject(new Error(`Quiz with id ${id} not found`));
                }
            };

            getRequest.onerror = () => reject(getRequest.error);
        });
    }
};
