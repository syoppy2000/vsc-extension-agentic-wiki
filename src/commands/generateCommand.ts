import * as vscode from "vscode";
import { CONFIG_KEY } from "../constants";
import { createFlow } from "../flow";
import { SharedStore } from "../types";

export function registerGenerateCommand(context: vscode.ExtensionContext) {
    const generate = vscode.commands.registerCommand("deep-wiki.generate", async () => {
        // 使用进度条显示生成过程
        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: "正在生成 Wiki 页面...",
                cancellable: true,
            },
            async (progress, token) => {
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
                    // const wiki = generateRandomWikiContent();
                    await new Promise(resolve => setTimeout(resolve, 1000));

                    // 准备文件路径
                    progress.report({ increment: 30, message: "正在准备文件..." });
                    // const wikiPath = getWikiPath();

                    const flow = createFlow();
                    let shared = context.globalState.get<SharedStore>(CONFIG_KEY) || ({} as SharedStore);
                    flow.setParams({ ...shared });
                    await flow.run(shared);
                    console.log(shared);

                    // 确保 wiki 目录存在
                    // await ensureDirectoryExists(wikiPath);

                    // const fileName = `agentic-wiki.md`;
                    // const filePath = path.join(wikiPath, fileName);

                    // 写入文件
                    progress.report({ increment: 30, message: "正在写入文件..." });
                    // await vscode.workspace.fs.writeFile(vscode.Uri.file(filePath), Buffer.from(wiki));
                    progress.report({ increment: 10, message: "Wiki 页面已成功生成！" });
                    vscode.commands.executeCommand("deep-wiki.open");
                } catch (error) {
                    vscode.window.showErrorMessage(
                        `生成 Wiki 页面失败: ${error instanceof Error ? error.message : String(error)}`,
                    );
                }
            },
        );
    });

    context.subscriptions.push(generate);
}
