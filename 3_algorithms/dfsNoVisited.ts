import type { Structure } from "../2_data_structures/structures.ts";
import type { SearchResult } from "./algorithms.ts";

/** Stop after this many visits; the result is then marked `stoppedAtCap`. */
export const NO_VISITED_CAP = 1_000_000;

/**
 * DFS WITHOUT a visited set: the tree version from session 7 used on a graph.
 *
 * It still finishes on a DAG (there is no cycle to loop around), but it walks
 * every PATH instead of every topic. A hub that 100 paths lead to is walked
 * 100 times, like naive recursive Fibonacci (session 4). The visited set does
 * what memoization does there.
 *
 * Memory: only the call stack (at most 12 deep here), no visited set.
 * Only for the experiment; not a correct choice for the real check.
 */
export function dfsNoVisited(structure: Structure, start: number, target: number): SearchResult {
  let visits = 0;
  let edges = 0;
  let depth = 0;
  let maxDepth = 0;
  let stoppedAtCap = false;

  function visit(topic: number): boolean {
    visits++;
    depth++;
    if (depth > maxDepth) maxDepth = depth;
    if (topic === target) return true;
    if (visits >= NO_VISITED_CAP) {
      stoppedAtCap = true;
      return false;
    }
    for (const prerequisite of structure.prerequisites(topic)) {
      edges++;
      if (visit(prerequisite)) return true;
      if (stoppedAtCap) return false;
    }
    depth--;
    return false;
  }

  const found = visit(start);
  return { found, visits, edges, maxTodo: maxDepth, visitedSetSize: 0, stoppedAtCap };
}
