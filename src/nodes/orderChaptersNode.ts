import { Node } from "pocketflow";
import YAML from "yaml";
import { callLlm } from "../callLlm";
import { ChapterOrderPreResult, SharedStore } from "../types";

export default class OrderChaptersNode extends Node<SharedStore> {
    async prep(shared: SharedStore): Promise<ChapterOrderPreResult> {
        const abstractions = shared.abstractions; // 名称/描述可能已翻译
        const relationships = shared.relationships; // 摘要/标签可能已翻译
        const projectName = shared.projectName || "";
        const language = shared.language || "english";
        const useCache = shared.useCache !== undefined ? shared.useCache : true;

        // 为 LLM 准备上下文
        const abstractionInfoForPrompt: string[] = [];
        for (let i = 0; i < abstractions.length; i++) {
            abstractionInfoForPrompt.push(`- ${i} # ${abstractions[i].name}`); // 使用可能已翻译的名称
        }
        const abstractionListing = abstractionInfoForPrompt.join("\n");

        // 使用可能已翻译的摘要和标签
        let summaryNote = "";
        if (language.toLowerCase() !== "english") {
            summaryNote = ` (Note: Project Summary might be in ${language.charAt(0).toUpperCase() + language.slice(1)})`;
        }

        let context = `Project Summary${summaryNote}:\n${relationships.summary}\n\n`;
        context += "Relationships (Indices refer to abstractions above):\n";
        for (const rel of relationships.details) {
            const fromName = abstractions[rel.from].name;
            const toName = abstractions[rel.to].name;
            // 使用可能已翻译的 'label'
            context += `- From ${rel.from} (${fromName}) to ${rel.to} (${toName}): ${rel.label}\n`;
        }

        let listLangNote = "";
        if (language.toLowerCase() !== "english") {
            listLangNote = ` (Names might be in ${language.charAt(0).toUpperCase() + language.slice(1)})`;
        }
        const apiKey = shared.llmApiKey;

        return {
            abstractionListing,
            context,
            numAbstractions: abstractions.length,
            projectName,
            listLangNote,
            useCache,
            apiKey,
        };
    }

    async exec(prepRes: ChapterOrderPreResult): Promise<number[]> {
        const { abstractionListing, context, numAbstractions, projectName, listLangNote, useCache } = prepRes;

        console.log("Determining chapter order using LLM...");

        // 无需在提示指令中进行语言变化，只需基于结构进行排序
        // 输入名称可能已翻译，因此有注释
        const prompt = `
    Given the following project abstractions and their relationships for the project \`\`\`\` ${projectName} \`\`\`\`:
    
    Abstractions (Index # Name)${listLangNote}:
    ${abstractionListing}
    
    Context about relationships and project summary:
    ${context}
    
    If you are going to make a tutorial for \`\`\`\` ${projectName} \`\`\`\`, what is the best order to explain these abstractions, from first to last?
    Ideally, first explain those that are the most important or foundational, perhaps user-facing concepts or entry points. Then move to more detailed, lower-level implementation details or supporting concepts.
    
    Output the ordered list of abstraction indices, including the name in a comment for clarity. Use the format \`idx # AbstractionName\`.
    
    \`\`\`yaml
    - 2 # FoundationalConcept
    - 0 # CoreClassA
    - 1 # CoreClassB (uses CoreClassA)
    - ...
    \`\`\`
    
    Now, provide the YAML output:
    `;
        const response = await callLlm(prompt, {
            llmApiKey: prepRes.apiKey,
            useCache,
        });

        // --- 验证 ---
        const yamlStr = response.trim().split("```yaml")[1].split("```")[0].trim();
        const orderedIndicesRaw = YAML.parse(yamlStr) as any[];

        if (!Array.isArray(orderedIndicesRaw)) {
            throw new Error("LLM output is not a list");
        }

        const orderedIndices: number[] = [];
        const seenIndices = new Set<number>();

        for (const entry of orderedIndicesRaw) {
            try {
                let idx: number;

                if (typeof entry === "number") {
                    idx = entry;
                } else if (typeof entry === "string" && entry.includes("#")) {
                    idx = parseInt(entry.split("#")[0].trim(), 10);
                } else {
                    idx = parseInt(String(entry).trim(), 10);
                }

                if (!(0 <= idx && idx < numAbstractions)) {
                    throw new Error(`Invalid index ${idx} in ordered list. Max index is ${numAbstractions - 1}.`);
                }

                if (seenIndices.has(idx)) {
                    throw new Error(`Duplicate index ${idx} found in ordered list.`);
                }

                orderedIndices.push(idx);
                seenIndices.add(idx);
            } catch (error) {
                throw new Error(`Could not parse index from ordered list entry: ${entry}`);
            }
        }

        // 检查是否包含所有抽象
        if (orderedIndices.length !== numAbstractions) {
            const missingIndices = [...Array(numAbstractions).keys()].filter(i => !seenIndices.has(i));

            throw new Error(
                `Ordered list length (${orderedIndices.length}) does not match number of abstractions (${numAbstractions}). Missing indices: ${missingIndices}`,
            );
        }

        console.log(`Determined chapter order (indices): ${orderedIndices}`);
        return orderedIndices; // 返回索引列表
    }

    async post(
        shared: SharedStore,
        prepRes: [string, string, number, string, string, boolean],
        execRes: number[],
    ): Promise<string | undefined> {
        // execRes 已经是有序索引列表
        shared.chapterOrder = execRes; // 索引列表
        return undefined;
    }
}
