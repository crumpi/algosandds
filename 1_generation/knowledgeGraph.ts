import { graphName, type Edge, type Graph, type Topic } from "../shared/graph.ts";
import { mulberry32, pick, randInt } from "./rng.ts";

/** Curriculum depth: topics sit on levels 0 … 11. */
export const LEVELS = 12;
/** Share of all topics on level 0 (the foundations). */
const FOUNDATION_SHARE = 0.03;

/**
 * Generates a knowledge graph with n topics and on average p prerequisites per topic.
 *
 * 1. Levels make it a DAG: a topic only requires topics on lower levels,
 *    so no path can lead back to where it started.
 * 2. Depth: each topic's first prerequisite comes from the level directly
 *    below, so there is always a chain 11 → 10 → … → 0.
 * 3. Sparse: a topic above level 0 gets between 1 and 2p − 1 prerequisites,
 *    on average p.
 * 4. Hubs: each level has an "urn" that holds each of its topics once, plus one
 *    more copy every time the topic is chosen as a prerequisite. Drawing from
 *    the urn therefore prefers topics that are already popular.
 * 5. Reproducible: all randomness comes from `seed`.
 */
export function generateKnowledgeGraph(n: number, p: number, seed: number): Graph {
  const rng = mulberry32(seed);
  const sizes = levelSizes(n);
  const nodes: Topic[] = [];
  const edges: Edge[] = [];
  const urns: number[][] = []; // urns[level]

  for (let level = 0; level < LEVELS; level++) {
    const firstIdOfLevel = nodes.length; // every smaller id is on a lower level

    for (let i = 0; i < sizes[level]!; i++) {
      const id = nodes.length;
      nodes.push({ id, label: `L${level}-${i}`, level });
      if (level === 0) continue; // foundations require nothing

      const wanted = Math.min(randInt(rng, 1, 2 * p - 1), firstIdOfLevel);
      const chosen = new Set<number>();
      const choosePrerequisiteFrom = (urn: number[]) => {
        const u = pick(rng, urn);
        if (chosen.has(u)) return; // already a prerequisite of this topic: draw again
        chosen.add(u);
        edges.push([id, u]);
        urn.push(u); // one more copy: u is now more likely to be drawn again
      };

      choosePrerequisiteFrom(urns[level - 1]!); // rule 2: level directly below
      while (chosen.size < wanted) choosePrerequisiteFrom(urns[randInt(rng, 0, level - 1)]!);
    }

    // this level's topics only become available once the level is complete,
    // so a topic never requires a topic on its own level
    const urn: number[] = [];
    for (let id = firstIdOfLevel; id < nodes.length; id++) urn.push(id);
    urns.push(urn);
  }

  return { meta: { name: graphName(n, p, seed), n, p, seed, levels: LEVELS }, nodes, edges };
}

/** Level 0 gets ~3 % of the topics; the rest is split evenly over levels 1 … 11. */
function levelSizes(n: number): number[] {
  const foundation = Math.max(1, Math.round(n * FOUNDATION_SHARE));
  const rest = n - foundation;
  const upper = LEVELS - 1;
  if (rest < upper) throw new Error(`n = ${n} is too small for ${LEVELS} levels`);
  const sizes = [foundation];
  for (let l = 0; l < upper; l++) sizes.push(Math.floor(rest / upper) + (l < rest % upper ? 1 : 0));
  return sizes;
}
