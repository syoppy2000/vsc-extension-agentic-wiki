import { Flow } from "pocketflow";
import { SharedStore } from "./types";
import {
    AnalyzeRelationshipsNode,
    CombineTutorialNode,
    FetchRepoNode,
    IdentifyAbstractionsNode,
    OrderChaptersNode,
    WriteChaptersNode,
} from "./nodes";

export function createFlow(): Flow {
    const fetchRepoNode = new FetchRepoNode();
    const identifyAbstractionNode = new IdentifyAbstractionsNode();
    const analyzeRelationshipsNode = new AnalyzeRelationshipsNode();
    const orderChaptersNode = new OrderChaptersNode();
    const writeChaptersNode = new WriteChaptersNode();
    const combineTutorialNode = new CombineTutorialNode();

    fetchRepoNode
        .next(identifyAbstractionNode)
        .next(analyzeRelationshipsNode)
        .next(orderChaptersNode)
        .next(writeChaptersNode)
        .next(combineTutorialNode);

    return new Flow<SharedStore>(fetchRepoNode);
}
