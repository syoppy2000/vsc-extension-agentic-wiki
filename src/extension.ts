import * as vscode from "vscode";
import { registerGenerateCommand } from "./commands/generateCommand";
import { registerOpenCommand } from "./commands/openCommand";
import { registerConfigCommand } from "./commands/configCommand";
import { registerEventListeners } from "./listeners";
import { SecretsManager } from "./utils/secretsManager";
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

    registerGenerateCommand(context);
    registerOpenCommand(context);
    registerConfigCommand(context);

    registerEventListeners(context);
}

export function deactivate() {}
