import { Flow } from "pocketflow";
import { FetchRepoNode } from "./nodes";
import { SharedStore } from "./types";

export function createFlow(): Flow {
    const fetchNode = new FetchRepoNode();
    // Create flow starting with input node
    return new Flow<SharedStore>(fetchNode);
}
