import * as vscode from "vscode";
import { registerGenerateCommand } from "./commands/generateCommand";
import { registerOpenCommand } from "./commands/openCommand";
import { registerConfigCommand } from "./commands/configCommand";
import { registerEventListeners } from "./listeners";
import { SecretsManager } from "./utils/secretsManager";
import { CONFIG_KEY } from "./constants";
import { GlobalConfig } from "./types";
import { LoggerService } from "./services/logger";
import { ConfigService } from "./services/config";

// Export the secrets manager instance for use in other parts of the extension
export let secretsManager: SecretsManager;

export async function activate(context: vscode.ExtensionContext) {
    // Initialize logger
    const logger = LoggerService.getInstance();
    logger.info('Congratulations, your extension "agentic-wiki" is now active!');

    // Initialize config service
    ConfigService.getInstance(context);

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
    const logger = LoggerService.getInstance();

    try {
        const config = context.globalState.get<GlobalConfig>(CONFIG_KEY);
        if (config && config.llmApiKey) {
            // Store the API key in secure storage
            await secretsManager.storeApiKey(config.llmApiKey);

            // Remove the API key from global state
            const newConfig = { ...config, llmApiKey: "" };
            await context.globalState.update(CONFIG_KEY, newConfig);

            logger.info("Successfully migrated API key to secure storage");
        }
    } catch (error) {
        logger.error(`Error migrating API key to secure storage`, error);
    }
}

export function deactivate() {}
