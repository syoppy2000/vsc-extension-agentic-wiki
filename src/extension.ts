import * as vscode from "vscode";
import { registerGenerateCommand } from "./commands/generateCommand";
import { registerOpenCommand } from "./commands/openCommand";

export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "deep-wiki" is now active!');

    // 注册命令
    registerGenerateCommand(context);
    registerOpenCommand(context);

    // 如果未来有更多命令，只需在此处添加导入和调用即可
    // import { registerAnotherCommand } from './commands/anotherCommand';
    // registerAnotherCommand(context);
}

export function deactivate() {}
