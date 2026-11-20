/**
 * Extra experiment: does the memory of DFS / BFS keep growing with the graph size?
 *
 *   node 3_algorithms/ceiling.ts          # p = 5 (default)
 *   node 3_algorithms/ceiling.ts --p 3
 *
 * A check can't reach more different topics than there are paths from A, and
 * DFS without a visited set walks exactly those paths. The number of paths
 * depends on the depth and on p, not on V, so it is a ceiling for the visited
 * set. This script runs the same kind of checks on graphs up to 2,000,000
 * topics (beyond the main sizes) to see the memory approach that ceiling.
 *
 * Only counts (no timing), only the array of arrays (the counts are the same
 * on every list). Graphs are generated in memory, not written to files.
 * Writes results/ceiling_p{p}.csv. Takes about a minute.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { generateKnowledgeGraph } from "../1_generation/knowledgeGraph.ts";
import { buildArrayOfArrays } from "../2_data_structures/arrayOfArrays.ts";
import { pFromArgs, SEED, SIZES } from "../shared/graph.ts";
import { bfs } from "./bfs.ts";
import { buildChecks } from "./checks.ts";
import { dfs } from "./dfs.ts";
import { dfsNoVisited } from "./dfsNoVisited.ts";

const EXTRA_SIZES = [200_000, 500_000, 1_000_000, 2_000_000];

const p = pFromArgs();
const rows = ["V,E,checks,dfsMemory,bfsMemory,reached,paths,reachedShare,level11Reached,level11Paths"];

for (const n of [...SIZES, ...EXTRA_SIZES]) {
  const graph = generateKnowledgeGraph(n, p, SEED);
  const structure = buildArrayOfArrays(graph);
  const checks = buildChecks(graph);

  let dfsMemory = 0, bfsMemory = 0, reached = 0, paths = 0;
  let topReached = 0, topPaths = 0, topChecks = 0; // A on the top level, no cycle: the largest searches
  for (const c of checks) {
    const d = dfs(structure, c.a, c.b);
    const b = bfs(structure, c.a, c.b);
    const noVisited = dfsNoVisited(structure, c.a, c.b);
    dfsMemory += d.maxTodo + d.visitedSetSize;
    bfsMemory += b.maxTodo + b.visitedSetSize;
    reached += d.visits; // with a visited set: each different topic once
    paths += noVisited.visits; // without: once per path
    if (c.levelA === 11 && !c.cycle) {
      topReached += d.visits;
      topPaths += noVisited.visits;
      topChecks++;
    }
  }
  const k = checks.length;
  rows.push([
    n, graph.edges.length, k, (dfsMemory / k).toFixed(1), (bfsMemory / k).toFixed(1), (reached / k).toFixed(1),
    (paths / k).toFixed(1), (reached / paths).toFixed(3), (topReached / topChecks).toFixed(1), (topPaths / topChecks).toFixed(1),
  ].join(","));
  console.log(`${String(n).padStart(9)} topics: DFS memory ${(dfsMemory / k).toFixed(0).padStart(5)}  ` +
    `reached ${(reached / k).toFixed(0).padStart(5)} of ${(paths / k).toFixed(0)} paths (${((100 * reached) / paths).toFixed(0)} %)`);
}

const dir = join(import.meta.dirname, "results");
mkdirSync(dir, { recursive: true });
const csv = join(dir, `ceiling_p${p}.csv`);
writeFileSync(csv, rows.join("\n") + "\n");
console.log(`\nwrote ${csv}`);
