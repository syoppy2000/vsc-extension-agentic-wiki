import * as vscode from "vscode";
import * as path from "path";

// Get wiki page path
export function getWikiPath(): string {
    if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
        throw new Error("No workspace open, cannot determine Wiki path");
    }
    return path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, "wiki");
}

// Ensure directory exists
export async function ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
        await vscode.workspace.fs.stat(vscode.Uri.file(dirPath));
    } catch {
        // Directory doesn't exist, create it
        await vscode.workspace.fs.createDirectory(vscode.Uri.file(dirPath));
    }
}
