# Step 1: generating the test graphs

Produces the graphs that steps 2 and 3 measure. Steps 2 and 3 only read these files, so every graph in the report exists as a JSON file here.

## Run

```sh
node 1_generation/run.ts          # p = 5 (default)
node 1_generation/run.ts --p 3    # same sizes, 3 prerequisites on average
```

Takes under a second. The seed is fixed, so rerunning gives byte-identical files.

## Files

| File | What |
|---|---|
| `run.ts` | Entry point: generates every size, writes the files below |
| `knowledgeGraph.ts` | The generator (rules below) |
| `rng.ts` | Seeded random numbers (mulberry32), because `Math.random()` can't be seeded |
| `generation.test.ts` | Checks: DAG, same seed = same graph, average ≈ p |
| `graphs/kg_n{n}_p{p}_s42.json` | One generated graph per size n |
| `graphs/example_cs.json` | Hand-made graph with 12 real topics (Variables, Arrays, …) for diagrams and hand traces |
| `overview.ts` | Writes `graphs/overview.csv` (called by `run.ts`) |
| `graphs/overview.csv` | One row per graph file in `graphs/`: topics, edges, levels, foundations, average and max prerequisites, biggest hub, longest path, matrix fill, file size |

The graph type and the list of sizes live in `../shared/graph.ts`, because all three steps use them.

**Sizes:** n = 100, 200, 500, 1,000, 2,000, 5,000, 10,000, 20,000, 50,000, 100,000 topics; seed 42. This 1-2-5 series is evenly spaced on a log axis, three points per factor of 10. The 50,000 and 100,000 files (5 and 10 MB) are not committed. Run `run.ts` to recreate them.

### Columns of `graphs/overview.csv`

| Column | Meaning |
|---|---|
| `file`, `p` | Graph file; target average prerequisites (empty for the hand-made example) |
| `topics`, `edges` | V and E |
| `levels`, `foundations` | Number of levels; topics on level 0, which require nothing |
| `avgPrereqs` | E / topics above level 0: the average the generator aims for (≈ p) |
| `maxPrereqs` | Most prerequisites a single topic has (generator: at most 2p − 1) |
| `biggestHub`, `biggestHubLabel` | Most topics that require one single topic, and which topic that is |
| `longestPath` | Longest chain of "requires" in edges. DFS's call stack is at most one deeper |
| `matrixFill` | E / V²: share of the matrix cells that would be 1. Shows how sparse the graph is |
| `fileKB` | Size of the JSON file |

## What a graph is

Topics are the nodes. An edge `[B, A]` means **B requires A**. Adding "B requires A" creates a cycle exactly when A already reaches B.

```json
{
  "meta":  { "name": "kg_n1000_p5_s42", "n": 1000, "p": 5, "seed": 42, "levels": 12 },
  "nodes": [ { "id": 0, "label": "L0-0", "level": 0 }, ... ],
  "edges": [ [31, 7], ... ]
}
```

- `id` runs from 0 to n − 1 and equals the topic's position in `nodes`.
- `label` is `L{level}-{index in level}`, standing in for a real name like "Recursion".
- `level` 0 = foundations; every edge goes from a higher to a lower level.

## How the generator works

1. **Levels make it a DAG.** Every topic sits on one of 12 levels (0 = basics, 11 = advanced) and only requires topics on lower levels. A path always goes down, so it can never come back to its start. There are no cycles, by construction.
2. **Depth.** Each topic's first prerequisite comes from the level directly below, so there is always a chain 11 → 10 → … → 0. The longest path is 11 edges for every size.
3. **Sparse.** A topic above level 0 gets a random number of prerequisites between 1 and 2p − 1, so p on average (p = 5: between 1 and 9).
4. **Hubs.** Each level has an "urn" holding each of its topics once. Every time a topic is chosen as a prerequisite, one more copy goes in. Drawing from the urn therefore favours topics that are already popular ("rich get richer"). The result is a few foundations that very many topics require, like "Variables" in a real curriculum.
5. **Reproducible.** All randomness comes from the seed.

Level 0 holds 3 % of the topics; the other topics are split evenly over levels 1–11.

## What the graphs look like (p = 5)

| n | E | Prerequisites per topic (above level 0) | Biggest hub (topics requiring it) | Longest path |
|---:|---:|---:|---:|---:|
| 100 | 436 | 4.5 | 39 | 11 |
| 1,000 | 4,804 | 4.95 | 83 | 11 |
| 5,000 | 24,103 | 4.97 | 178 | 11 |
| 20,000 | 96,843 | 4.99 | 279 | 11 |
| 10,000 | 48,161 | 4.97 | 200 | 11 |
| 100,000 | 484,476 | 4.99 | 317 | 11 |

- E ≈ 5 · V: the graphs are sparse. A matrix would have V² cells, but only about 5 per row are used.
- At n = 100 the average is a bit below 5. Level 0 has only 3 topics, so a level-1 topic can't get more than 3 prerequisites.
- The biggest hub grows with n, while an average topic is required by only ~5 others.

## Simplifications (for the report's limitations)

- No subject areas, so the graphs have no clusters.
- Labels are synthetic; only `example_cs.json` has real topic names.
