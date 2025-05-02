import { OpenAI } from "openai";
import fs from "fs";

const cacheFile = "llm_cache.json";

interface Options {
    llmApiKey: string;
    useCache?: boolean;
}

interface Cache {
    [key: string]: string;
}

export async function callLlm(prompt: string, { useCache = true, llmApiKey }: Options): Promise<string> {
    console.log(`Prompt: ${prompt}`);

    let cache: Cache = {};

    // 如果启用缓存，检查缓存
    if (useCache) {
        if (fs.existsSync(cacheFile)) {
            try {
                const data = fs.readFileSync(cacheFile, "utf-8");
                cache = JSON.parse(data);
            } catch (error) {
                console.log("WARNING", `Failed to load cache, starting with empty cache. Error: ${error}`);
                cache = {}; // 出错时重置缓存
            }
        }

        // 如果缓存命中，直接返回
        if (prompt in cache) {
            console.log("INFO", `RESPONSE (from cache): ${cache[prompt]}`);
            return cache[prompt];
        }
    }

    if (!llmApiKey) {
        throw new Error("OPENAI_API_KEY environment variable is not set");
    }

    const client = new OpenAI({ apiKey: llmApiKey, baseURL: "https://api.deepseek.com" });

    let responseText = "";
    try {
        const r = await client.chat.completions.create({
            model: "deepseek-chat",
            messages: [{ role: "user", content: prompt }],
        });
        responseText = r.choices[0].message.content || "";
    } catch (error) {
        const errorMsg = `LLM API call failed: ${error}`;
        console.error("ERROR", errorMsg);
        throw new Error(errorMsg); // 抛出错误以便调用者处理
    }

    console.log(`RESPONSE: ${responseText}`);

    // 如果启用缓存，更新缓存
    if (useCache) {
        // 再次加载缓存以避免覆盖（虽然在单线程 Node.js 中并发风险较小，但保持逻辑一致）
        if (fs.existsSync(cacheFile)) {
            try {
                const data = fs.readFileSync(cacheFile, "utf-8");
                // 检查文件是否为空
                if (data.trim()) {
                    cache = JSON.parse(data);
                } else {
                    cache = {};
                }
            } catch (error) {
                console.log("WARNING", `Failed to reload cache before saving. Error: ${error}`);
                // 如果重新加载失败，我们仍然尝试写入，但可能会覆盖其他进程的写入（如果存在）
            }
        } else {
            cache = {};
        }

        // 添加到缓存并保存
        cache[prompt] = responseText;
        try {
            fs.writeFileSync(cacheFile, JSON.stringify(cache, null, 2)); // 使用 pretty print 方便查看
        } catch (error) {
            console.log("ERROR", `Failed to save cache: ${error}`);
        }
    }

    return responseText;
}
