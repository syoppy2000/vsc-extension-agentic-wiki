import * as vscode from "vscode";
import { registerGenerateCommand } from "./commands/generateCommand";
import { registerOpenCommand } from "./commands/openCommand";
import { registerConfigCommand } from "./commands/configCommand";

export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "deep-wiki" is now active!');

    // Register commands
    registerGenerateCommand(context);
    registerOpenCommand(context);
    registerConfigCommand(context);

    // If there are more commands in the future, just add imports and calls here
    // import { registerAnotherCommand } from './commands/anotherCommand';
    // registerAnotherCommand(context);
}

export function deactivate() {}
