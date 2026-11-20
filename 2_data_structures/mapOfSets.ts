import type { Graph } from "../shared/graph.ts";
import type { Structure } from "./structures.ts";

/**
 * Map of sets: like the map of arrays, but each topic's prerequisites are a Set.
 *   9 → {5, 3, 6}
 *
 * Find X's prerequisites: hash X, look it up in the table (O(1) on average).
 * A Set makes "does X require Y directly?" O(1), but DFS and BFS never ask
 * that: they always walk through all of X's prerequisites.
 * Memory: O(V + E), but every topic gets its own small hash table.
 */
export function buildMapOfSets(graph: Graph): Structure {
  const map = new Map<number, Set<number>>();
  for (const topic of graph.nodes) map.set(topic.id, new Set());
  for (const [from, to] of graph.edges) map.get(from)!.add(to);

  return { prerequisites: (id) => map.get(id)! };
}
