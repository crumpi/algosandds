import type { Graph } from "../shared/graph.ts";
import type { Structure } from "./structures.ts";

/**
 * Map of arrays: the course's "dictionary of lists".
 *   9 → [5, 3, 6]   topic 9 requires topics 5, 3 and 6
 *
 * Find X's prerequisites: hash X, look it up in the table (O(1) on average).
 * Memory: O(V + E), plus the hash table's spare room.
 */
export function buildMapOfArrays(graph: Graph): Structure {
  const map = new Map<number, number[]>();
  for (const topic of graph.nodes) map.set(topic.id, []);
  for (const [from, to] of graph.edges) map.get(from)!.push(to);

  return { prerequisites: (id) => map.get(id)! };
}
