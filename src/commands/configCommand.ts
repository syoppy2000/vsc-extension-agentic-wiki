import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { GlobalConfig } from "../types";
import { CONFIG_KEY, DEFAULT_CONFIG, OUTPUT_DIR } from "../constants";

export function registerConfigCommand(context: vscode.ExtensionContext) {
    const config = vscode.commands.registerCommand("agentic-wiki.config", async () => {
        try {
            // Create and display configuration form
            const configPanel = new ConfigPanel(context);
            configPanel.show();
        } catch (error) {
            vscode.window.showErrorMessage(
                `Configuration failed: ${error instanceof Error ? error.message : String(error)}`,
            );
        }
    });

    context.subscriptions.push(config);
}

/**
 * Configuration panel class
 */
class ConfigPanel {
    private panel: vscode.WebviewPanel;
    private context: vscode.ExtensionContext;
    private config: GlobalConfig;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        const savedConfig = context.globalState.get<GlobalConfig>(CONFIG_KEY) || {};

        this.config = Object.assign(
            {},
            DEFAULT_CONFIG,
            // Filter out false values from saved config
            Object.fromEntries(
                Object.entries(savedConfig).filter(([_, value]) => typeof value === "boolean" || !!value),
            ),
        );

        // Create WebView panel
        this.panel = vscode.window.createWebviewPanel(
            "AgenticWikiConfig",
            "Agentic Wiki Configuration",
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, "media"))],
            },
        );

        // Set WebView content
        this.panel.webview.html = this.getWebviewContent();

        // Handle messages from WebView
        this.panel.webview.onDidReceiveMessage(
            async message => {
                switch (message.command) {
                    case "saveConfig":
                        await this.saveConfig(message.config);
                        break;
                }
            },
            undefined,
            context.subscriptions,
        );
    }

    /**
     * Display configuration panel
     */
    public show() {
        this.panel.reveal();
    }

    /**
     * Save configuration
     */
    private async saveConfig(config: GlobalConfig) {
        console.log("Saving configuration", config);
        try {
            // Save configuration
            await this.context.globalState.update(CONFIG_KEY, config);
            vscode.window.showInformationMessage("Configuration saved");
            this.panel.dispose(); // Close panel after saving
        } catch (error) {
            vscode.window.showErrorMessage(
                `Failed to save configuration: ${error instanceof Error ? error.message : String(error)}`,
            );
        }
    }

    /**
     * Get WebView content
     */
    private getWebviewContent() {
        // Convert configuration object to JSON string for form initialization
        const configJson = JSON.stringify(this.config);

        // Get current workspace folder
        let workspaceFolder = "";
        if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
            workspaceFolder = vscode.workspace.workspaceFolders[0].uri.fsPath;
        }

        // Read HTML template file
        const templatePath = path.join(this.context.extensionPath, "src/templates/configTemplate.html");
        let templateContent = fs.readFileSync(templatePath, "utf8");

        // Replace variables in the template
        templateContent = templateContent
            .replace("${configJson}", configJson)
            .replace("${workspaceFolder}", workspaceFolder);

        return templateContent;
    }
}
