const fs = require('fs');
const path = require('path');

const mockPath = path.join(__dirname, 'src', 'features', 'quiz', 'mock', 'MockSession.tsx');
let content = fs.readFileSync(mockPath, 'utf8');

// The replacement script might have failed to remove the original useMockTimer line and just injected a second one.
// Let's find both and remove the second occurrence or the old original one.
const blocks = content.split("const { timeLeft, formatTime } = useMockTimer({");
if (blocks.length > 2) {
    // There are two declarations. Let's rebuild the file with only the first one
    // which includes the hook's arguments.
    // Actually, safer to just replace all occurrences and insert exactly one at the top

    // Quick regex to strip all useMockTimer invocations
    content = content.replace(/const { timeLeft, formatTime } = useMockTimer\(\{[\s\S]*?\}\);/g, "");

    // Inject it back right after totalExamTime
    const injectStr = `
    const { timeLeft, formatTime } = useMockTimer({
        totalTime: totalExamTime,
        onTimeUp: () => finishSession()
    });
    `;

    content = content.replace(/(const totalExamTime =.*?;)/, `$1\n${injectStr}`);

    fs.writeFileSync(mockPath, content, 'utf8');
}
