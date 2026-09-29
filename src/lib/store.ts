// In-memory store (resets when the server restarts).
// When you add a database, only this file and lib/data/* change.
export type Row = { id: string; [k: string]: unknown };
export type Store = {
  list(): Row[];
  get(id: string): Row | undefined;
  add(d: Record<string, unknown>): Row;
  update(id: string, d: Record<string, unknown>): void;
  remove(id: string): void;
};

const g = globalThis as unknown as { __stores?: Record<string, Row[]> };

export function makeStore<T extends { id: string }>(key: string, seed: T[]) {
  const all = (g.__stores ??= {});
  const rows = (all[key] ??= seed.map((s) => ({ ...s })) as unknown as Row[]) as unknown as T[];
  return {
    list: () => rows,
    get: (id: string) => rows.find((r) => r.id === id),
    add: (d: Omit<T, "id">) => {
      const r = { ...d, id: key[0] + Date.now().toString(36) + Math.random().toString(36).slice(2, 5) } as T;
      rows.push(r);
      return r;
    },
    update: (id: string, d: Partial<T>) => {
      const r = rows.find((x) => x.id === id);
      if (r) Object.assign(r, d);
    },
    remove: (id: string) => {
      const i = rows.findIndex((x) => x.id === id);
      if (i >= 0) rows.splice(i, 1);
    },
  };
}
export const asStore = (s: unknown) => s as Store;
