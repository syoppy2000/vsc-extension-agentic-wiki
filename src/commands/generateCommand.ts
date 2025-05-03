import * as vscode from "vscode";
import { CONFIG_KEY } from "../constants";
import { createFlow } from "../flow";
import { SharedStore } from "../types";

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

                    const flow = createFlow();
                    let shared = context.globalState.get<SharedStore>(CONFIG_KEY) || ({} as SharedStore);
                    flow.setParams({ ...shared });
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
