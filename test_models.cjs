const { GoogleGenAI } = require("@google/genai");

async function checkModels() {
  const ai = new GoogleGenAI({ apiKey: "AIzaSyCzvOWTjjCFjKXET7hv2dix5HvQdoW4Pww", httpOptions: { apiVersion: "v1alpha" } });
  try {
    const list = await ai.models.list();
    for await (const model of list) {
       if (model.name.includes("2.0")) console.log(model.name);
    }
  } catch(e) { console.error(e) }
}
checkModels();
