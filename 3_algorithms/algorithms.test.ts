import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { generateKnowledgeGraph, LEVELS } from "../1_generation/knowledgeGraph.ts";
import { STRUCTURES } from "../2_data_structures/structures.ts";
import { GRAPHS_DIR, readGraph } from "../shared/graph.ts";
import { ALGORITHMS, createsCycle } from "./algorithms.ts";
import { buildChecks } from "./checks.ts";

const example = readGraph(join(GRAPHS_DIR, "example_cs.json"));
const id = (label: string) => example.nodes.find((t) => t.label === label)!.id;

describe("example_cs.json, checked by hand", () => {
  // [B, A, cycle?]: "B requires A"
  const cases: [string, string, boolean][] = [
    ["Variables", "Merge Sort", true], // Merge Sort → Recursion → Functions → Variables
    ["Recursion", "Sorting Overview", true], // Sorting Overview → Quick Sort → Recursion
    ["Merge Sort", "Quick Sort", false], // Quick Sort doesn't reach Merge Sort
    ["Big O", "Linear Search", false], // Linear Search → Arrays, Loops → … no Big O
  ];
  for (const s of STRUCTURES) {
    for (const alg of ALGORITHMS) {
      it(`${s.name} + ${alg.name}`, () => {
        const structure = s.build(example);
        for (const [b, a, cycle] of cases) {
          expect(createsCycle(structure, alg.search, id(a), id(b)).found).toBe(cycle);
        }
      });
    }
  }
});

describe("generated graph (500 topics): every structure × algorithm gives the right answer", () => {
  const graph = generateKnowledgeGraph(500, 5, 42);
  const checks = buildChecks(graph);

  it("has cycle and no-cycle checks on every level", () => {
    expect(checks.filter((c) => c.cycle).length).toBe(110); // levels 1–11
    expect(checks.filter((c) => !c.cycle).length).toBe(120); // levels 0–11
  });

  for (const s of STRUCTURES) {
    for (const alg of ALGORITHMS) {
      it(`${s.name} + ${alg.name}`, () => {
        const structure = s.build(graph);
        for (const c of checks) {
          const r = createsCycle(structure, alg.search, c.a, c.b);
          if (!r.stoppedAtCap) expect(r.found).toBe(c.cycle);
        }
      });
    }
  }

  it("DFS's call stack is never deeper than the number of levels", () => {
    const structure = STRUCTURES[2]!.build(graph);
    for (const c of checks) expect(createsCycle(structure, ALGORITHMS[0]!.search, c.a, c.b).maxTodo).toBeLessThanOrEqual(LEVELS);
  });

  it("without a visited set, DFS visits at least as many topics", () => {
    const structure = STRUCTURES[2]!.build(graph);
    for (const c of checks) {
      const withSet = createsCycle(structure, ALGORITHMS[0]!.search, c.a, c.b);
      const without = createsCycle(structure, ALGORITHMS[2]!.search, c.a, c.b);
      if (!c.cycle) expect(without.visits).toBeGreaterThanOrEqual(withSet.visits); // full walk: comparable
      expect(without.visitedSetSize).toBe(0);
    }
  });
});
