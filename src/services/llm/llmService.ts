import * as vscode from "vscode";
import { secretsManager } from "../../extension";
import { getCacheValue, initializeCachePath, setCacheValue } from "../cache";
import { LmProvider } from "./lmProvider";
import { VsCodeLmProvider } from "./vsCodeLm";
import { OpenRouterModelProvider } from "./openRouter";


export const DEFAULT_LLM_PROVIDER = "OpenRouter"; // Default provider name
export interface LlmOptions {
    providerName: string;
    llmApiKey?: string;
    useCache?: boolean;
    context?: vscode.ExtensionContext;
    model?: string;
}

export interface OpenRouterModel {
    id: string;
    name: string;
    pricing: {
        prompt: string;
        completion: string;
    };
    context_length: number;
    top_provider?: {
        is_moderated?: boolean;
    };
}


const lmProviders: LmProvider[] = [
    new OpenRouterModelProvider(),  
    new VsCodeLmProvider(),
];

/**
 * Get available LM providers
 * @param name Optional name of the provider to filter by.
 * If provided, returns only the specified provider 
 * @returns Array of LlmProvider instances
 * If name is provided, returns an array with the matching provider or empty array if not found
 */
export function getLmProviders(name?: string): LmProvider[] {
    if (name) {
        const provider = lmProviders.find(p => p.getProviderName() === name);
        return provider ? [provider] : [];
    }
    return [...lmProviders];
}


/**
 * Call the LLM API with caching support
 * @param prompt The prompt to send to the LLM
 * @param options Options for the LLM call
 * @returns The LLM response
 */
export async function callLlm(
    prompt: string,
    { providerName, useCache = true, llmApiKey, context, model }: LlmOptions,
): Promise<string> {
    console.log(`Prompt: ${prompt}`);

    const [lmProvider] = getLmProviders(providerName); 
    if (lmProvider === undefined) {
        throw new Error(`Provider ${providerName} not found`);
    }

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


    const modelToUse = model || (await lmProvider.fetchAvailableModels(apiKey))[0].id;
    let responseText = "";
    try {
        // Send request to the LLM provider
        responseText = await lmProvider.sendRequest(modelToUse, prompt, apiKey);
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
