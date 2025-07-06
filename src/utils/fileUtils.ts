import { FileInfo } from "../types";
import { getContentForIndices } from "../utils";

/**
 * Format file content for LLM prompts
 * @param filesData Array of file information
 * @param indices Array of file indices to include
 * @returns Formatted string with file content
 */
export function formatFileContent(filesData: FileInfo[], indices: number[]): string {
    const relevantFilesContentMap = getContentForIndices(filesData, indices);

    return formatContentMap(relevantFilesContentMap);
}

/**
 * Format content map for LLM prompts
 * @param contentMap Map of file paths/indices to content
 * @returns Formatted string with file content
 */
export function formatContentMap(contentMap: Record<string, string>): string {
    return Object.entries(contentMap)
        .map(([idxPath, content]) => {
            const path = idxPath.includes("# ") ? idxPath.split("# ")[1] : idxPath;
            return `--- File: ${path} ---\n${content}`;
        })
        .join("\n\n");
}

/**
 * Format abstraction listing for LLM prompts
 * @param abstractions Array of abstractions with indices and either name or path
 * @returns Formatted string with abstraction listing
 */
export function formatAbstractionListing(abstractions: Array<{ index: number; name?: string; path?: string }>): string {
    return abstractions
        .map(({ index, name, path }) => {
            const label = name || path || "";
            return `- ${index} # ${label}`;
        })
        .join("\n");
}

/**
 * Create a safe filename from a potentially translated name
 * @param name The name to convert to a safe filename
 * @param index Optional index to prepend to the filename
 * @returns Safe filename string
 */
export function createSafeFilename(name: string, index?: number): string {
    const safeName = name.replace(/[\\\/:\*\?\"<>| ]/g, "_").toLowerCase();

    if (typeof index === "number") {
        return `${(index + 1).toString().padStart(2, "0")}_${safeName}.md`;
    }

    return `${safeName}.md`;
}
