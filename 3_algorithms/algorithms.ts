/**
 * The three searches and the cycle check that uses them.
 *
 * Cycle check: adding "B requires A" creates a cycle exactly when A already
 * reaches B (A requires … requires B). So every check is a search that starts
 * at A and looks for B.
 */
import type { Structure } from "../2_data_structures/structures.ts";
import { bfs } from "./bfs.ts";
import { dfs } from "./dfs.ts";
import { dfsNoVisited } from "./dfsNoVisited.ts";

/** What every search returns: the answer, the work it did and the memory it held. */
export interface SearchResult {
  /** Was the target reached? */
  found: boolean;
  /** Topic visits. With a visited set each topic counts at most once; without one, once per path. */
  visits: number;
  /** Prerequisite edges looked at. */
  edges: number;
  /** Largest to-do list: deepest call stack (DFS) or most topics waiting in the queue (BFS). */
  maxTodo: number;
  /** Topics in the visited set at the end (0 without a visited set). */
  visitedSetSize: number;
  /** Only DFS without a visited set: stopped after NO_VISITED_CAP visits. */
  stoppedAtCap: boolean;
}

export type Search = (structure: Structure, start: number, target: number) => SearchResult;

export const ALGORITHMS: { name: string; search: Search }[] = [
  { name: "dfs", search: dfs },
  { name: "bfs", search: bfs },
  { name: "dfs-no-visited", search: dfsNoVisited },
];

/** Would adding "B requires A" create a cycle? Search from A for B. */
export function createsCycle(structure: Structure, search: Search, a: number, b: number): SearchResult {
  return search(structure, a, b);
}
