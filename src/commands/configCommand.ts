import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { GlobalConfig } from "../types";

// 配置存储的键名
const CONFIG_KEY = "deep-wiki.config";

const OUTPUT_DIR = "deep-wiki";

// 默认包含模式
const DEFAULT_INCLUDE_PATTERNS = [
    "*.py",
    "*.js",
    "*.jsx",
    "*.ts",
    "*.tsx",
    "*.go",
    "*.java",
    "*.pyi",
    "*.pyx",
    "*.c",
    "*.cc",
    "*.cpp",
    "*.h",
    "*.md",
    "*.rst",
    "Dockerfile",
    "Makefile",
    "*.yaml",
    "*.yml",
];
// 默认排除模式
const DEFAULT_EXCLUDE_PATTERNS = [
    "assets/*",
    "data/*",
    "examples/*",
    "images/*",
    "public/*",
    "static/*",
    "temp/*",
    "docs/*",
    "*.env",
    "*.env.*",
    "*.lock",
    "venv/*",
    ".venv/*",
    "*test*",
    "tests/*",
    "docs/*",
    "examples/*",
    "v1/*",
    "dist/*",
    "build/*",
    "experimental/*",
    "deprecated/*",
    "misc/*",
    "legacy/*",
    ".git/*",
    ".github/*",
    ".next/*",
    ".vscode/*",
    "obj/*",
    "bin/*",
    "node_modules/*",
    "*.log",
];

// LLM 提供商列表
const LLM_PROVIDERS = ["OpenAI", "Anthropic", "Azure OpenAI", "Google AI", "自定义"];

// 各提供商的模型列表
const LLM_MODELS: Record<string, string[]> = {
    OpenAI: ["gpt-4", "gpt-4-turbo", "gpt-3.5-turbo"],
    Anthropic: ["claude-3-opus", "claude-3-sonnet", "claude-3-haiku"],
    "Azure OpenAI": ["gpt-4", "gpt-4-turbo", "gpt-3.5-turbo"],
    "Google AI": ["gemini-pro", "gemini-ultra"],
    自定义: [],
};

const DEFAULT_CONFIG: GlobalConfig = {
    llmApiKey: "",
    localDir: "./",
    projectName: null,
    outputDir: "./deep-wiki",
    includePatterns: DEFAULT_INCLUDE_PATTERNS,
    excludePatterns: DEFAULT_EXCLUDE_PATTERNS,
    maxFileSize: 100,
    language: "English",
    useCache: true,
    maxAbstractionNum: 10,
};

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
        this.config = context.globalState.get<GlobalConfig>(CONFIG_KEY) || ({} as GlobalConfig);

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
