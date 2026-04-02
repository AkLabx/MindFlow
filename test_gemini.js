const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_KEY || process.env.API_KEY;
const prompt = "What is 2+2? Return strictly JSON with 'answer' key.";

async function test(useJson, useTool) {
    const body = {
        contents: [{ parts: [{ text: prompt }] }],
    };
    if (useTool) body.tools = [{ googleSearch: {} }];
    if (useJson) body.generationConfig = { responseMimeType: "application/json" };

    console.log(`Testing useJson=${useJson}, useTool=${useTool}`);
    try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const data = await res.json();
        if (!res.ok) console.log("ERROR:", data.error.message);
        else console.log("SUCCESS:", data.candidates[0].content.parts[0].text);
    } catch(e) {
        console.log("FETCH ERR:", e.message);
    }
}

async function run() {
    await test(true, true);
    await test(false, true);
}
run();
