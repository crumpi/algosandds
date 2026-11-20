/**
 * Step 2: how much memory does each data structure need for each graph?
 *
 *   node 2_data_structures/run.ts          # graphs with p = 5 (default)
 *   node 2_data_structures/run.ts --p 3
 *
 * Needs the graphs from step 1. Writes results/memory_p{p}.csv.
 *
 * How one measurement works:
 *   1. clean up memory (garbage collector), read how much is in use
 *   2. build the structure
 *   3. clean up again, read again → the difference is the structure's size
 * Repeated REPEATS times; the median is kept.
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { setFlagsFromString } from "node:v8";
import { runInNewContext } from "node:vm";
import { graphPath, pFromArgs, readGraph, SIZES, type Graph } from "../shared/graph.ts";
import { STRUCTURES, type StructureSpec } from "./structures.ts";

const REPEATS = 5;

// Switch on the garbage collector for this script, so no `node --expose-gc` flag is needed.
setFlagsFromString("--expose-gc");
const gc = runInNewContext("gc") as () => void;

/**
 * Memory in use right now, after cleaning up. `heapUsed` covers normal JS
 * objects (Maps, Sets, arrays). Typed arrays like the matrix rows keep their
 * bytes outside the heap, in `arrayBuffers`, so both are added.
 */
function memoryInUse(): number {
  gc();
  gc(); // a second pass catches objects freed by the first
  const m = process.memoryUsage();
  return m.heapUsed + m.arrayBuffers;
}

function measureBytes(spec: StructureSpec, graph: Graph): number {
  const results: number[] = [];
  for (let i = 0; i < REPEATS; i++) {
    const before = memoryInUse();
    const structure = spec.build(graph);
    results.push(memoryInUse() - before);
    keepAlive(structure); // without this, the structure could be cleaned up before the second reading
  }
  results.sort((a, b) => a - b);
  return results[Math.floor(REPEATS / 2)]!;
}

let sink: unknown;
function keepAlive(x: unknown) {
  sink = x;
}

/**
 * What the theory predicts, counting 8 bytes per stored number:
 * - lists: one entry per topic and one per edge → (V + E) · 8 bytes, O(V + E)
 * - matrix: one byte per cell → V² bytes, O(V²)
 * The gap to the measurement is the hidden overhead: object headers,
 * hash tables, spare room reserved by `push`.
 */
function estimateBytes(name: string, V: number, E: number): number {
  return name === "matrix" ? V * V : (V + E) * 8;
}

function mb(bytes: number): string {
  return (bytes / 1e6).toFixed(2).padStart(9) + " MB";
}

// ---------------------------------------------------------------------------

const p = pFromArgs();
const rows = ["graph,V,E,structure,measuredBytes,estimateBytes,bytesPerTopic"];
console.log(`${"graph".padEnd(20)}${"structure".padEnd(17)}${"measured".padStart(12)}${"estimate".padStart(13)}`);

for (const n of SIZES) {
  const path = graphPath(n, p);
  if (!existsSync(path)) throw new Error(`${path} is missing: run \`node 1_generation/run.ts --p ${p}\` first`);
  const graph = readGraph(path);
  const V = graph.nodes.length;
  const E = graph.edges.length;

  for (const spec of STRUCTURES) {
    const estimate = estimateBytes(spec.name, V, E);
    const built = V <= spec.maxTopics;
    const measured = built ? measureBytes(spec, graph) : null; // too big to build: only the estimate
    rows.push([graph.meta.name, V, E, spec.name, measured ?? "", estimate, measured === null ? "" : (measured / V).toFixed(1)].join(","));
    console.log(`${graph.meta.name.padEnd(20)}${spec.name.padEnd(17)}${measured === null ? "   not built" : mb(measured)}${mb(estimate)}`);
  }
}

const dir = join(import.meta.dirname, "results");
mkdirSync(dir, { recursive: true });
const csv = join(dir, `memory_p${p}.csv`);
writeFileSync(csv, rows.join("\n") + "\n");
console.log(`\nwrote ${csv}`);
void sink;
