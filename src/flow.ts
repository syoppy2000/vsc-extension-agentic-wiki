import { Flow } from "pocketflow";
import { SharedStore } from "./types";
import { FetchRepoNode, IdentifyAbstractionsNode } from "./nodes";

export function createFlow(): Flow {
    const fetchRepoNode = new FetchRepoNode();
    const identifyAbstractionNode = new IdentifyAbstractionsNode();

    fetchRepoNode.next(identifyAbstractionNode);

    return new Flow<SharedStore>(fetchRepoNode);
}
