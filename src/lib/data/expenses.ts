import { makeStore } from "../store";

export const EXPENSE_TYPES = [
  "Diesel", "Toll gate", "Driver bata", "Maintenance", "Tyre",
  "Tyre puncture", "Vehicle grease", "Air", "Material purchase",
] as const;
export type Expense = { id: string; vanId: string; type: string; amount: number; date: string };
export const expensesStore = makeStore<Expense>("expenses", [
  { id: "e1", vanId: "van1", type: "Diesel", amount: 3500, date: "2026-09-29" },
  { id: "e2", vanId: "van1", type: "Toll gate", amount: 400, date: "2026-09-29" },
  { id: "e3", vanId: "van2", type: "Driver bata", amount: 600, date: "2026-09-29" },
]);
