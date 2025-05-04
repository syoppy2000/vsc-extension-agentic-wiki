import * as vscode from "vscode";
import { CONFIG_KEY } from "../constants";
import { createFlow } from "../flow";
import { SharedStore } from "../types";
import { secretsManager } from "../extension";

export function registerGenerateCommand(context: vscode.ExtensionContext) {
    const generate = vscode.commands.registerCommand("agentic-wiki.generate", async () => {
        // Use progress bar to display generation process
        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: "Generating Wiki page...",
                cancellable: true,
            },
            async (progress, token) => {
                // Check if operation was cancelled
                if (token.isCancellationRequested) {
                    return;
                }

                try {
                    // Initialize progress
                    progress.report({ increment: 0, message: "Initializing..." });

                    await new Promise(resolve => setTimeout(resolve, 800));

                    // Generate random mock content
                    progress.report({ increment: 30, message: "Generating content..." });
                    // const wiki = generateRandomWikiContent();
                    await new Promise(resolve => setTimeout(resolve, 1000));

                    // Prepare file path
                    progress.report({ increment: 30, message: "Preparing files..." });

                    // Get API key from secure storage
                    const apiKey = await secretsManager.getApiKey();
                    if (!apiKey) {
                        throw new Error("API key is not set. Please configure your API key in the extension settings.");
                    }

                    const flow = createFlow();
                    let shared = context.globalState.get<SharedStore>(CONFIG_KEY) || ({} as SharedStore);

                    // Add API key and extension context to flow parameters but not to shared state
                    flow.setParams({ ...shared, llmApiKey: apiKey, context });
                    await flow.run(shared);

                    progress.report({ increment: 30, message: "Writing files..." });
                    progress.report({ increment: 10, message: "Wiki page successfully generated!" });
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    vscode.commands.executeCommand("agentic-wiki.open");
                } catch (error) {
                    vscode.window.showErrorMessage(
                        `Failed to generate Wiki page: ${error instanceof Error ? error.message : String(error)}`,
                    );
                }
            },
        );
    });

    context.subscriptions.push(generate);
}
