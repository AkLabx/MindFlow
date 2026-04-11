import re

file_path = "src/features/quiz/components/AiExplanationButton.tsx"
with open(file_path, "r") as f:
    content = f.read()

# Replace the single fetch with a fallback logic fetch
old_fetch = """            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{ text: prompt }]
                        }],
                        tools: [{ googleSearch: {} }],
                        generationConfig: {
                            responseMimeType: "application/json"
                        }
                    })
                }
            );

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error?.message || "Failed to fetch explanation");
            }

            const result = await response.json();
            const text = result.candidates?.[0]?.content?.parts?.[0]?.text;"""

new_fetch = """            const modelsToTry = [
                'gemini-3.1-flash-lite-preview',
                'gemini-2.5-flash-lite',
                'gemini-2.5-flash'
            ];

            let response;
            let lastErrorMsg = "Failed to fetch explanation";

            for (const model of modelsToTry) {
                try {
                    response = await fetch(
                        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
                        {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                contents: [{
                                    parts: [{ text: prompt }]
                                }],
                                tools: [{ googleSearch: {} }],
                                generationConfig: {
                                    responseMimeType: "application/json"
                                }
                            })
                        }
                    );

                    if (response.ok) {
                        break; // Success, stop trying models
                    } else {
                        const errData = await response.json();
                        console.warn(`Model ${model} failed:`, errData.error?.message);
                        lastErrorMsg = errData.error?.message || `Failed with ${model}`;
                    }
                } catch (e: any) {
                    console.warn(`Network error with ${model}:`, e.message);
                    lastErrorMsg = e.message;
                }
            }

            if (!response || !response.ok) {
                throw new Error(lastErrorMsg);
            }

            const result = await response.json();
            const text = result.candidates?.[0]?.content?.parts?.[0]?.text;"""

content = content.replace(old_fetch, new_fetch)

with open(file_path, "w") as f:
    f.write(content)
