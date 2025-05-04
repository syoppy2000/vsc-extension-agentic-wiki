import path from "path";
import { Node } from "pocketflow";
import { crawlLocalFiles } from "../services/file";
import { FileInfo, SharedStore, NodeParams } from "../types";

export default class FetchRepoNode extends Node<SharedStore, NodeParams> {
    async prep(shared: SharedStore): Promise<SharedStore> {
        // Read repo from shared
        const projectName = path.basename(path.resolve(shared.localDir));
        shared.projectName = projectName;
        return shared;
    }

    async exec(preRes: SharedStore): Promise<FileInfo[]> {
        console.log(`Fetching directory: ${preRes.localDir}...`);
        try {
            const result = crawlLocalFiles(
                preRes.localDir,
                preRes.includePatterns,
                preRes.excludePatterns,
                preRes.maxFileSize * 1024,
            );
            if (result.files.length === 0) {
                throw new Error(`No files found in directory: ${preRes.localDir}`);
            }
            console.log(`Fetched ${result.files.length} files.`);
            return result.files;
        } catch (error) {
            console.error(`Error fetching files: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }

    async post(shared: SharedStore, _: unknown, execRes: FileInfo[]): Promise<string | undefined> {
        // Store the repo in shared
        shared.files = execRes;
        return undefined;
    }
}
