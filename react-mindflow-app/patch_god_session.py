import re

with open('src/features/quiz/mock/GodModeSession.tsx', 'r') as f:
    content = f.read()

# Replace useMockTimer import
content = content.replace("import { useMockTimer } from '../hooks/useMockTimer';", "import { useGodSessionTimer } from '../hooks/useGodSessionTimer';")

# Remove old currentQTimer ref
content = re.sub(r'const currentQTimer = useRef\(0\);\n', '', content)

# Replace hook usage
old_hook = r"""const \{ timeLeft, formatTime \} = useMockTimer\(\{\s*totalTime: totalExamTime,\s*onTimeUp: \(\) => finishSession\(\),\s*onTick: \(\) => \{\s*currentQTimer\.current \+= 1;\s*\}\s*\}\);"""
new_hook = """const { timeLeft, formatTime, getAndResetCurrentQuestionTime, getCurrentQuestionTimeRef } = useGodSessionTimer({
        totalTime: totalExamTime,
        onTimeUp: () => finishSession()
    });"""
content = re.sub(old_hook, new_hook, content)

# Replace saveCurrentQuestionTime
old_save = r"""const saveCurrentQuestionTime = \(\) => \{\s*const qId = questions\[currentIndex\]\.id;\s*setTimeSpentPerQuestion\(prev => \(\{\s*\.\.\.prev,\s*\[qId\]: \(prev\[qId\] \|\| 0\) \+ currentQTimer\.current\s*\}\)\);\s*currentQTimer\.current = 0;\s*\};"""
new_save = """const saveCurrentQuestionTime = () => {
        const qId = questions[currentIndex].id;
        const timeSpent = getAndResetCurrentQuestionTime();
        setTimeSpentPerQuestion(prev => ({
            ...prev,
            [qId]: (prev[qId] || 0) + timeSpent
        }));
    };"""
content = re.sub(old_save, new_save, content)

with open('src/features/quiz/mock/GodModeSession.tsx', 'w') as f:
    f.write(content)
