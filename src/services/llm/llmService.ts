import { OpenAI } from "openai";
import * as vscode from "vscode";
import { secretsManager } from "../../extension";
import { getCacheValue, initializeCachePath, setCacheValue } from "../cache";

export interface LlmOptions {
    llmApiKey?: string;
    useCache?: boolean;
    context?: vscode.ExtensionContext;
}

/**
 * Call the LLM API with caching support
 * @param prompt The prompt to send to the LLM
 * @param options Options for the LLM call
 * @returns The LLM response
 */
export async function callLlm(prompt: string, { useCache = true, llmApiKey, context }: LlmOptions): Promise<string> {
    console.log(`Prompt: ${prompt}`);

    // Initialize cache path if context is provided, path is not yet initialized, and cache is enabled
    if (useCache && context) {
        try {
            // Try to initialize cache path, but don't block the main flow if it fails
            await initializeCachePath(context);
        } catch (error) {
            // Just log the error and continue - cache will be disabled for this call
            console.warn("WARNING", `Failed to initialize cache path: ${error}`);
            // Force useCache to false since we couldn't initialize the cache
            useCache = false;
        }
    }

    // If cache is enabled, check cache
    if (useCache) {
        // Try to get from cache
        const cachedResponse = await getCacheValue(prompt);
        
        // If cache hit, return directly
        if (cachedResponse) {
            console.log("INFO", `RESPONSE (from cache): ${cachedResponse}`);
            return cachedResponse;
        }
    }

    // Get API key from secure storage if not provided
    let apiKey = llmApiKey;
    if (!apiKey) {
        apiKey = await secretsManager.getApiKey();
    }

    if (!apiKey) {
        throw new Error("API key is not set. Please configure your API key in the extension settings.");
    }

    const client = new OpenAI({ apiKey, baseURL: "https://openrouter.ai/api/v1" });

    let responseText = "";
    try {
        const r = await client.chat.completions.create({
            model: "deepseek/deepseek-r1:free",
            messages: [{ role: "user", content: prompt }],
        });

        // Handle API error response
        if ("error" in r) {
            const errorMessage = (r.error as any)?.message || String(r.error);
            console.error("ERROR", `API returned error: ${errorMessage}`);
            throw new Error(errorMessage);
        }

        responseText = r.choices[0]?.message?.content || "";
        if (!responseText) {
            console.warn("WARNING", "API returned empty response");
        }
    } catch (error) {
        // Handle network/runtime errors
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("ERROR", `LLM API call failed: ${errorMessage}`);
        throw new Error(`LLM request failed: ${errorMessage}`);
    }

    console.log(`RESPONSE: ${responseText}`);

    // If cache is enabled, update cache
    if (useCache) {
        try {
            await setCacheValue(prompt, responseText);
        } catch (error) {
            console.error("ERROR", `Failed to update cache: ${error}`);
        }
    }

    return responseText;
}
