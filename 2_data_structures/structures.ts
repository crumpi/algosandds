/**
 * The five data structures. Each one answers a single question,
 * "what does topic X require?", because that is all DFS and BFS (step 3) need.
 *
 * Adjacency lists, 2 × 2 (session 6: "a dictionary of lists"):
 *
 *                     inner: array          inner: Set
 *   outer: Map        map-of-arrays         map-of-sets
 *   outer: array      array-of-arrays       array-of-sets
 *
 * - The outer container decides how X's prerequisites are FOUND:
 *   hash the id (Map, session 5) or jump to position X (array, session 2).
 * - The inner container decides how they are STORED:
 *   a plain list, or a small hash table per topic (Set).
 *
 * Plus the adjacency matrix: one row of V cells per topic (session 6).
 */
import type { Graph } from "../shared/graph.ts";
import { buildArrayOfArrays } from "./arrayOfArrays.ts";
import { buildArrayOfSets } from "./arrayOfSets.ts";
import { buildMapOfArrays } from "./mapOfArrays.ts";
import { buildMapOfSets } from "./mapOfSets.ts";
import { buildMatrix, MATRIX_MAX_TOPICS } from "./matrix.ts";

export interface Structure {
  /** "What does topic `id` require?" Anything a for…of loop can walk through. */
  prerequisites(id: number): Iterable<number>;
}

export interface StructureSpec {
  name: string;
  build(graph: Graph): Structure;
  /** Largest graph this structure is built for (only the matrix has a limit). */
  maxTopics: number;
}

export const STRUCTURES: StructureSpec[] = [
  { name: "map-of-arrays", build: buildMapOfArrays, maxTopics: Infinity },
  { name: "map-of-sets", build: buildMapOfSets, maxTopics: Infinity },
  { name: "array-of-arrays", build: buildArrayOfArrays, maxTopics: Infinity },
  { name: "array-of-sets", build: buildArrayOfSets, maxTopics: Infinity },
  { name: "matrix", build: buildMatrix, maxTopics: MATRIX_MAX_TOPICS },
];
