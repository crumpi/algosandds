/**
 * Picks the cycle checks for one graph: "would adding 'B requires A' create a cycle?"
 *
 * For every level of A (0 … 11), CHECKS_PER_KIND checks with a cycle (B is a
 * topic A already reaches) and CHECKS_PER_KIND without (B is a topic A does
 * not reach). A level-0 topic reaches nothing, so level 0 has no cycle checks.
 * The level of A decides how much of the graph a search has to walk.
 *
 * Fixed seed: every structure and algorithm gets exactly the same checks.
 */
import { mulberry32, pick } from "../1_generation/rng.ts";
import type { Graph } from "../shared/graph.ts";

export const CHECKS_PER_KIND = 10;
const SEED = 2026;

export interface Check {
  a: number;
  b: number;
  levelA: number;
  /** The correct answer, worked out here independently of the algorithms being measured. */
  cycle: boolean;
}

export function buildChecks(graph: Graph): Check[] {
  const rng = mulberry32(SEED);
  const prerequisites: number[][] = graph.nodes.map(() => []);
  for (const [from, to] of graph.edges) prerequisites[from]!.push(to);

  const levels = graph.nodes.reduce((max, t) => Math.max(max, t.level), 0) + 1; // reduce, not Math.max(...): that fails above ~120,000 values
  const checks: Check[] = [];

  for (let level = 0; level < levels; level++) {
    const topics = graph.nodes.filter((t) => t.level === level).map((t) => t.id);
    for (let i = 0; i < CHECKS_PER_KIND; i++) {
      const a = pick(rng, topics);
      const reached = reachableFrom(prerequisites, a); // everything A requires, directly or not

      if (reached.length > 0) checks.push({ a, b: pick(rng, reached), levelA: level, cycle: true });

      const reachedSet = new Set(reached);
      let b: number;
      do b = Math.floor(rng() * graph.nodes.length);
      while (b === a || reachedSet.has(b));
      checks.push({ a, b, levelA: level, cycle: false });
    }
  }
  return checks;
}

/** All topics `start` requires, directly or indirectly (without `start` itself). */
function reachableFrom(prerequisites: number[][], start: number): number[] {
  const seen = new Set<number>([start]);
  const todo = [start];
  while (todo.length > 0) {
    for (const p of prerequisites[todo.pop()!]!) {
      if (!seen.has(p)) {
        seen.add(p);
        todo.push(p);
      }
    }
  }
  seen.delete(start);
  return [...seen];
}
