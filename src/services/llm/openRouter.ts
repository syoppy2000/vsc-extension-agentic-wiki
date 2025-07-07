import { LmModel, LmProvider } from "./lmProvider";
import { OpenAI } from "openai";
import { OPENROUTER_API_URL, OPENROUTER_DEFAULT_MODEL } from "../../constants";
import * as vscode from "vscode";

class OpenRouterModel implements LmModel {
    id: string;
    name: string;
    pricing: {
        prompt: string;
        completion: string;
    };
    contextLength: number;
    topProvider?: {
        is_moderated?: boolean;
    };
    constructor(id: string, name: string, pricing: {prompt: string, completion: string}, contextLength: number, topProvider?: { is_moderated?: boolean }) {
        this.id = id;
        this.name = name;
        this.pricing = pricing;
        this.contextLength = contextLength;
        this.topProvider = topProvider;
    }
};

export class OpenRouterModelProvider implements LmProvider {
    public async fetchAvailableModels(apiKey: string): Promise<LmModel[]> {
        try {
            const response = await fetch(`${OPENROUTER_API_URL}/models`, {
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch models: ${response.statusText}`);
            }

            // const data = (await response.json()) as { data: OpenRouterModel[] };
            // const mode(ls = data.data) as ;
            const data = (await response.json()) as {data: any[]};    
            const models = data.data.map((model: any) => new OpenRouterModel(
                model.id,
                model.name,
                model.pricing,
                model.context_length,
                model.top_provider
            ));

            // Sort models: free models first, then by price
            return models.sort((a, b) => {
                // Convert pricing strings to numbers for comparison
                const aPromptPrice = parseFloat(a.pricing.prompt);
                const aCompletionPrice = parseFloat(a.pricing.completion);
                const bPromptPrice = parseFloat(b.pricing.prompt);
                const bCompletionPrice = parseFloat(b.pricing.completion);

                // Calculate total price per token
                const aTotalPrice = aPromptPrice + aCompletionPrice;
                const bTotalPrice = bPromptPrice + bCompletionPrice;

                // Sort by price (ascending)
                return aTotalPrice - bTotalPrice;
            });
        } catch (error) {
            console.error("ERROR", `Failed to fetch models: ${error}`);
            throw error;
        }
    }

    public getProviderName(): string {
        return "OpenRouter";
    }

    public async sendRequest(model: string, prompt: string, apiKey: string, options?: Record<string, any>): Promise<string> {
        const client = new OpenAI({ apiKey, baseURL: OPENROUTER_API_URL });

        // Use provided model or default
        const modelToUse = model || OPENROUTER_DEFAULT_MODEL;

        let responseText = "";
        try {
            const r = await client.chat.completions.create({
                model: modelToUse,
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
        return responseText;
    }
}
