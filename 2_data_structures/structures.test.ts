import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { generateKnowledgeGraph } from "../1_generation/knowledgeGraph.ts";
import { GRAPHS_DIR, readGraph, type Graph } from "../shared/graph.ts";
import { STRUCTURES } from "./structures.ts";

/** The expected answer, straight from the edge list. */
function expectedPrerequisites(graph: Graph, id: number): number[] {
  return graph.edges.filter(([from]) => from === id).map(([, to]) => to).sort((a, b) => a - b);
}

const graphs = [readGraph(join(GRAPHS_DIR, "example_cs.json")), generateKnowledgeGraph(500, 5, 42)];

describe.each(graphs)("$meta.name", (graph) => {
  it.each(STRUCTURES)("$name returns every topic's prerequisites", ({ build }) => {
    const structure = build(graph);
    for (const topic of graph.nodes) {
      const got = [...structure.prerequisites(topic.id)].sort((a, b) => a - b);
      expect(got).toEqual(expectedPrerequisites(graph, topic.id));
    }
  });
});
