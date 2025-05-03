import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { getWikiPath } from "../utils";

export function registerOpenCommand(context: vscode.ExtensionContext) {
    const open = vscode.commands.registerCommand("agentic-wiki.open", async () => {
        try {
            const wikiPath = getWikiPath();
            const fileName = `agentic-wiki.md`;
            const filePath = path.join(wikiPath, fileName);

            // Check if file exists
            if (!fs.existsSync(filePath)) {
                const result = await vscode.window.showErrorMessage(
                    "Wiki page does not exist! Do you want to create a new Wiki page?",
                    "Yes",
                    "No",
                );

                if (result === "Yes") {
                    vscode.commands.executeCommand("agentic-wiki.generate");
                }
                return;
            }

            // Open markdown preview in VS Code using Markdown Preview Enhanced
            const document = await vscode.workspace.openTextDocument(filePath);
            await vscode.window.showTextDocument(document);
            await vscode.commands.executeCommand("markdown-preview-enhanced.openPreview");
            // Use status bar message instead, disappears after 3 seconds
            vscode.window.setStatusBarMessage("Wiki page opened in Markdown Preview Enhanced", 3000);
        } catch (error) {
            vscode.window.showErrorMessage(
                `Failed to open Wiki page: ${error instanceof Error ? error.message : String(error)}`,
            );
        }
    });

    context.subscriptions.push(open);
}
