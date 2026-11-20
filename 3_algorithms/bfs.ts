import type { Structure } from "../2_data_structures/structures.ts";
import type { SearchResult } from "./algorithms.ts";

/**
 * Breadth-first search with a queue and a visited set (session 7).
 * Explores layer by layer: first all direct prerequisites, then theirs, …
 *
 * The queue is an array plus a read position (`head`). `queue.shift()` would
 * move every remaining element, O(n) per step (session 2); moving `head` is O(1).
 * Like the course's version, a topic is marked visited when it enters the queue.
 *
 * Time: O(V + E) for the reachable part (lists); O(V) per visit with the matrix.
 * Memory: visited set + queue. The queue can get wide: a whole layer at once.
 */
export function bfs(structure: Structure, start: number, target: number): SearchResult {
  const visited = new Set<number>([start]);
  const queue: number[] = [start];
  let head = 0; // next topic to take out of the queue
  let visits = 0;
  let edges = 0;
  let maxWaiting = 1;

  while (head < queue.length) {
    const topic = queue[head++]!; // take from the front
    visits++;
    if (topic === target) {
      return { found: true, visits, edges, maxTodo: maxWaiting, visitedSetSize: visited.size, stoppedAtCap: false };
    }
    for (const prerequisite of structure.prerequisites(topic)) {
      edges++;
      if (!visited.has(prerequisite)) {
        visited.add(prerequisite);
        queue.push(prerequisite); // add at the back
      }
    }
    const waiting = queue.length - head; // topics in the queue right now
    if (waiting > maxWaiting) maxWaiting = waiting;
  }
  return { found: false, visits, edges, maxTodo: maxWaiting, visitedSetSize: visited.size, stoppedAtCap: false };
}
