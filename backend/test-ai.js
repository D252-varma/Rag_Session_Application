"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const generations_1 = require("./src/rag/generations");
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
async function run() {
    console.log("Starting...");
    try {
        const res = await (0, generations_1.generateAnswer)("Hello", [{ text: "Fake content", fileName: "fake.pdf" }], []);
        console.log("Result:", res);
    }
    catch (err) {
        console.error("Error:", err);
    }
}
run();
//# sourceMappingURL=test-ai.js.map