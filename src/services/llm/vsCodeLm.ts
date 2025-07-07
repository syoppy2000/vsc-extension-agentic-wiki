import { LmModel, LmProvider } from "./lmProvider";
import * as vscode from "vscode";

class VsCodeLmModel implements LmModel {
    id: string;
    name: string;
    vendor: string;
    family: string;
    contextLength: number;
    constructor(id: string, name: string, vendor: string, family: string, contextLength: number) {
        this.id = id;
        this.name = name;
        this.vendor = vendor;
        this.family = family;
        this.contextLength = contextLength;
    }
};

export class VsCodeLmProvider implements LmProvider {
    public async fetchAvailableModels(apiKey: string): Promise<LmModel[]> {
        // Implementation to fetch models from VS Code API or other source
        const models = await vscode.lm.selectChatModels({});
        if (models && models.length > 0) {
            return models.map(model => new VsCodeLmModel(
                model.id,
                model.name,
                model.vendor,
                model.family,
                model.maxInputTokens,
            ));
        }
 
        return [];
    }

    public getProviderName(): string {
        return "VSCode LLM";
    }

    public async sendRequest(model: string, prompt: string, apiKey: string, options?: Record<string, any>): Promise<string> {
        const [lmModel] = await vscode.lm.selectChatModels({
            id: model});
        
        if (!model) {
            throw new Error(`Model ${model} not found`);
        }

        const messages = [
            vscode.LanguageModelChatMessage.User(prompt),
        ];
        const response = await lmModel.sendRequest(
            messages,
            {},
            new vscode.CancellationTokenSource().token,
        );
       
        let responseText: string = '';

        for await(const fragment of response.text) {
            responseText += fragment;
        }
        return responseText;
    }
}
