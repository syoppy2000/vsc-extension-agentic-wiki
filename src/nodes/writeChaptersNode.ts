import { BatchNode } from "pocketflow";
import { callLlm } from "../callLlm";
import { ChapterInfo, ChapterItem, SharedStore } from "../types";
import { getContentForIndices } from "../utils";
import { getChapterLanguageContext, capitalizeFirstLetter } from "../utils/languageUtils";
import { formatContentMap, createSafeFilename } from "../utils/fileUtils";

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

        // Reset temporary storage
        this.chaptersWrittenSoFar = [];

        // Create complete list of all chapters
        const allChapters: string[] = [];
        const chapterFilenames: Record<number, ChapterInfo> = {};

        for (let i = 0; i < chapterOrder.length; i++) {
            const abstractionIndex = chapterOrder[i];

            if (abstractionIndex >= 0 && abstractionIndex < abstractions.length) {
                const chapterNum = i + 1;
                const chapterName = abstractions[abstractionIndex].name; // Name may be translated

                // Create safe filename (from potentially translated name)
                const filename = createSafeFilename(chapterName, i);

                // Use link format (with potentially translated name)
                allChapters.push(`${chapterNum}. [${chapterName}](${filename})`);

                // Store mapping from chapter index to filename, for links
                chapterFilenames[abstractionIndex] = {
                    num: chapterNum,
                    name: chapterName,
                    filename: filename,
                };
            }
        }

        // Create formatted string containing all chapters
        const fullChapterListing = allChapters.join("\n");

        const itemsToProcess: ChapterItem[] = [];

        for (let i = 0; i < chapterOrder.length; i++) {
            const abstractionIndex = chapterOrder[i];

            if (abstractionIndex >= 0 && abstractionIndex < abstractions.length) {
                const abstractionDetails = abstractions[abstractionIndex]; // Contains potentially translated name/description

                // Directly use 'files' (list of indices)
                const relatedFileIndices = abstractionDetails.files || [];

                // Use helper function to get content, passing indices
                const relatedFilesContentMap = getContentForIndices(filesData, relatedFileIndices);

                // Get previous chapter info for transitions (using potentially translated names)
                let prevChapter = null;
                if (i > 0) {
                    const prevIdx = chapterOrder[i - 1];
                    prevChapter = chapterFilenames[prevIdx];
                }

                // Get next chapter info for transitions (using potentially translated names)
                let nextChapter = null;
                if (i < chapterOrder.length - 1) {
                    const nextIdx = chapterOrder[i + 1];
                    nextChapter = chapterFilenames[nextIdx];
                }

                itemsToProcess.push({
                    chapterNum: i + 1,
                    abstractionIndex: abstractionIndex,
                    abstractionDetails: abstractionDetails, // Has potentially translated name/description
                    relatedFilesContentMap: relatedFilesContentMap,
                    projectName: shared.projectName || "", // Add project name
                    fullChapterListing: fullChapterListing, // Add complete chapter list (using potentially translated names)
                    chapterFilenames: chapterFilenames, // Add chapter filename mapping (using potentially translated names)
                    prevChapter: prevChapter, // Add previous chapter info (using potentially translated names)
                    nextChapter: nextChapter, // Add next chapter info (using potentially translated names)
                    language: language, // Add language for multilingual support
                });
            } else {
                console.log(`Warning: Abstraction index ${abstractionIndex} in chapter order is invalid. Skipping.`);
            }
        }

        console.log(`Preparing to write ${itemsToProcess.length} chapters...`);
        return {
            itemsToProcess,
            shared,
        }; // Iterable object for BatchNode
    }

    async exec(item: ChapterItem): Promise<string> {
        // This runs for each item prepared above
        const abstractionName = item.abstractionDetails.name; // Name may be translated
        const abstractionDescription = item.abstractionDetails.description; // Description may be translated
        const chapterNum = item.chapterNum;
        const projectName = item.projectName;
        const language = item.language || "english";

        console.log(`Using LLM to write Chapter ${chapterNum}: ${abstractionName}...`);

        // Prepare file context string from mapping using utility function
        const fileContextStr = formatContentMap(item.relatedFilesContentMap);

        // Get summary of chapters written before this one
        // Use temporary instance variable
        const previousChaptersSummary = this.chaptersWrittenSoFar.join("\n---\n");

        // Use utility function to get language context
        const {
            languageInstruction,
            conceptDetailsNote,
            structureNote,
            prevSummaryNote,
            instructionLangNote,
            mermaidLangNote,
            codeCommentNote,
            linkLangNote,
            toneNote,
        } = getChapterLanguageContext(language);

        const prompt = `
    ${languageInstruction}Write a very beginner-friendly tutorial chapter (in Markdown format) for project \`${projectName}\` about the concept: "${abstractionName}". This is Chapter ${chapterNum}.

    Concept details${conceptDetailsNote}:
    - Name: ${abstractionName}
    - Description:
    ${abstractionDescription}

    Complete tutorial structure${structureNote}:
    ${item.fullChapterListing}

    Context from previous chapters${prevSummaryNote}:
    ${previousChaptersSummary || "This is the first chapter."}

    Related code snippets (code itself remains unchanged):
    ${fileContextStr || "No specific code snippets provided for this abstraction."}

    Chapter guidelines (generate content in ${capitalizeFirstLetter(language)} unless otherwise specified):
    - Start with a clear title (e.g., \`# Chapter ${chapterNum}: ${abstractionName}\`). Use the provided concept name.

    - If this is not the first chapter, begin with a brief transition referencing the previous chapter${instructionLangNote}, using appropriate Markdown links and its name${linkLangNote}.

    - Start with high-level motivation, explaining what problem this abstraction solves${instructionLangNote}. Begin with a central use case from a concrete example. The entire chapter should guide readers through how to solve this use case. Make it very concise and beginner-friendly.

    - If the abstraction is complex, break it down into key concepts. Explain each concept one by one in a very beginner-friendly way${instructionLangNote}.

    - Explain how to use this abstraction to solve the use case${instructionLangNote}. Provide example inputs and outputs for code snippets (if the output is not a value, describe at a high level what will happen${instructionLangNote}).

    - Each code block should be less than 10 lines! If longer code blocks are needed, break them down into smaller parts and explain them one by one. Actively simplify code to minimize it. Use comments${codeCommentNote} to skip unimportant implementation details. Each code block should be followed by a beginner-friendly explanation${instructionLangNote}.

    - Describe the internal implementation to help understand the underlying principles${instructionLangNote}. First provide a non-code or light-code walkthrough explaining what happens step by step when the abstraction is called${instructionLangNote}. Consider using a simple sequenceDiagram with virtual examples - keep it minimal, with at most 5 participants to ensure clarity. If participant names have spaces, use: \`participant QP as Query Processing\`.${mermaidLangNote}.

    - Then dive into the code of the internal implementation, referencing files. Provide example code blocks, but make them equally simple and beginner-friendly. Explain${instructionLangNote}.

    - Important: When you need to reference other core abstractions covered in other chapters, always use appropriate Markdown links, like: [Chapter Title](filename.md). Use the complete tutorial structure above to find the correct filenames and chapter titles${linkLangNote}. Translate the surrounding text.

    - Use mermaid diagrams to illustrate complex concepts (\`\`\`mermaid\`\`\` format).${mermaidLangNote}.

    - Use analogies and examples extensively throughout${instructionLangNote} to help beginners understand.

    - End the chapter with a brief conclusion summarizing what was learned${instructionLangNote} and provide a transition to the next chapter${instructionLangNote}. If there is a next chapter, use an appropriate Markdown link: [Next Chapter Title](next_chapter_filename)${linkLangNote}.

    - Ensure the tone is friendly and easy for newcomers to understand${toneNote}.

    - Output only the Markdown content for this chapter.

    Now, directly provide a super beginner-friendly Markdown output (no need for \`\`\`markdown\`\`\` tags):
    `;

        const chapterContent = await callLlm(prompt, {
            useCache: this._params.useCache as boolean,
            llmApiKey: this._params.llmApiKey as string,
        });

        // Basic validation/cleanup
        const actualHeading = `# Chapter ${chapterNum}: ${abstractionName}`; // Use potentially translated name

        let finalContent = chapterContent;
        if (!chapterContent.trim().startsWith(`# Chapter ${chapterNum}`)) {
            // If missing or incorrect, add title, try to preserve content
            const lines = chapterContent.trim().split("\n");

            if (lines.length > 0 && lines[0].trim().startsWith("#")) {
                // If there's some kind of title, replace it
                lines[0] = actualHeading;
                finalContent = lines.join("\n");
            } else {
                // Otherwise, add to the front
                finalContent = `${actualHeading}\n\n${chapterContent}`;
            }
        }

        // Add the generated content to our temporary list for context in the next iteration
        this.chaptersWrittenSoFar.push(finalContent);

        return finalContent; // Return Markdown string (may be translated)
    }

    async post(
        shared: SharedStore,
        _: WriteChaptersNodePrepResult,
        execResList: string[],
    ): Promise<string | undefined> {
        // execResList contains generated Markdown for each chapter, in order
        shared.chapters = execResList;
        // Clean up temporary instance variable
        this.chaptersWrittenSoFar = [];
        console.log(`Completed writing ${execResList.length} chapters.`);
        return undefined;
    }
}
