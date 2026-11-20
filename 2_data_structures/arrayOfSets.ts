import type { Graph } from "../shared/graph.ts";
import type { Structure } from "./structures.ts";

/**
 * Array of sets: the topic id is the position; each topic's prerequisites are a Set.
 *   list[9] = {5, 3, 6}
 *
 * Find X's prerequisites: jump straight to position X (O(1), no hashing).
 * Memory: O(V + E), but every topic gets its own small hash table.
 */
export function buildArrayOfSets(graph: Graph): Structure {
  const list: Set<number>[] = graph.nodes.map(() => new Set());
  for (const [from, to] of graph.edges) list[from]!.add(to);

  return { prerequisites: (id) => list[id]! };
}
