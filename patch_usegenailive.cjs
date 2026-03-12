const fs = require('fs');

const path = 'src/features/quiz/live/useGenAILive.ts';
let content = fs.readFileSync(path, 'utf8');

// 1. Fix the question mapping logic
content = content.replace(
    /const questionsJson = JSON\.stringify\(quiz\.questions\.map\(\(q, i\) => \(\{\s*id: i \+ 1,\s*question: q\.text,\s*options: q\.options,\s*answer: q\.correctAnswer,\s*explanation: q\.explanation\s*\}\)\)\);/s,
    `const questionsJson = JSON.stringify(quiz.questions.map((q, i) => ({
                id: i + 1,
                question: q.question,
                options: q.options,
                answer: q.correct,
                explanation: q.explanation.summary || q.explanation.analysis_correct || "No explanation available"
            })));`
);

// 2. Fix the config system instruction format
content = content.replace(
    /systemInstruction: \{\s*parts: \[\{ text: systemInstruction \}\]\s*\}/s,
    `systemInstruction: {
                        parts: [{ text: systemInstruction }]
                    }`
);


// 3. Fix the ai.live.connect by using callbacks directly in the connection object
const oldConnectLogic = `            const session = await ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: {
                            prebuiltVoiceConfig: {
                                voiceName: voice
                            }
                        }
                    },
                    systemInstruction: {
                        parts: [{ text: systemInstruction }]
                    }
                }
            });

            sessionRef.current = session;`;

const newConnectLogic = `            const session = await ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: {
                            prebuiltVoiceConfig: {
                                voiceName: voice
                            }
                        }
                    },
                    systemInstruction: {
                        parts: [{ text: systemInstruction }]
                    }
                },
                callbacks: {
                    onopen: () => console.log("Live AI Session Opened"),
                    onmessage: (message: LiveServerMessage) => {
                        if (message.serverContent?.modelTurn?.parts) {
                            for (const part of message.serverContent.modelTurn.parts) {
                                if (part.inlineData && part.inlineData.data) {
                                    handleIncomingAudio(part.inlineData.data, audioContext);
                                }
                            }
                        }
                    },
                    onclose: (e) => {
                        console.log("Live AI Session Closed", e);
                        handleDisconnect();
                    },
                    onerror: (err) => {
                        console.error("Live AI Session Error", err);
                        handleDisconnect();
                    }
                }
            });

            sessionRef.current = session;`;

content = content.replace(oldConnectLogic, newConnectLogic);

// 4. Remove the hallucinated async iterator receive()
content = content.replace(
    /            \/\/ Receive messages\s*\(\s*async \(\) => \{\s*try \{\s*for await \(const message of session\.receive\(\)\) \{[\s\S]*?\}\s*\}\s*catch \(e\) \{\s*console\.error\("Session receive error", e\);\s*handleDisconnect\(\);\s*\}\s*\}\)\(\);/s,
    `            // Messages are now handled entirely by the onmessage callback.`
);

fs.writeFileSync(path, content, 'utf8');
console.log('useGenAILive.ts updated successfully');
