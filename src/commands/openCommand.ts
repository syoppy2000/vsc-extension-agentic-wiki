import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { getWikiPath } from "../utils";

/**
 * Check if an extension is installed
 * @param extensionId The extension ID to check
 * @returns True if the extension is installed, false otherwise
 */
async function isExtensionInstalled(extensionId: string): Promise<boolean> {
    return !!vscode.extensions.getExtension(extensionId);
}

export function registerOpenCommand(context: vscode.ExtensionContext) {
    const open = vscode.commands.registerCommand("agentic-wiki.open", async () => {
        try {
            const wikiPath = getWikiPath();
            const fileName = "index.md";
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

            // Open the document first
            const document = await vscode.workspace.openTextDocument(filePath);
            await vscode.window.showTextDocument(document);

            // Try to open markdown preview based on available extensions
            const mpeInstalled = await isExtensionInstalled("shd101wyy.markdown-preview-enhanced");

            if (mpeInstalled) {
                // If Markdown Preview Enhanced is installed, use it
                try {
                    await vscode.commands.executeCommand("markdown-preview-enhanced.openPreview");
                    vscode.window.setStatusBarMessage("Wiki page opened in Markdown Preview Enhanced", 3000);
                    return;
                } catch (previewError) {
                    console.log(
                        "Failed to open with Markdown Preview Enhanced, falling back to built-in preview:",
                        previewError,
                    );
                    // Fall back to built-in preview if MPE fails
                }
            }

            // Use VS Code's built-in markdown preview as fallback
            try {
                await vscode.commands.executeCommand("markdown.showPreview");
                vscode.window.setStatusBarMessage("Wiki page opened in Markdown Preview", 3000);
            } catch (builtInError) {
                // If both preview methods fail, at least the document is open in the editor
                console.error("Failed to open markdown preview:", builtInError);
                vscode.window.setStatusBarMessage("Wiki page opened in editor", 3000);
            }
        } catch (error) {
            vscode.window.showErrorMessage(
                `Failed to open Wiki page: ${error instanceof Error ? error.message : String(error)}`,
            );
        }
    });

    context.subscriptions.push(open);
}
