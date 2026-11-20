/**
 * Step 1: generate the test graphs.
 *
 *   node 1_generation/run.ts          # p = 5 (default)
 *   node 1_generation/run.ts --p 3    # same sizes, 3 prerequisites on average
 *
 * Writes graphs/kg_n{n}_p{p}_s42.json for every size in SIZES, then
 * graphs/overview.csv describing every graph file in the folder.
 */
import { graphPath, pFromArgs, SEED, SIZES, writeGraph } from "../shared/graph.ts";
import { generateKnowledgeGraph } from "./knowledgeGraph.ts";
import { writeOverview } from "./overview.ts";

const p = pFromArgs();

for (const n of SIZES) {
  const graph = generateKnowledgeGraph(n, p, SEED);
  writeGraph(graph, graphPath(n, p));
  console.log(`${graph.meta.name.padEnd(20)} V=${String(graph.nodes.length).padStart(6)}  E=${String(graph.edges.length).padStart(6)}`);
}

console.log(`\nwrote ${SIZES.length} graphs and ${writeOverview()}`);
