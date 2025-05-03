import { OpenAI } from "openai";
import fs from "fs";
import { secretsManager } from "./extension";

const cacheFile = "llm_cache.json";

interface Options {
    llmApiKey?: string;
    useCache?: boolean;
}

interface Cache {
    [key: string]: string;
}

export async function callLlm(prompt: string, { useCache = true, llmApiKey }: Options): Promise<string> {
    console.log(`Prompt: ${prompt}`);

    let cache: Cache = {};

    // If cache is enabled, check cache
    if (useCache) {
        if (fs.existsSync(cacheFile)) {
            try {
                const data = fs.readFileSync(cacheFile, "utf-8");
                cache = JSON.parse(data);
            } catch (error) {
                console.log("WARNING", `Failed to load cache, starting with empty cache. Error: ${error}`);
                cache = {}; // Reset cache on error
            }
        }

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
    if (useCache) {
        // Reload cache to avoid overwriting (although concurrent risk is small in single-threaded Node.js, maintain consistent logic)
        if (fs.existsSync(cacheFile)) {
            try {
                const data = fs.readFileSync(cacheFile, "utf-8");
                // Check if file is empty
                if (data.trim()) {
                    cache = JSON.parse(data);
                } else {
                    cache = {};
                }
            } catch (error) {
                console.log("WARNING", `Failed to reload cache before saving. Error: ${error}`);
                // If reload fails, we still try to write, but may overwrite other process writes (if any)
            }
        } else {
            cache = {};
        }

        // Add to cache and save
        cache[prompt] = responseText;
        try {
            fs.writeFileSync(cacheFile, JSON.stringify(cache, null, 2)); // Use pretty print for easier viewing
        } catch (error) {
            console.log("ERROR", `Failed to save cache: ${error}`);
        }
    }

    return responseText;
}
