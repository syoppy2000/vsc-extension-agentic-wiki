import { OpenAI } from "openai";
import * as fs from "fs/promises";
import path from "path";
import * as vscode from "vscode";
import { secretsManager } from "./extension";
import { ensureDirectoryExists } from "./utils";

// Cache file constants
const CACHE_FILENAME = "agentic-wiki.llm_cache.json";
let cacheFilePath: string = "";

interface Options {
    llmApiKey?: string;
    useCache?: boolean;
    context?: vscode.ExtensionContext; // Used to initialize cache path
}

interface Cache {
    [key: string]: string;
}

/**
 * Initialize the cache file path using the extension context
 * This should be called during extension activation
 * @param context VS Code extension context
 * @returns Promise that resolves when initialization is complete
 */
export async function initializeCachePath(context: vscode.ExtensionContext): Promise<void> {
    // Use the extension's global storage path for cache
    const storagePath = context.globalStorageUri.fsPath;
    cacheFilePath = path.join(storagePath, CACHE_FILENAME);

    try {
        // Ensure the storage directory exists
        await ensureDirectoryExists(storagePath);
        console.log("INFO", `Cache file path initialized: ${cacheFilePath}`);
    } catch (error) {
        console.error("ERROR", `Failed to create cache directory: ${error}`);
    }
}

/**
 * Read cache from file with proper error handling
 * @returns Cache object or empty object if file doesn't exist or is invalid
 */
async function readCache(): Promise<Cache> {
    // Check if cache path is initialized
    if (!cacheFilePath) {
        console.warn("WARNING", "Cache file path not initialized, using empty cache");
        return {};
    }

    try {
        // Check if cache file exists using async access
        try {
            await fs.access(cacheFilePath);
        } catch {
            // File doesn't exist
            return {};
        }

        // Read file asynchronously
        const data = await fs.readFile(cacheFilePath, "utf-8");

        // Check if file is empty
        if (!data.trim()) {
            return {};
        }

        return JSON.parse(data);
    } catch (error) {
        console.warn("WARNING", `Failed to read cache file: ${error}`);
        return {};
    }
}

/**
 * Write cache to file with proper error handling
 * @param cache Cache object to write
 */
async function writeCache(cache: Cache): Promise<void> {
    // Check if cache path is initialized
    if (!cacheFilePath) {
        console.warn("WARNING", "Cache file path not initialized, cannot write cache");
        return;
    }

    try {
        // Ensure the directory exists
        const cacheDir = path.dirname(cacheFilePath);
        await ensureDirectoryExists(cacheDir);

        // Write to a temporary file first (asynchronously)
        const tempFilePath = `${cacheFilePath}.tmp`;
        await fs.writeFile(tempFilePath, JSON.stringify(cache, null, 2));

        // Rename the temporary file to the actual cache file (atomic operation, asynchronously)
        await fs.rename(tempFilePath, cacheFilePath);

        console.log("INFO", "Cache updated successfully");
    } catch (error) {
        console.error("ERROR", `Failed to write cache file: ${error}`);
    }
}

export async function callLlm(prompt: string, { useCache = true, llmApiKey, context }: Options): Promise<string> {
    console.log(`Prompt: ${prompt}`);

    // Initialize cache path if context is provided, path is not yet initialized, and cache is enabled
    if (useCache && context && !cacheFilePath) {
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

    let cache: Cache = {};

    // If cache is enabled, check cache
    if (useCache) {
        // Read cache from file
        cache = await readCache();

        // If cache hit, return directly
        if (prompt in cache) {
            console.log("INFO", `RESPONSE (from cache): ${cache[prompt]}`);
            return cache[prompt];
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
    if (useCache && cacheFilePath) {
        // Read the latest cache data
        cache = await readCache();

        // Add to cache and save
        cache[prompt] = responseText;
        await writeCache(cache);
    }

    return responseText;
}
