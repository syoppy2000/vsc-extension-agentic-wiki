import * as vscode from "vscode";
import { registerGenerateCommand } from "./commands/generateCommand";
import { registerOpenCommand } from "./commands/openCommand";
import { registerConfigCommand } from "./commands/configCommand";
import { registerEventListeners } from "./listeners";
import { SecretsManager } from "./utils/secretsManager";
import { CONFIG_KEY } from "./constants";
import { GlobalConfig } from "./types";

const outputChannel = vscode.window.createOutputChannel("Agentic Wiki");
export function log(message: string) {
    outputChannel.appendLine(message);
}

// Export the secrets manager instance for use in other parts of the extension
export let secretsManager: SecretsManager;

export async function activate(context: vscode.ExtensionContext) {
    log('Congratulations, your extension "agentic-wiki" is now active!');

    // Initialize the secrets manager
    secretsManager = new SecretsManager(context);

    // Migrate existing API key to secure storage if needed
    await migrateApiKeyToSecureStorage(context);

    registerGenerateCommand(context);
    registerOpenCommand(context);
    registerConfigCommand(context);

    registerEventListeners(context);
}

/**
 * Migrate existing API key from global state to secure storage
 * This is a one-time migration for users upgrading from previous versions
 */
async function migrateApiKeyToSecureStorage(context: vscode.ExtensionContext) {
    try {
        const config = context.globalState.get<GlobalConfig>(CONFIG_KEY);
        if (config && config.llmApiKey) {
            // Store the API key in secure storage
            await secretsManager.storeApiKey(config.llmApiKey);

            // Remove the API key from global state
            const newConfig = { ...config, llmApiKey: "" };
            await context.globalState.update(CONFIG_KEY, newConfig);

            log("Successfully migrated API key to secure storage");
        }
    } catch (error) {
        log(`Error migrating API key to secure storage: ${error instanceof Error ? error.message : String(error)}`);
    }
}

export function deactivate() {}
