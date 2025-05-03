import * as vscode from "vscode";
import { CONFIG_KEY } from "./constants";
import { GlobalConfig } from "./types";

/**
 * Register all event listeners for the extension
 * @param context Extension context
 */
export function registerEventListeners(context: vscode.ExtensionContext): void {
    // Register workspace folder change listener
    registerWorkspaceFolderChangeListener(context);

    // Future listeners can be added here
    // registerSomeOtherListener(context);
}

/**
 * Listen for workspace folder changes and update configuration
 * @param context Extension context
 */
function registerWorkspaceFolderChangeListener(context: vscode.ExtensionContext): void {
    const listener = vscode.workspace.onDidChangeWorkspaceFolders(async e => {
        if (e.added.length > 0) {
            // Update localDir when workspace is added/changed
            const savedConfig = context.globalState.get<GlobalConfig>(CONFIG_KEY) || ({} as GlobalConfig);
            const newWorkspaceFolder = e.added[0].uri.fsPath;

            savedConfig.localDir = newWorkspaceFolder;
            await context.globalState.update(CONFIG_KEY, savedConfig);
            console.log(`Updated localDir to new workspace: ${newWorkspaceFolder}`);
        }
    });

    // Add to subscriptions to ensure proper cleanup
    context.subscriptions.push(listener);
}

// Template for future listeners
/*
function registerSomeOtherListener(context: vscode.ExtensionContext): void {
    const listener = vscode.someApi.onSomeEvent(async () => {
        // Handle event
    });
    
    context.subscriptions.push(listener);
}
*/
