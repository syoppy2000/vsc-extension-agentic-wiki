import { Node } from "pocketflow";
import { callLlm } from "./callLlm";
import { FileInfo, GlobalConfig, SharedStore } from "./types";
import { crawlLocalFiles } from "./crawLocalFiles";

export class FetchRepoNode extends Node<SharedStore> {
    async prep(shared: SharedStore): Promise<SharedStore> {
        // Read repo from shared
        console.log(shared, "shared");
        return shared;
    }

    async exec(preRes: SharedStore): Promise<FileInfo[]> {
        console.log(`Fetching directory: ${preRes.localDir}...`);
        const result = crawlLocalFiles(preRes.localDir);
        if (result.files.length === 0) {
            throw new Error("No files found");
        }
        console.log(`Fetched ${result.files.length} files.`);
        console.log(result.files);
        return result.files; // Go to the next node
    }

    async post(shared: SharedStore, _: unknown, execRes: FileInfo[]): Promise<string | undefined> {
        // Store the repo in shared
        shared.files = execRes;
        return undefined;
    }
}
