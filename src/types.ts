export interface LLMProvider {
    apiKey: string;
}

export interface WikiConfig {
    localDir: string;
    projectName?: string | null;
    outputDir: string;
    includePatterns: string[];
    excludePatterns: string[];
    maxFileSize: number;
    language: string;
    useCache: boolean;
    maxAbstractionNum: number;
}

export interface LlmModel {
    id: string;
    name: string;
    pricing: {
        prompt: string;
        completion: string;
    };
    context_length: number;
}

export interface GlobalConfig extends WikiConfig {
    llmProvider: string;
    llmApiKey: string;
    llmModel?: string;
}

export interface FileInfo {
    path: string;
    content: string;
}

export interface SharedStore extends GlobalConfig {
    files: FileInfo[];
    abstractions: Abstraction[];
    relationships: RelationshipsResult;
    chapterOrder: number[];
    chapters: string[];
    finalOutputDir?: string | null;
}

export interface ChapterInfo {
    num: number;
    name: string;
    filename: string;
}

export interface Abstraction {
    name: string;
    description: string;
    files: number[];
}

export interface ChapterItem {
    chapterNum: number;
    abstractionIndex: number;
    abstractionDetails: Abstraction;
    relatedFilesContentMap: Record<string, string>;
    projectName: string;
    fullChapterListing: string;
    chapterFilenames: Record<number, ChapterInfo>;
    prevChapter: ChapterInfo | null;
    nextChapter: ChapterInfo | null;
    language: string;
}

export interface IdentifyAbstractionsPrepResult {
    context: string;
    fileListingForPrompt: string;
    fileCount: number;
    projectName: string;
    language: string;
    useCache: boolean;
    maxAbstractionNum: number;
    llmProvider: string;
    apiKey: string;
    model?: string;
}

export interface Relationship {
    from: number;
    to: number;
    label: string;
}

export interface RelationshipsResult {
    summary: string;
    details: Relationship[];
}

export interface AnalyzeRelationshipsPrepResult {
    context: string;
    abstractionListing: string;
    projectName: string;
    language: string;
    useCache: boolean;
    numAbstractions: number;
    llmProvider: string;
    apiKey: string;
    model?: string;
}

export interface ChapterOrderPreResult {
    abstractionListing: string;
    context: string;
    numAbstractions: number;
    projectName: string;
    listLangNote: string;
    useCache: boolean;
    llmProvider: string;
    apiKey: string;
    model?: string;
}

/**
 * Parameters passed to nodes in the flow
 * Includes SharedStore properties and additional parameters like VS Code extension context
 */
export interface NodeParams {
    [key: string]: unknown;
    context?: import("vscode").ExtensionContext;
    llmProvider?: string;
    llmApiKey?: string;
    llmModel?: string;
    useCache?: boolean;
    language?: string;
    maxAbstractionNum?: number;
}
