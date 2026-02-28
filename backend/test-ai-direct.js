"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const google_genai_1 = require("@langchain/google-genai");
const env_1 = require("./src/config/env");
async function run() {
    console.log("Starting direct call...", !!env_1.GEMINI_API_KEY);
    try {
        const chat = new google_genai_1.ChatGoogleGenerativeAI({
            model: 'gemini-2.5-flash',
            apiKey: env_1.GEMINI_API_KEY,
        });
        console.log("Firing request...");
        const res = await chat.invoke("hello");
        console.log("Result:", res.content);
    }
    catch (err) {
        console.error("Error:", err);
    }
}
run();
//# sourceMappingURL=test-ai-direct.js.map