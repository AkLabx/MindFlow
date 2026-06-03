# List Virtualization Audit

## The Current State
The `SavedQuizzesList.tsx` and `AttemptedQuizzesList.tsx` components currently map directly over arrays of `SavedQuiz` objects, rendering a complex `SavedQuizCard` (with sub-components, SVGs, and interactions) for every single item in the array.

## Memory & DOM Cost Estimation
- **Single Card Weight:** ~15 DOM nodes (Containers, Icons, Progress Bars, Text nodes).
- **Scale at 100 Quizzes:** 1,500 DOM nodes.
- **Scale at 500 Quizzes:** 7,500 DOM nodes.
- **Impact:** Rendering > 1,500 DOM nodes simultaneously forces the browser layout engine to work overtime. On mobile devices (especially low-end Androids via Capacitor), scrolling will jitter, and RAM consumption will spike, potentially leading to OS-level app termination.

## Recommendation
Implement `react-virtuoso`.
- **Why `react-virtuoso` over `react-window`?** `react-virtuoso` handles dynamic heights automatically. Since `SavedQuizCard` can expand (especially if metadata or tags are lengthy), `react-window` would require complex manual height recalculation matrices.
- **Integration Path:**
  1. Install `npm install react-virtuoso`.
  2. Replace `<div className="grid...">{quizzes.map(card)}</div>` with `<Virtuoso data={quizzes} itemContent={(index, quiz) => <SavedQuizCard />} />`.
  3. Ensure the parent container has a defined height (e.g., `flex-1` with `overflow-hidden` on the layout wrapper).
