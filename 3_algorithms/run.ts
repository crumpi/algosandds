/**
 * Step 3: time and memory of DFS, BFS and DFS without a visited set,
 * on every data structure, for the cycle check.
 *
 *   node 3_algorithms/run.ts          # graphs with p = 5 (default)
 *   node 3_algorithms/run.ts --p 3
 *
 * Needs the graphs from step 1. Writes results/checks_p{p}.csv, one row per
 * graph × structure × algorithm × check.
 *
 * Per check: run it REPEATS times, keep the median time. Memory is counted
 * inside the search (largest to-do list + visited set), so it's the same on every run.
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { STRUCTURES } from "../2_data_structures/structures.ts";
import { graphPath, pFromArgs, readGraph, SIZES } from "../shared/graph.ts";
import { ALGORITHMS, createsCycle, type SearchResult } from "./algorithms.ts";
import { buildChecks } from "./checks.ts";

const REPEATS = { lists: 5, matrix: 3 }; // the matrix is slow enough that its timings are less noisy
const WARM_UP_CHECKS = 20; // run first, untimed, so JavaScript has compiled the code

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)]!;
}

const p = pFromArgs();
const rows = [
  "graph,V,E,structure,algorithm,levelA,cycle,found,visits,edges,maxTodo,visitedSetSize,memoryEntries,stoppedAtCap,medianUs",
];
const started = performance.now();

for (const n of SIZES) {
  const path = graphPath(n, p);
  if (!existsSync(path)) throw new Error(`${path} is missing: run \`node 1_generation/run.ts --p ${p}\` first`);
  const graph = readGraph(path);
  const V = graph.nodes.length;
  const E = graph.edges.length;
  const checks = buildChecks(graph);

  for (const spec of STRUCTURES) {
    if (V > spec.maxTopics) continue; // matrix too big to build
    const structure = spec.build(graph);
    const repeats = spec.name === "matrix" ? REPEATS.matrix : REPEATS.lists;

    for (const { name, search } of ALGORITHMS) {
      for (const c of checks.slice(0, WARM_UP_CHECKS)) createsCycle(structure, search, c.a, c.b);

      const t0 = performance.now();
      for (const c of checks) {
        let result!: SearchResult;
        const times: number[] = [];
        for (let i = 0; i < repeats; i++) {
          const start = process.hrtime.bigint();
          result = createsCycle(structure, search, c.a, c.b);
          times.push(Number(process.hrtime.bigint() - start) / 1000); // ns → µs
        }
        if (!result.stoppedAtCap && result.found !== c.cycle) {
          throw new Error(`${graph.meta.name} ${spec.name} ${name}: wrong answer for A=${c.a}, B=${c.b}`);
        }
        rows.push([
          graph.meta.name, V, E, spec.name, name, c.levelA, c.cycle, result.found, result.visits, result.edges,
          result.maxTodo, result.visitedSetSize, result.maxTodo + result.visitedSetSize, result.stoppedAtCap,
          median(times).toFixed(3),
        ].join(","));
      }
      const seconds = ((performance.now() - t0) / 1000).toFixed(1);
      console.log(`${graph.meta.name.padEnd(20)}${spec.name.padEnd(17)}${name.padEnd(16)}${seconds.padStart(6)} s`);
    }
  }
}

const dir = join(import.meta.dirname, "results");
mkdirSync(dir, { recursive: true });
const csv = join(dir, `checks_p${p}.csv`);
writeFileSync(csv, rows.join("\n") + "\n");
console.log(`\nwrote ${csv} (${rows.length - 1} rows) in ${((performance.now() - started) / 1000).toFixed(0)} s`);
