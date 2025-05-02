import { Node } from "pocketflow";
import YAML from "yaml";

import { Abstraction, FileInfo, IdentifyAbstractionsPrepResult, SharedStore } from "../types";
import { callLlm } from "../callLlm";

export default class IdentifyAbstractionsNode extends Node<SharedStore> {
    // 构建 LLM 上下文和参数
    async prep(shared: SharedStore): Promise<IdentifyAbstractionsPrepResult> {
        const filesData: FileInfo[] = shared.files || [];
        const projectName: string = shared.projectName || "Unknown Project";
        const language: string = shared.language || "english";
        const useCache: boolean = shared.useCache !== undefined ? shared.useCache : true;
        const maxAbstractionNum: number = shared.maxAbstractionNum || 10;

        if (filesData.length === 0) {
            throw new Error("无法识别抽象，因为没有文件数据。");
        }

        const { context, fileInfo } = this.createLlmContext(filesData);
        const fileListingForPrompt = fileInfo.map(({ index, path }) => `- ${index} # ${path}`).join("\n");

        return {
            context,
            fileListingForPrompt,
            fileCount: filesData.length,
            projectName,
            language,
            useCache,
            maxAbstractionNum,
            apiKey: shared.llmApiKey,
        };
    }

    // 调用 LLM 识别抽象并验证结果
    async exec(preRes: IdentifyAbstractionsPrepResult): Promise<Abstraction[]> {
        const { context, fileListingForPrompt, fileCount, projectName, language, useCache, maxAbstractionNum } = preRes;
        console.log("正在使用 LLM 识别抽象...");
        const prompt = this.buildPrompt(projectName, context, language, maxAbstractionNum, fileListingForPrompt);
        const response = await callLlm(prompt, { useCache, llmApiKey: preRes.apiKey });
        const validatedAbstractions = this.parseAndValidateResponse(response, fileCount);

        console.log(`已识别 ${validatedAbstractions.length} 个抽象。`);
        return validatedAbstractions;
    }

    // 结果存入共享存储
    async post(shared: SharedStore, _: unknown, execRes: Abstraction[]): Promise<string | undefined> {
        shared.abstractions = execRes;
        return undefined;
    }

    private createLlmContext(filesData: FileInfo[]) {
        let context = "";
        const fileInfo: Array<{ index: number; path: string }> = [];

        filesData.forEach((file, index) => {
            const entry = `--- File Index ${index}: ${file.path} ---\n${file.content}\n\n`;
            context += entry;
            fileInfo.push({ index, path: file.path });
        });
        return { context, fileInfo };
    }

    private buildPrompt(
        projectName: string,
        context: string,
        language: string,
        maxAbstractionNum: number,
        fileListingForPrompt: string,
    ): string {
        let languageInstruction = "";
        let nameLangHint = "";
        let descLangHint = "";
        const capitalizedLanguage = language.charAt(0).toUpperCase() + language.slice(1);

        if (language.toLowerCase() !== "english") {
            languageInstruction = `IMPORTANT: Generate the \`name\` and \`description\` for each abstraction in **${capitalizedLanguage}** language. Do NOT use English for these fields.\n\n`;
            nameLangHint = ` (value in ${capitalizedLanguage})`;
            descLangHint = ` (value in ${capitalizedLanguage})`;
        }

        return `
For the project \`${projectName}\`:

Codebase Context:
${context}

${languageInstruction}Analyze the codebase context.
Identify the top 5-${maxAbstractionNum} core most important abstractions to help those new to the codebase.

For each abstraction, provide:
1. A concise \`name\`${nameLangHint}.
2. A beginner-friendly \`description\` explaining what it is with a simple analogy, in around 100 words${descLangHint}.
3. A list of relevant \`file_indices\` (integers) using the format \`idx # path/comment\`.

List of file indices and paths present in the context:
${fileListingForPrompt}

Format the output as a YAML list of dictionaries:

\`\`\`yaml
- name: |
    Query Processing${nameLangHint}
  description: |
    Explains what the abstraction does.
    It's like a central dispatcher routing requests.${descLangHint}
  file_indices:
    - 0 # path/to/file1.ts
    - 3 # path/to/related.ts
- name: |
    Query Optimization${nameLangHint}
  description: |
    Another core concept, similar to a blueprint for objects.${descLangHint}
  file_indices:
    - 5 # path/to/another.js
# ... up to ${maxAbstractionNum} abstractions
\`\`\``;
    }

    private parseAndValidateResponse(response: string, fileCount: number): Abstraction[] {
        let yamlStr = "";
        try {
            yamlStr = response.trim().split("```yaml")[1].split("```")[0].trim();
        } catch (error) {
            throw new Error(`无法从 LLM 响应中提取 YAML 内容: ${response}`);
        }

        let rawAbstractions: any;
        try {
            rawAbstractions = YAML.parse(yamlStr);
        } catch (error: any) {
            throw new Error(`YAML 解析失败: ${error.message}\nYAML content:\n${yamlStr}`);
        }

        if (!Array.isArray(rawAbstractions)) {
            throw new Error(`LLM 输出不是一个列表 (array)。实际类型: ${typeof rawAbstractions}`);
        }

        return this.validateAbstractions(rawAbstractions, fileCount);
    }

    private validateAbstractions(rawAbstractions: any[], fileCount: number): Abstraction[] {
        const validatedAbstractions: Abstraction[] = [];

        for (const item of rawAbstractions) {
            if (typeof item !== "object" || item === null) {
                console.warn(`跳过无效的抽象项目 (非对象): ${JSON.stringify(item)}`);
                continue;
            }

            if (
                !item.name ||
                typeof item.name !== "string" ||
                !item.description ||
                typeof item.description !== "string" ||
                !item.file_indices ||
                !Array.isArray(item.file_indices)
            ) {
                throw new Error(
                    `抽象项目缺少必要的键 (name, description, file_indices) 或类型错误: ${JSON.stringify(item)}`,
                );
            }

            const validatedIndices = this.validateFileIndices(item.file_indices, fileCount, item.name);

            validatedAbstractions.push({
                name: item.name.trim(),
                description: item.description.trim(),
                files: validatedIndices,
            });
        }

        if (validatedAbstractions.length === 0 && rawAbstractions.length > 0) {
            throw new Error("所有从 LLM 返回的抽象项目都无效。");
        }

        return validatedAbstractions;
    }

    private validateFileIndices(rawIndices: any[], fileCount: number, abstractionName: string): number[] {
        const validatedIndices: Set<number> = new Set(); // 使用 Set 去重

        for (const idxEntry of rawIndices) {
            let idx: number | null = null;
            try {
                if (typeof idxEntry === "number") {
                    idx = idxEntry;
                } else if (typeof idxEntry === "string") {
                    // 尝试匹配 "数字 # 注释" 或纯数字
                    const match = idxEntry.match(/^\s*(\d+)/);
                    if (match) {
                        idx = parseInt(match[1], 10);
                    } else {
                        throw new Error(`无法从字符串 '${idxEntry}' 中解析索引`);
                    }
                } else {
                    throw new Error(`无效的索引条目类型: ${typeof idxEntry}`);
                }

                if (idx === null || isNaN(idx) || idx < 0 || idx >= fileCount) {
                    throw new Error(`无效的文件索引 ${idx}。有效范围是 0 到 ${fileCount - 1}。`);
                }
                validatedIndices.add(idx);
            } catch (error: any) {
                // 包装错误信息，提供更多上下文
                throw new Error(
                    `解析抽象 "${abstractionName}" 的文件索引失败: 条目 '${idxEntry}', 错误: ${error.message}`,
                );
            }
        }
        // 排序后转为数组
        return Array.from(validatedIndices).sort((a, b) => a - b);
    }
}
