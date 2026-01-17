import { groq } from "@ai-sdk/groq";
import { streamText } from "ai";
import { config } from "../../config/google.config.js";
import chalk from "chalk";

export class GroqService {
    constructor() {
        if (!config.groqApiKey) {
            throw new Error("Groq API key is not set in env");
        }

        this.model = groq(config.model || "llama-3.3-70b-versatile", {
            apiKey: config.groqApiKey,
        });
    }

    // For sending a message and returning stream response
    /**
     * @param {Array} messages
     * @param {Function} onChunk
     * @returns {Promise<object>}
     */
    async SendMessage(messages, onChunk) {
        try {
            const streamConfig = {
                model: this.model,
                messages: messages,
            };
            const result = streamText(streamConfig);

            let fullResponse = "";

            for await (const chunk of result.textStream) {
                fullResponse += chunk;
                if (onChunk) {
                    onChunk(chunk);
                }
            }

            const fullResult = result;

            return {
                content: fullResponse,
                finishReason: fullResult.finishReason,
            };
        } catch (error) {
            console.error(chalk.red("Error in SendMessage: ", error.message));
            throw error;
        }
    }

    // Get a non-streaming response
    /**
     * @params {Array} messages
     * @returns {Promise<string>}
     */
    async getMessage(messages) {
        let fullResponse = "";
        await this.SendMessage(messages, (chunk) => {
            fullResponse += chunk;
        });

        return fullResponse;
    }

    // Format messages from database into AI format
    /**
     * @params {Array} dbMessages
     * @returns {Array}
     */
    formatMessagesForAI(dbMessages) {
        return dbMessages.map((msg) => ({
            role: msg.role,
            content: msg.content,
        }));
    }
}
