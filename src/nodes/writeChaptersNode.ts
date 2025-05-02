import { BatchNode } from "pocketflow";
import { callLlm } from "../callLlm";
import { ChapterInfo, ChapterItem, FileInfo, SharedStore } from "../types";

interface WriteChaptersNodePrepResult {
    itemsToProcess: ChapterItem[];
    shared: SharedStore;
}

export default class WriteChaptersNode extends BatchNode<SharedStore> {
    private chaptersWrittenSoFar: string[] = [];

    async prep(shared: SharedStore): Promise<WriteChaptersNodePrepResult> {
        const chapterOrder = shared.chapterOrder;
        const abstractions = shared.abstractions;
        const filesData = shared.files;
        const projectName = shared.projectName;
        const language = shared.language || "english";
        const useCache = shared.useCache !== undefined ? shared.useCache : true;

        // 重置临时存储
        this.chaptersWrittenSoFar = [];

        // 创建所有章节的完整列表
        const allChapters: string[] = [];
        const chapterFilenames: Record<number, ChapterInfo> = {};

        for (let i = 0; i < chapterOrder.length; i++) {
            const abstractionIndex = chapterOrder[i];

            if (abstractionIndex >= 0 && abstractionIndex < abstractions.length) {
                const chapterNum = i + 1;
                const chapterName = abstractions[abstractionIndex].name; // 可能已翻译的名称

                // 创建安全的文件名（从可能已翻译的名称）
                const safeName = chapterName.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
                const filename = `${(i + 1).toString().padStart(2, "0")}_${safeName}.md`;

                // 使用链接格式（使用可能已翻译的名称）
                allChapters.push(`${chapterNum}. [${chapterName}](${filename})`);

                // 存储章节索引到文件名的映射，用于链接
                chapterFilenames[abstractionIndex] = {
                    num: chapterNum,
                    name: chapterName,
                    filename: filename,
                };
            }
        }

        // 创建包含所有章节的格式化字符串
        const fullChapterListing = allChapters.join("\n");

        const itemsToProcess: ChapterItem[] = [];

        for (let i = 0; i < chapterOrder.length; i++) {
            const abstractionIndex = chapterOrder[i];

            if (abstractionIndex >= 0 && abstractionIndex < abstractions.length) {
                const abstractionDetails = abstractions[abstractionIndex]; // 包含可能已翻译的名称/描述

                // 直接使用 'files'（索引列表）
                const relatedFileIndices = abstractionDetails.files || [];

                // 使用辅助函数获取内容，传递索引
                const relatedFilesContentMap = this.getContentForIndices(filesData, relatedFileIndices);

                // 获取前一章节信息用于过渡（使用可能已翻译的名称）
                let prevChapter = null;
                if (i > 0) {
                    const prevIdx = chapterOrder[i - 1];
                    prevChapter = chapterFilenames[prevIdx];
                }

                // 获取下一章节信息用于过渡（使用可能已翻译的名称）
                let nextChapter = null;
                if (i < chapterOrder.length - 1) {
                    const nextIdx = chapterOrder[i + 1];
                    nextChapter = chapterFilenames[nextIdx];
                }

                itemsToProcess.push({
                    chapterNum: i + 1,
                    abstractionIndex: abstractionIndex,
                    abstractionDetails: abstractionDetails, // 具有可能已翻译的名称/描述
                    relatedFilesContentMap: relatedFilesContentMap,
                    projectName: shared.projectName || "", // 添加项目名称
                    fullChapterListing: fullChapterListing, // 添加完整章节列表（使用可能已翻译的名称）
                    chapterFilenames: chapterFilenames, // 添加章节文件名映射（使用可能已翻译的名称）
                    prevChapter: prevChapter, // 添加前一章节信息（使用可能已翻译的名称）
                    nextChapter: nextChapter, // 添加下一章节信息（使用可能已翻译的名称）
                    language: language, // 添加语言支持多语言
                });
            } else {
                console.log(`警告：章节顺序中的抽象索引 ${abstractionIndex} 无效。跳过。`);
            }
        }

        console.log(`准备编写 ${itemsToProcess.length} 个章节...`);
        return {
            itemsToProcess,
            shared,
        }; // BatchNode 的可迭代对象
    }

    async exec(item: ChapterItem): Promise<string> {
        // 这为上面准备的每个项目运行
        const abstractionName = item.abstractionDetails.name; // 可能已翻译的名称
        const abstractionDescription = item.abstractionDetails.description; // 可能已翻译的描述
        const chapterNum = item.chapterNum;
        const projectName = item.projectName;
        const language = item.language || "english";

        console.log(`使用 LLM 编写第 ${chapterNum} 章：${abstractionName}...`);

        // 从映射准备文件上下文字符串
        const fileContextStr = Object.entries(item.relatedFilesContentMap)
            .map(([idxPath, content]) => {
                const path = idxPath.includes("# ") ? idxPath.split("# ")[1] : idxPath;
                return `--- 文件: ${path} ---\n${content}`;
            })
            .join("\n\n");

        // 获取在此之前编写的章节摘要
        // 使用临时实例变量
        const previousChaptersSummary = this.chaptersWrittenSoFar.join("\n---\n");

        // 仅当不是英语时添加语言指令和上下文注释
        let languageInstruction = "";
        let conceptDetailsNote = "";
        let structureNote = "";
        let prevSummaryNote = "";
        let instructionLangNote = "";
        let mermaidLangNote = "";
        let codeCommentNote = "";
        let linkLangNote = "";
        let toneNote = "";

        if (language.toLowerCase() !== "english") {
            const langCap = language.charAt(0).toUpperCase() + language.slice(1);
            languageInstruction = `重要：用**${langCap}**编写整个教程章节。一些输入上下文（如概念名称、描述、章节列表、先前摘要）可能已经是${langCap}，但您必须将所有其他生成的内容（包括解释、示例、技术术语和可能的代码注释）翻译成${langCap}。除了代码语法、必要的专有名词或特别指定的内容外，不要使用英语。整个输出必须是${langCap}。\n\n`;
            conceptDetailsNote = ` (注：已提供${langCap}版本)`;
            structureNote = ` (注：章节名称可能是${langCap})`;
            prevSummaryNote = ` (注：此摘要可能是${langCap})`;
            instructionLangNote = ` (用${langCap})`;
            mermaidLangNote = ` (如果适当，请为标签/文本使用${langCap})`;
            codeCommentNote = ` (如果可能，请翻译成${langCap}，否则为清晰起见保留最少的英语)`;
            linkLangNote = ` (使用上面结构中的${langCap}章节标题)`;
            toneNote = ` (适合${langCap}读者)`;
        }

        const prompt = `
    ${languageInstruction}为项目 \`${projectName}\` 编写一个非常适合初学者的教程章节（Markdown 格式），关于概念："${abstractionName}"。这是第 ${chapterNum} 章。
    
    概念详情${conceptDetailsNote}：
    - 名称：${abstractionName}
    - 描述：
    ${abstractionDescription}
    
    完整教程结构${structureNote}：
    ${item.fullChapterListing}
    
    前几章的上下文${prevSummaryNote}：
    ${previousChaptersSummary || "这是第一章。"}
    
    相关代码片段（代码本身保持不变）：
    ${fileContextStr || "没有为此抽象提供特定的代码片段。"}
    
    章节指南（除非另有说明，否则用 ${language.charAt(0).toUpperCase() + language.slice(1)} 生成内容）：
    - 以清晰的标题开始（例如，\`# 第 ${chapterNum} 章：${abstractionName}\`）。使用提供的概念名称。
    
    - 如果这不是第一章，请以简短的过渡开始，从前一章${instructionLangNote}引用，使用适当的 Markdown 链接和其名称${linkLangNote}。
    
    - 以高级动机开始，解释这个抽象解决了什么问题${instructionLangNote}。从一个具体示例的中心用例开始。整个章节应引导读者了解如何解决这个用例。使其非常简洁，对初学者友好。
    
    - 如果抽象很复杂，将其分解为关键概念。以非常适合初学者的方式逐一解释每个概念${instructionLangNote}。
    
    - 解释如何使用这个抽象来解决用例${instructionLangNote}。为代码片段提供示例输入和输出（如果输出不是值，请在高级别描述将会发生什么${instructionLangNote}）。
    
    - 每个代码块应低于 10 行！如果需要更长的代码块，请将它们分解成更小的部分，并逐一讲解。积极简化代码以使其最小化。使用注释${codeCommentNote}跳过不重要的实现细节。每个代码块后面应该有一个适合初学者的解释${instructionLangNote}。
    
    - 描述内部实现以帮助理解底层原理${instructionLangNote}。首先提供一个非代码或轻代码的演练，说明调用抽象时逐步发生的情况${instructionLangNote}。建议使用带有虚拟示例的简单 sequenceDiagram - 保持最少，最多 5 个参与者以确保清晰。如果参与者名称有空格，请使用：\`participant QP as Query Processing\`。${mermaidLangNote}。
    
    - 然后深入研究内部实现的代码，并引用文件。提供示例代码块，但使它们同样简单且适合初学者。解释${instructionLangNote}。
    
    - 重要：当您需要引用其他章节中涵盖的其他核心抽象时，始终使用适当的 Markdown 链接，如：[章节标题](filename.md)。使用上面的完整教程结构找到正确的文件名和章节标题${linkLangNote}。翻译周围的文本。
    
    - 使用 mermaid 图表说明复杂概念（\`\`\`mermaid\`\`\` 格式）。${mermaidLangNote}。
    
    - 在整个过程中大量使用类比和示例${instructionLangNote}以帮助初学者理解。
    
    - 以简短的结论结束章节，总结所学内容${instructionLangNote}并提供到下一章的过渡${instructionLangNote}。如果有下一章，请使用适当的 Markdown 链接：[下一章标题](next_chapter_filename)${linkLangNote}。
    
    - 确保语调友好，易于新手理解${toneNote}。
    
    - 仅输出此章节的 Markdown 内容。
    
    现在，直接提供一个超级适合初学者的 Markdown 输出（不需要 \`\`\`markdown\`\`\` 标签）：
    `;

        const chapterContent = await callLlm(prompt, {
            useCache: this._params.useCache as boolean,
            llmApiKey: this._params.llmApiKey as string,
        });

        // 基本验证/清理
        const actualHeading = `# 第 ${chapterNum} 章：${abstractionName}`; // 使用可能已翻译的名称

        let finalContent = chapterContent;
        if (!chapterContent.trim().startsWith(`# 第 ${chapterNum} 章`)) {
            // 如果缺少或不正确，添加标题，尝试保留内容
            const lines = chapterContent.trim().split("\n");

            if (lines.length > 0 && lines[0].trim().startsWith("#")) {
                // 如果有某种标题，替换它
                lines[0] = actualHeading;
                finalContent = lines.join("\n");
            } else {
                // 否则，在前面添加
                finalContent = `${actualHeading}\n\n${chapterContent}`;
            }
        }

        // 将生成的内容添加到我们的临时列表中，用于下一次迭代的上下文
        this.chaptersWrittenSoFar.push(finalContent);

        return finalContent; // 返回 Markdown 字符串（可能已翻译）
    }

    async post(shared: SharedStore, prepRes: ChapterItem[], execResList: string[]): Promise<string | undefined> {
        // execResList 包含每章生成的 Markdown，按顺序排列
        shared.chapters = execResList;
        // 清理临时实例变量
        this.chaptersWrittenSoFar = [];
        console.log(`完成编写 ${execResList.length} 个章节。`);
        return undefined;
    }

    private getContentForIndices(filesData: FileInfo[], indices: number[]): Record<string, string> {
        const contentMap: Record<string, string> = {};

        for (const i of indices) {
            if (i >= 0 && i < filesData.length) {
                const { path, content } = filesData[i];
                contentMap[`${i} # ${path}`] = content; // 使用索引 + 路径作为上下文的键
            }
        }

        return contentMap;
    }
}
