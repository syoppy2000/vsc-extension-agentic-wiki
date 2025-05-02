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

export interface GlobalConfig extends WikiConfig {
    llmApiKey: string;
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
    chapters: any[];
    finalOutputDir?: string | null;
}

export interface Abstraction {
    name: string;
    description: string;
    files: number[];
}

export interface IdentifyAbstractionsPrepResult {
    context: string;
    fileListingForPrompt: string;
    fileCount: number;
    projectName: string;
    language: string;
    useCache: boolean;
    maxAbstractionNum: number;
    apiKey: string;
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
    apiKey: string;
}

export interface ChapterOrderPreResult {
    abstractionListing: string;
    context: string;
    numAbstractions: number;
    projectName: string;
    listLangNote: string;
    useCache: boolean;
    apiKey: string;
}
