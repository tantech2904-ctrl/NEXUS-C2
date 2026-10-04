import seedrandom from 'seedrandom';

export class PRNG {
  private rng: seedrandom.PRNG;
  private currentSeed: number;

  constructor(seed: number = 42) {
    this.currentSeed = seed;
    this.rng = seedrandom(seed.toString());
  }

  public next(): number {
    return this.rng();
  }

  public nextRange(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  public nextInt(min: number, max: number): number {
    return Math.floor(this.nextRange(min, max + 1));
  }

  public reseed(seed: number): void {
    this.currentSeed = seed;
    this.rng = seedrandom(seed.toString());
  }

  public getSeed(): number {
    return this.currentSeed;
  }
}
