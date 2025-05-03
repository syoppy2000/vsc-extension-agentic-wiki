import * as vscode from "vscode";

/**
 * Key used to store the API key in the secrets storage
 */
const API_KEY_SECRET_KEY = "agentic-wiki.llmApiKey";

/**
 * Manages secure storage of sensitive information like API keys
 */
export class SecretsManager {
    private context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    /**
     * Store the API key securely
     * @param apiKey The API key to store
     */
    async storeApiKey(apiKey: string): Promise<void> {
        await this.context.secrets.store(API_KEY_SECRET_KEY, apiKey);
    }

    /**
     * Retrieve the API key from secure storage
     * @returns The API key or empty string if not found
     */
    async getApiKey(): Promise<string> {
        try {
            return (await this.context.secrets.get(API_KEY_SECRET_KEY)) || "";
        } catch (error) {
            console.error("Error retrieving API key from secure storage:", error);
            return "";
        }
    }

    /**
     * Delete the API key from secure storage
     */
    async deleteApiKey(): Promise<void> {
        await this.context.secrets.delete(API_KEY_SECRET_KEY);
    }
}
