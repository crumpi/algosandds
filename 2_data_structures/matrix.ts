import type { Graph } from "../shared/graph.ts";
import type { Structure } from "./structures.ts";

/**
 * Largest graph the matrix is built for: 20,000 topics → 4 · 10⁸ cells = 400 MB.
 * 50,000 topics would need 2.5 GB and 100,000 topics 10 GB, so those are only calculated.
 */
export const MATRIX_MAX_TOPICS = 20_000;

/**
 * Adjacency matrix: one row of V cells per topic, 1 byte per cell.
 *   matrix[9][5] = 1   topic 9 requires topic 5
 *
 * Find X's prerequisites: scan the whole row X for 1s. That takes V steps,
 * even if X has only 5 prerequisites.
 * Memory: O(V²), whether an edge exists or not.
 * Its strength, "does X require Y?" in O(1) (one cell), is not what DFS and BFS need.
 */
export function buildMatrix(graph: Graph): Structure {
  const V = graph.nodes.length;
  if (V > MATRIX_MAX_TOPICS) throw new Error(`a matrix for ${V} topics would need ${V * V} bytes`);

  const matrix: Uint8Array[] = graph.nodes.map(() => new Uint8Array(V)); // all 0 = no edge
  for (const [from, to] of graph.edges) matrix[from]![to] = 1;

  return {
    prerequisites: (id) => {
      const row = matrix[id]!;
      const result: number[] = [];
      for (let col = 0; col < V; col++) if (row[col] === 1) result.push(col);
      return result;
    },
  };
}
