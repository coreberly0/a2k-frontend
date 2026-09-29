import { makeStore } from "../store";

export type Audit = { id: string; at: string; who: string; action: string };
export const auditStore = makeStore<Audit>("audit", []);

export const logAudit = (who: string, action: string) =>
  auditStore.add({ at: new Date().toISOString(), who, action });
