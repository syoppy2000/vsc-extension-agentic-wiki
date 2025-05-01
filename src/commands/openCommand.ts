import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { getWikiPath } from '../utils';

export function registerOpenCommand(context: vscode.ExtensionContext) {
    const open = vscode.commands.registerCommand('deep-wiki.open', async () => {
        try {
            const wikiPath = getWikiPath();
            const fileName = `agentic-wiki.md`;
            const filePath = path.join(wikiPath, fileName);

            // 检查文件是否存在
            if (!fs.existsSync(filePath)) {
                const result = await vscode.window.showErrorMessage(
                    'Wiki 页面不存在！是否要创建一个新的 Wiki 页面？',
                    '是', '否'
                );

                if (result === '是') {
                    vscode.commands.executeCommand('deep-wiki.generate');
                }
                return;
            }

            // Open markdown preview in VS Code using Markdown Preview Enhanced
            const document = await vscode.workspace.openTextDocument(filePath);
            await vscode.window.showTextDocument(document);
            await vscode.commands.executeCommand('markdown-preview-enhanced.openPreview');
            // 使用状态栏消息替代，3秒后自动消失
            vscode.window.setStatusBarMessage('Wiki page opened in Markdown Preview Enhanced', 3000);
        } catch (error) {
            vscode.window.showErrorMessage(`打开 Wiki 页面失败: ${error instanceof Error ? error.message : String(error)}`);
        }
    });

    context.subscriptions.push(open);
}