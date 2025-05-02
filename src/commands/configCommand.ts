import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { GlobalConfig } from "../types";
import { CONFIG_KEY, DEFAULT_CONFIG, OUTPUT_DIR } from "../constants";

export function registerConfigCommand(context: vscode.ExtensionContext) {
    const config = vscode.commands.registerCommand("deep-wiki.config", async () => {
        try {
            // 创建并显示配置表单
            const configPanel = new ConfigPanel(context);
            configPanel.show();
        } catch (error) {
            vscode.window.showErrorMessage(`配置失败: ${error instanceof Error ? error.message : String(error)}`);
        }
    });

    context.subscriptions.push(config);
}

/**
 * 配置面板类
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

        // 创建 WebView 面板
        this.panel = vscode.window.createWebviewPanel("deepWikiConfig", "Deep Wiki 配置", vscode.ViewColumn.One, {
            enableScripts: true,
            retainContextWhenHidden: true,
            localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, "media"))],
        });

        // 设置 WebView 内容
        this.panel.webview.html = this.getWebviewContent();

        // 处理来自 WebView 的消息
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
     * 显示配置面板
     */
    public show() {
        this.panel.reveal();
    }

    /**
     * 保存配置
     */
    private async saveConfig(config: GlobalConfig) {
        console.log("保存配置", config);
        try {
            // 保存配置
            await this.context.globalState.update(CONFIG_KEY, config);
            vscode.window.showInformationMessage("配置已保存");
            this.panel.dispose(); // 保存后关闭面板
        } catch (error) {
            vscode.window.showErrorMessage(`保存配置失败: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * 获取 WebView 内容
     */
    private getWebviewContent() {
        // 将配置对象转换为 JSON 字符串，用于初始化表单
        const configJson = JSON.stringify(this.config);

        // 获取当前工作区文件夹
        let workspaceFolder = "";
        if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
            workspaceFolder = vscode.workspace.workspaceFolders[0].uri.fsPath;
        }

        // 读取HTML模板文件
        const templatePath = path.join(this.context.extensionPath, "src/templates/configTemplate.html");
        let templateContent = fs.readFileSync(templatePath, "utf8");

        // 替换模板中的变量
        templateContent = templateContent
            .replace("${configJson}", configJson)
            .replace("${workspaceFolder}", workspaceFolder);

        return templateContent;
    }
}
