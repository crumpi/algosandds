import { describe, expect, it } from "vitest";
import { generateKnowledgeGraph } from "./knowledgeGraph.ts";

describe("generateKnowledgeGraph", () => {
  it("is a DAG: every edge goes to a lower level", () => {
    const g = generateKnowledgeGraph(1_000, 5, 42);
    for (const [from, to] of g.edges) expect(g.nodes[from]!.level).toBeGreaterThan(g.nodes[to]!.level);
  });

  it("gives the same graph for the same seed, and a different one for another seed", () => {
    const a = generateKnowledgeGraph(1_000, 5, 42);
    expect(generateKnowledgeGraph(1_000, 5, 42)).toEqual(a);
    expect(generateKnowledgeGraph(1_000, 5, 43).edges).not.toEqual(a.edges);
  });

  for (const p of [2, 3, 5]) {
    it(`has on average about ${p} prerequisites per topic above level 0`, () => {
      const g = generateKnowledgeGraph(10_000, p, 42);
      const aboveLevel0 = g.nodes.filter((t) => t.level > 0).length;
      const average = g.edges.length / aboveLevel0;
      expect(average).toBeGreaterThan(p * 0.9);
      expect(average).toBeLessThan(p * 1.1);
    });
  }
});
