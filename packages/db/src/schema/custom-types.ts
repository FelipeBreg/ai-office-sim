import { customType } from 'drizzle-orm/pg-core';

export const vector = customType<{ data: number[]; driverParam: string }>({
  dataType() {
    return 'vector(1536)';
  },
  toDriver(value: number[]): string {
    const safe = value.map((v) => {
      const n = Number(v);
      if (!Number.isFinite(n)) throw new Error(`Invalid vector component: ${v}`);
      return n;
    });
    return `[${safe.join(',')}]`;
  },
  fromDriver(value: unknown): number[] {
    if (typeof value !== 'string') {
      throw new Error(`Expected string from driver for vector column, got ${typeof value}`);
    }
    return value
      .slice(1, -1)
      .split(',')
      .map(Number);
  },
});
