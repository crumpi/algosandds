/**
 * Seeded random numbers. `Math.random()` cannot be seeded, so the generator
 * uses mulberry32: the same seed always gives the same sequence of numbers,
 * which makes every generated graph reproducible.
 */

export type Rng = () => number;

/** Returns a function that produces numbers in [0, 1), fully determined by `seed`. */
export function mulberry32(seed: number): Rng {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Random whole number from lo to hi (both included). */
export function randInt(rng: Rng, lo: number, hi: number): number {
  return lo + Math.floor(rng() * (hi - lo + 1));
}

/** Random element of a non-empty array. */
export function pick<T>(rng: Rng, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length)]!;
}
