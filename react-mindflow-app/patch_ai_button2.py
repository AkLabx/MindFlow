import re

file_path = "src/features/quiz/components/AiExplanationButton.tsx"
with open(file_path, "r") as f:
    content = f.read()

# 1. Remove generationConfig: { responseMimeType: "application/json" }
content = content.replace("generationConfig: {\n                                    responseMimeType: \"application/json\"\n                                }", "")
# Fix hanging comma after tools
content = content.replace("tools: [{ googleSearch: {} }],\n                                \n", "tools: [{ googleSearch: {} }]\n                                ")

# 2. Add JSON cleaning logic
old_json_parse = """            const result = await response.json();
            const text = result.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!text) throw new Error("Empty response from AI");

            const parsedData = JSON.parse(text);
            setData(parsedData);"""

new_json_parse = """            const result = await response.json();
            let text = result.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!text) throw new Error("Empty response from AI");

            // Clean up potential markdown blocks if responseMimeType wasn't used
            text = text.trim();
            if (text.startsWith('```json')) {
                text = text.slice(7);
            } else if (text.startsWith('```')) {
                text = text.slice(3);
            }
            if (text.endsWith('```')) {
                text = text.slice(0, -3);
            }
            text = text.trim();

            try {
                const parsedData = JSON.parse(text);
                setData(parsedData);
            } catch (parseError) {
                console.error("JSON Parse Error on:", text);
                throw new Error("AI returned invalid data format.");
            }"""

content = content.replace(old_json_parse, new_json_parse)

with open(file_path, "w") as f:
    f.write(content)
