import { Flow } from "pocketflow";
import { SharedStore } from "./types";
import { AnalyzeRelationshipsNode, FetchRepoNode, IdentifyAbstractionsNode } from "./nodes";

export function createFlow(): Flow {
    const fetchRepoNode = new FetchRepoNode();
    const identifyAbstractionNode = new IdentifyAbstractionsNode();
    const analyzeRelationshipsNode = new AnalyzeRelationshipsNode();

    fetchRepoNode.next(identifyAbstractionNode);
    identifyAbstractionNode.next(analyzeRelationshipsNode);

    return new Flow<SharedStore>(fetchRepoNode);
}
