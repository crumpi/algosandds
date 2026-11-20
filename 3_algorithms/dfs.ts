import type { Structure } from "../2_data_structures/structures.ts";
import type { SearchResult } from "./algorithms.ts";

/**
 * Depth-first search, recursive, with a visited set (session 7).
 * Follows one chain of prerequisites as deep as it goes, then backtracks.
 * The call stack is the stack.
 *
 * Time: O(V + E) for the part of the graph reachable from `start` (lists);
 *       with the matrix every visit scans a whole row, so O(V) per visit.
 * Memory: visited set + call stack. The call stack is at most as deep as the
 *         longest chain of prerequisites (12 topics in our graphs).
 */
export function dfs(structure: Structure, start: number, target: number): SearchResult {
  const visited = new Set<number>();
  let visits = 0;
  let edges = 0;
  let depth = 0; // current depth of the call stack
  let maxDepth = 0;

  function visit(topic: number): boolean {
    visited.add(topic);
    visits++;
    depth++;
    if (depth > maxDepth) maxDepth = depth;
    if (topic === target) return true;

    for (const prerequisite of structure.prerequisites(topic)) {
      edges++;
      if (!visited.has(prerequisite) && visit(prerequisite)) return true; // found deeper down: stop
    }
    depth--; // dead end: backtrack
    return false;
  }

  const found = visit(start);
  return { found, visits, edges, maxTodo: maxDepth, visitedSetSize: visited.size, stoppedAtCap: false };
}
