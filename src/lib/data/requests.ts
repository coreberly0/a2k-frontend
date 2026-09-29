import { makeStore } from "../store";

export const REQUEST_STATUS = ["New", "Vendor checked", "Ordered", "Delivered", "Cancelled"] as const;
export type Request = {
  id: string; customerId: string; material: string; qty: number;
  site: string; sellRate: number; status: string; date: string;
};
export const requestsStore = makeStore<Request>("requests", [
  { id: "r1", customerId: "c1", material: "M-sand", qty: 10, site: "Anna Nagar, Chennai", sellRate: 4500, status: "Ordered", date: "2026-09-29" },
]);
