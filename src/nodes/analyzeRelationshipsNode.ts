import path from "path";
import YAML from "yaml";
import { Node } from "pocketflow";
import {
    Abstraction,
    FileInfo,
    SharedStore,
    AnalyzeRelationshipsPrepResult,
    RelationshipsResult,
    Relationship,
} from "../types";
import { callLlm } from "../callLlm";

/**
 * 获取指定索引的文件内容
 */
function getContentForIndices(filesData: FileInfo[], indices: number[]): Record<string, string> {
    const contentMap: Record<string, string> = {};

    for (const i of indices) {
        if (0 <= i && i < filesData.length) {
            const file = filesData[i];
            contentMap[`${i} # ${file.path}`] = file.content;
        }
    }

    return contentMap;
}

export default class AnalyzeRelationshipsNode extends Node<SharedStore> {
    /**
     * 准备分析关系所需的上下文和数据
     */
    async prep(shared: SharedStore): Promise<AnalyzeRelationshipsPrepResult> {
        const abstractions: Abstraction[] = shared.abstractions || [];
        const filesData: FileInfo[] = shared.files || [];
        const projectName: string = shared.projectName || "Unknown Project";
        const language: string = shared.language || "english";
        const useCache: boolean = shared.useCache !== undefined ? shared.useCache : true;

        // 创建带有抽象名称、索引、描述和相关文件片段的上下文
        let context = "Identified Abstractions:\n";
        const allRelevantIndices = new Set<number>();
        const abstractionInfoForPrompt: string[] = [];

        // 处理每个抽象
        for (let i = 0; i < abstractions.length; i++) {
            const abstr = abstractions[i];
            // 使用直接包含索引的'files'
            const fileIndicesStr = abstr.files.join(", ");

            // 抽象名称和描述可能已被翻译
            const infoLine = `- Index ${i}: ${abstr.name} (Relevant file indices: [${fileIndicesStr}])\n  Description: ${abstr.description}`;
            context += infoLine + "\n";

            // 这里也使用可能已翻译的名称
            abstractionInfoForPrompt.push(`${i} # ${abstr.name}`);

            // 收集所有相关文件索引
            abstr.files.forEach(idx => allRelevantIndices.add(idx));
        }

        // 添加相关文件片段
        context += "\nRelevant File Snippets (Referenced by Index and Path):\n";

        // 获取相关文件的内容
        const relevantFilesContentMap = getContentForIndices(filesData, Array.from(allRelevantIndices).sort());

        // 格式化文件内容
        const fileContextStr = Object.entries(relevantFilesContentMap)
            .map(([idxPath, content]) => `--- File: ${idxPath} ---\n${content}`)
            .join("\n\n");

        context += fileContextStr;

        return {
            context,
            abstractionListing: abstractionInfoForPrompt.join("\n"),
            projectName,
            language,
            useCache,
            numAbstractions: abstractions.length,
            apiKey: shared.llmApiKey!,
        };
    }

    /**
     * 执行关系分析
     */
    async exec(prepRes: AnalyzeRelationshipsPrepResult): Promise<RelationshipsResult> {
        const { context, abstractionListing, projectName, language, useCache, numAbstractions } = prepRes;

        console.log("使用LLM分析关系...");

        // 构建提示
        const prompt = this.buildPrompt(projectName, abstractionListing, context, language);

        // 调用LLM
        const response = await callLlm(prompt, { useCache, llmApiKey: prepRes.apiKey });

        // 解析和验证响应
        const result = this.parseAndValidateResponse(response, numAbstractions);

        console.log("已生成项目摘要和关系详情。");
        return result;
    }

    /**
     * 处理结果并存储到共享存储中
     */
    async post(shared: SharedStore, _: unknown, execRes: RelationshipsResult): Promise<string | undefined> {
        // 结构现在是 {"summary": str, "details": [{"from": int, "to": int, "label": str}]}
        // summary 和 label 可能已被翻译
        shared.relationships = execRes;
        return undefined;
    }

    private extractYamlFromResponse(response: string): string {
        try {
            return response.trim().split("```yaml")[1].split("```")[0].trim();
        } catch (error) {
            throw new Error(`无法从LLM响应中提取YAML内容: ${response}`);
        }
    }

    private validateRelationshipsData(data: any): boolean {
        if (!data || typeof data !== "object") {
            throw new Error("LLM输出不是一个对象");
        }

        if (!("summary" in data) || !("relationships" in data)) {
            throw new Error("LLM输出缺少必要的键('summary', 'relationships')");
        }

        if (typeof data.summary !== "string") {
            throw new Error("summary不是字符串");
        }

        if (!Array.isArray(data.relationships)) {
            throw new Error("relationships不是数组");
        }

        return true;
    }

    private validateRelationships(relationshipsData: any, numAbstractions: number): Relationship[] {
        const validatedRelationships: Relationship[] = [];

        for (const rel of relationshipsData.relationships) {
            // 检查必要的键
            if (
                !rel ||
                typeof rel !== "object" ||
                !("from_abstraction" in rel) ||
                !("to_abstraction" in rel) ||
                !("label" in rel)
            ) {
                throw new Error(
                    `缺少键(期望from_abstraction, to_abstraction, label)在关系项中: ${JSON.stringify(rel)}`,
                );
            }

            // 验证label是字符串
            if (typeof rel.label !== "string") {
                throw new Error(`关系标签不是字符串: ${JSON.stringify(rel)}`);
            }

            // 验证索引
            try {
                const fromIdx = parseInt(String(rel.from_abstraction).split("#")[0].trim());
                const toIdx = parseInt(String(rel.to_abstraction).split("#")[0].trim());

                if (!(0 <= fromIdx && fromIdx < numAbstractions) || !(0 <= toIdx && toIdx < numAbstractions)) {
                    throw new Error(
                        `关系中的索引无效: from=${fromIdx}, to=${toIdx}. 最大索引是 ${numAbstractions - 1}.`,
                    );
                }

                validatedRelationships.push({
                    from: fromIdx,
                    to: toIdx,
                    label: rel.label, // 可能已翻译的标签
                });
            } catch (error) {
                throw new Error(`无法从关系中解析索引: ${JSON.stringify(rel)}`);
            }
        }

        return validatedRelationships;
    }

    private parseAndValidateResponse(response: string, numAbstractions: number): RelationshipsResult {
        const yamlStr = this.extractYamlFromResponse(response);

        let relationshipsData: any;
        try {
            relationshipsData = YAML.parse(yamlStr);
        } catch (error: any) {
            throw new Error(`YAML解析失败: ${error.message}\nYAML内容:\n${yamlStr}`);
        }

        this.validateRelationshipsData(relationshipsData);
        const validatedRelationships = this.validateRelationships(relationshipsData, numAbstractions);

        return {
            summary: relationshipsData.summary,
            details: validatedRelationships,
        };
    }

    private buildPrompt(projectName: string, abstractionListing: string, context: string, language: string): string {
        // 仅当不是英语时添加语言指令和提示
        let languageInstruction = "";
        let langHint = "";
        let listLangNote = "";

        if (language.toLowerCase() !== "english") {
            const capitalizedLanguage = language.charAt(0).toUpperCase() + language.slice(1);
            languageInstruction = `IMPORTANT: Generate the \`summary\` and relationship \`label\` fields in **${capitalizedLanguage}** language. Do NOT use English for these fields.\n\n`;
            langHint = ` (in ${capitalizedLanguage})`;
            listLangNote = ` (Names might be in ${capitalizedLanguage})`;
        }

        return `
      Based on the following abstractions and relevant code snippets from the project \`${projectName}\`:
      
      List of Abstraction Indices and Names${listLangNote}:
      ${abstractionListing}
      
      Context (Abstractions, Descriptions, Code):
      ${context}
      
      ${languageInstruction}Please provide:
      1. A high-level \`summary\` of the project's main purpose and functionality in a few beginner-friendly sentences${langHint}. Use markdown formatting with **bold** and *italic* text to highlight important concepts.
      2. A list (\`relationships\`) describing the key interactions between these abstractions. For each relationship, specify:
          - \`from_abstraction\`: Index of the source abstraction (e.g., \`0 # AbstractionName1\`)
          - \`to_abstraction\`: Index of the target abstraction (e.g., \`1 # AbstractionName2\`)
          - \`label\`: A brief label for the interaction **in just a few words**${langHint} (e.g., "Manages", "Inherits", "Uses").
          Ideally the relationship should be backed by one abstraction calling or passing parameters to another.
          Simplify the relationship and exclude those non-important ones.
      
      IMPORTANT: Make sure EVERY abstraction is involved in at least ONE relationship (either as source or target). Each abstraction index must appear at least once across all relationships.
      
      Format the output as YAML:
      
      \`\`\`yaml
      summary: |
        A brief, simple explanation of the project${langHint}.
        Can span multiple lines with **bold** and *italic* for emphasis.
      relationships:
        - from_abstraction: 0 # AbstractionName1
          to_abstraction: 1 # AbstractionName2
          label: "Manages"${langHint}
        - from_abstraction: 2 # AbstractionName3
          to_abstraction: 0 # AbstractionName1
          label: "Provides config"${langHint}
        # ... other relationships
      \`\`\`
      
      Now, provide the YAML output:`;
    }
}
