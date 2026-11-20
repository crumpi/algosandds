/**
 * Writes graphs/overview.csv: one row per graph file in graphs/, so you can
 * see at a glance what each graph looks like. Called at the end of run.ts.
 */
import { readdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { GRAPHS_DIR, readGraph, type Graph } from "../shared/graph.ts";

const COLUMNS = [
  "file", //            graph file name
  "p", //               target average prerequisites (empty for the hand-made example)
  "topics", //          V: number of topics (nodes)
  "edges", //           E: number of "requires" relations
  "levels", //          number of levels (0 = foundations)
  "foundations", //     topics on level 0, which require nothing
  "avgPrereqs", //      E / topics above level 0: the average the generator aims for (≈ p)
  "maxPrereqs", //      most prerequisites a single topic has (generator: at most 2p − 1)
  "biggestHub", //      most topics that require one single topic
  "biggestHubLabel", // which topic that is
  "longestPath", //     longest chain of "requires" (edges); also the deepest DFS call stack − 1
  "matrixFill", //      share of the V² matrix cells that are 1: E / V² (how sparse the graph is)
  "fileKB", //          size of the JSON file
];

/** Largest value; Math.max(...values) fails above ~120,000 values. */
const maxOf = (values: number[]) => values.reduce((max, v) => Math.max(max, v), -Infinity);

function describe(file: string, graph: Graph): (string | number)[] {
  const V = graph.nodes.length;
  const E = graph.edges.length;
  const prereqs = new Array<number>(V).fill(0); // out-degree: how many topics this one requires
  const requiredBy = new Array<number>(V).fill(0); // in-degree: how many topics require this one
  for (const [from, to] of graph.edges) {
    prereqs[from]!++;
    requiredBy[to]!++;
  }

  const levels = maxOf(graph.nodes.map((t) => t.level)) + 1;
  const foundations = graph.nodes.filter((t) => t.level === 0).length;
  const hub = requiredBy.indexOf(maxOf(requiredBy));

  // Longest chain: go through the topics from the lowest level up. A topic's
  // chain is one longer than the longest chain of its prerequisites.
  const chain = new Array<number>(V).fill(0);
  const byPrereq: number[][] = graph.nodes.map(() => []);
  for (const [from, to] of graph.edges) byPrereq[from]!.push(to);
  const order = graph.nodes.map((t) => t.id).sort((a, b) => graph.nodes[a]!.level - graph.nodes[b]!.level);
  for (const id of order) for (const u of byPrereq[id]!) chain[id] = Math.max(chain[id]!, chain[u]! + 1);

  return [
    file,
    graph.meta.p ?? "",
    V,
    E,
    levels,
    foundations,
    (E / (V - foundations)).toFixed(2),
    maxOf(prereqs),
    requiredBy[hub]!,
    graph.nodes[hub]!.label,
    maxOf(chain),
    (E / (V * V)).toExponential(1),
    (statSync(join(GRAPHS_DIR, file)).size / 1024).toFixed(0),
  ];
}

export function writeOverview(): string {
  const files = readdirSync(GRAPHS_DIR).filter((f) => f.endsWith(".json"));
  const rows = files.map((f) => describe(f, readGraph(join(GRAPHS_DIR, f))));
  // hand-made example first, then by p and size
  rows.sort((a, b) => (Number(a[1]) || 0) - (Number(b[1]) || 0) || Number(a[2]) - Number(b[2]));
  const path = join(GRAPHS_DIR, "overview.csv");
  writeFileSync(path, [COLUMNS.join(","), ...rows.map((r) => r.join(","))].join("\n") + "\n");
  return path;
}
