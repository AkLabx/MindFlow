const { GoogleGenAI } = require("@google/genai");

async function findModels() {
  const ai = new GoogleGenAI({ apiKey: "AIzaSyCzvOWTjjCFjKXET7hv2dix5HvQdoW4Pww", httpOptions: { apiVersion: "v1alpha" } });
  try {
    const list = await ai.models.list();
    for await (const model of list) {
       if (model.supportedActions && model.supportedActions.includes("bidiGenerateContent")) {
           console.log("Found:", model.name);
       }
    }
  } catch(e) { console.error(e) }
}
findModels();
