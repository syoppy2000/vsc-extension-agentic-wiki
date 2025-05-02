import * as vscode from "vscode";
import * as path from "path";

// 获取 wiki 页面路径
export function getWikiPath(): string {
    if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
        throw new Error("未打开工作区，无法确定 Wiki 路径");
    }
    return path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, "wiki");
}

// 确保目录存在
export async function ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
        await vscode.workspace.fs.stat(vscode.Uri.file(dirPath));
    } catch {
        // 目录不存在，创建它
        await vscode.workspace.fs.createDirectory(vscode.Uri.file(dirPath));
    }
}
