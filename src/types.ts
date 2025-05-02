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
    abstractions: any[];
    relationships: Record<string, any>;
    chapterOrder: any[];
    chapters: any[];
    finalOutputDir?: string | null;
}
