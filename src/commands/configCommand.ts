import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { GlobalConfig } from "../types";
import { CONFIG_KEY, DEFAULT_CONFIG, OUTPUT_DIR, OPENROUTER_DEFAULT_MODEL } from "../constants";
import { secretsManager } from "../extension";
import { fetchAvailableModels, OpenRouterModel } from "../services/llm/llmService";

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

        // Initialize with default config and saved config
        this.config = Object.assign(
            {},
            DEFAULT_CONFIG,
            // Filter out false values from saved config
            Object.fromEntries(
                Object.entries(savedConfig).filter(([_, value]) => typeof value === "boolean" || !!value),
            ),
        );

        // We'll load the API key asynchronously
        this.initializeApiKey();

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
                    case "fetchModels":
                        await this.fetchAndSendModels(message.apiKey);
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
     * Initialize API key from secure storage
     */
    private async initializeApiKey() {
        try {
            // Get API key from secure storage
            const apiKey = await secretsManager.getApiKey();
            this.config.llmApiKey = apiKey;

            // Update the webview if it's already initialized
            if (this.panel && this.panel.webview) {
                this.panel.webview.postMessage({
                    command: "updateApiKey",
                    apiKey,
                });

                // If API key is available, fetch models
                if (apiKey) {
                    await this.fetchAndSendModels(apiKey);
                }
            }
        } catch (error) {
            console.error("Error loading API key from secure storage:", error);
        }
    }

    /**
     * Fetch available models and send them to the webview
     */
    private async fetchAndSendModels(apiKey: string) {
        if (!apiKey) {
            // If no API key, send empty models list
            this.panel.webview.postMessage({
                command: "updateModels",
                models: [],
                selectedModel: this.config.llmModel || OPENROUTER_DEFAULT_MODEL,
            });
            return;
        }

        try {
            // Show loading status
            vscode.window.setStatusBarMessage("Fetching available models...", 3000);

            // Fetch models from OpenRouter API
            const models = await fetchAvailableModels(apiKey);

            // Send models to webview
            this.panel.webview.postMessage({
                command: "updateModels",
                models,
                selectedModel: this.config.llmModel || OPENROUTER_DEFAULT_MODEL,
            });
        } catch (error) {
            console.error("Error fetching models:", error);

            // Send error to webview
            this.panel.webview.postMessage({
                command: "updateModels",
                models: [],
                selectedModel: this.config.llmModel || OPENROUTER_DEFAULT_MODEL,
                error: error instanceof Error ? error.message : String(error),
            });

            // Show error notification
            vscode.window.showErrorMessage(
                `Failed to fetch models: ${error instanceof Error ? error.message : String(error)}`,
            );
        }
    }

    /**
     * Save configuration
     */
    private async saveConfig(config: GlobalConfig) {
        console.log("Saving configuration", config);
        try {
            // Extract API key and store it securely
            const apiKey = config.llmApiKey || "";
            await secretsManager.storeApiKey(apiKey);

            // Remove API key from the config object before storing in global state
            const configWithoutApiKey = { ...config, llmApiKey: "" };

            // Save configuration without API key
            await this.context.globalState.update(CONFIG_KEY, configWithoutApiKey);
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
