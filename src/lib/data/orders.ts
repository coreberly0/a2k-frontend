import { makeStore } from "../store";

export const ORDER_STATUS = ["Ordered", "Loaded", "On the way", "Delivered"] as const;
export type Order = {
  id: string; requestId: string; vendorId: string; vanId: string;
  material: string; qty: number; buyRate: number; status: string; date: string;
};
export const ordersStore = makeStore<Order>("orders", [
  { id: "o1", requestId: "r1", vendorId: "v1", vanId: "van1", material: "M-sand", qty: 10, buyRate: 4000, status: "On the way", date: "2026-09-29" },
]);
