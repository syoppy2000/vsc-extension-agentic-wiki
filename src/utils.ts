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

// 生成随机 Wiki 内容
export function generateRandomWikiContent(): string {
    const titles = ["项目概述", "技术架构", "开发指南", "常见问题", "最佳实践"];
    const randomTitle = titles[Math.floor(Math.random() * titles.length)];

    const date = new Date().toLocaleDateString("zh-CN");

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
