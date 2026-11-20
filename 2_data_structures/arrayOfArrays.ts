import type { Graph } from "../shared/graph.ts";
import type { Structure } from "./structures.ts";

/**
 * Array of arrays: the topic id is the position in the outer array.
 *   list[9] = [5, 3, 6]   topic 9 requires topics 5, 3 and 6
 *
 * Find X's prerequisites: jump straight to position X (O(1), no hashing).
 * Memory: O(V + E).
 */
export function buildArrayOfArrays(graph: Graph): Structure {
  const list: number[][] = graph.nodes.map(() => []);
  for (const [from, to] of graph.edges) list[from]!.push(to);

  return { prerequisites: (id) => list[id]! };
}
