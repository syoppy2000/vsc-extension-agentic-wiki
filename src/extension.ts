import * as vscode from "vscode";
import { registerGenerateCommand } from "./commands/generateCommand";
import { registerOpenCommand } from "./commands/openCommand";
import { registerConfigCommand } from "./commands/configCommand";
import { registerEventListeners } from "./listeners";

const outputChannel = vscode.window.createOutputChannel("Agentic Wiki");
export function log(message: string) {
    outputChannel.appendLine(message);
}

export function activate(context: vscode.ExtensionContext) {
    log('Congratulations, your extension "agentic-wiki" is now active!');

    registerGenerateCommand(context);
    registerOpenCommand(context);
    registerConfigCommand(context);

    registerEventListeners(context);
}

export function deactivate() {}
