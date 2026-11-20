/**
 * The graph format that all three steps share.
 *
 * A graph is a list of topics (nodes) and "requires" relations (edges).
 * An edge [from, to] means "from requires to".
 * Adding "B requires A" creates a cycle exactly when A already reaches B.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

export interface Topic {
  /** 0 … n−1, equal to the topic's position in `nodes`. */
  id: number;
  label: string;
  /** 0 = foundation. Every edge goes from a higher to a lower level. */
  level: number;
}

/** [from, to]: "from requires to". */
export type Edge = [from: number, to: number];

export interface Graph {
  /** The graph's name and the parameters that produced it. */
  meta: { name: string } & Record<string, string | number>;
  nodes: Topic[];
  edges: Edge[];
}

// ---------------------------------------------------------------------------
// Which graphs exist and where they are stored

/** Graph sizes (number of topics) used in every step. */
export const SIZES = [100, 200, 500, 1_000, 2_000, 5_000, 10_000, 20_000, 50_000, 100_000];
export const SEED = 42;
/** Average prerequisites per topic, unless `--p N` is given on the command line. */
export const DEFAULT_P = 5;

export const GRAPHS_DIR = join(import.meta.dirname, "..", "1_generation", "graphs");

export function graphName(n: number, p: number, seed = SEED): string {
  return `kg_n${n}_p${p}_s${seed}`;
}

export function graphPath(n: number, p: number): string {
  return join(GRAPHS_DIR, `${graphName(n, p)}.json`);
}

/** Reads `--p N` from the command line; DEFAULT_P if it is missing. */
export function pFromArgs(): number {
  const i = process.argv.indexOf("--p");
  if (i === -1) return DEFAULT_P;
  const p = Number(process.argv[i + 1]);
  if (!Number.isInteger(p) || p < 1) throw new Error(`--p must be a positive whole number, got ${process.argv[i + 1]}`);
  return p;
}

// ---------------------------------------------------------------------------
// Files

export function readGraph(path: string): Graph {
  return JSON.parse(readFileSync(path, "utf8")) as Graph;
}

export function writeGraph(graph: Graph, path: string): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(graph));
}
