import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export function activate(context: vscode.ExtensionContext) {

	// 注册生成 wiki 页面的命令
	const generate = vscode.commands.registerCommand('deep-wiki.generate', async () => {
		// 使用进度条显示生成过程
		await vscode.window.withProgress({
			location: vscode.ProgressLocation.Notification,
			title: "正在生成 Wiki 页面...",
			cancellable: true
		}, async (progress, token) => {
			// 检查是否取消操作
			if (token.isCancellationRequested) {
				return;
			}

			try {
				// 初始化进度
				progress.report({ increment: 0, message: "正在初始化..." });
				await new Promise(resolve => setTimeout(resolve, 800));

				// 生成随机 mock 内容
				progress.report({ increment: 30, message: "正在生成内容..." });
				const wiki = generateRandomWikiContent();
				await new Promise(resolve => setTimeout(resolve, 1000));

				// 准备文件路径
				progress.report({ increment: 30, message: "正在准备文件..." });
				const wikiPath = getWikiPath();
				
				// 确保 wiki 目录存在
				await ensureDirectoryExists(wikiPath);
				
				const fileName = `agentic-wiki.md`;
				const filePath = path.join(wikiPath, fileName);
				
				// 写入文件
				progress.report({ increment: 30, message: "正在写入文件..." });
				await vscode.workspace.fs.writeFile(vscode.Uri.file(filePath), Buffer.from(wiki));
				progress.report({ increment: 10, message: "Wiki 页面已成功生成！" });
				vscode.commands.executeCommand('deep-wiki.open');
			} catch (error) {
				vscode.window.showErrorMessage(`生成 Wiki 页面失败: ${error instanceof Error ? error.message : String(error)}`);
			}
		});
	});

	// 注册在浏览器中打开 wiki 页面的命令
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
			const message = vscode.window.showInformationMessage('Wiki page opened in Markdown Preview Enhanced');
		} catch (error) {
			vscode.window.showErrorMessage(`打开 Wiki 页面失败: ${error instanceof Error ? error.message : String(error)}`);
		}
	});

	context.subscriptions.push(generate, open);
}

export function deactivate() {}

// 获取 wiki 页面路径
function getWikiPath(): string {
	if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
		throw new Error('未打开工作区，无法确定 Wiki 路径');
	}
	return path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, 'wiki');
}

// 确保目录存在
async function ensureDirectoryExists(dirPath: string): Promise<void> {
	try {
		await vscode.workspace.fs.stat(vscode.Uri.file(dirPath));
	} catch {
		// 目录不存在，创建它
		await vscode.workspace.fs.createDirectory(vscode.Uri.file(dirPath));
	}
}

// 生成随机 Wiki 内容
function generateRandomWikiContent(): string {
	const titles = ['项目概述', '技术架构', '开发指南', '常见问题', '最佳实践'];
	const randomTitle = titles[Math.floor(Math.random() * titles.length)];
	
	const date = new Date().toLocaleDateString('zh-CN');
	
	return `# ${randomTitle}

## 简介
这是一个自动生成的 Wiki 页面，创建于 ${date}。

## 内容概要
- 项目背景
- 核心功能
- 技术选型
- 开发流程

## 详细说明
这里可以添加更多关于项目的详细信息和文档。

## 参考资料
- [官方文档](https://example.com/docs)
- [开发指南](https://example.com/guide)
`;
}
