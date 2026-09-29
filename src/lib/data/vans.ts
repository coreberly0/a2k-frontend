import { makeStore } from "../store";

export type Van = { id: string; number: string; driver: string };
export const vansStore = makeStore<Van>("vans", [
  { id: "van1", number: "TN-01-AB-1234", driver: "Murugan" },
  { id: "van2", number: "TN-01-CD-5678", driver: "Selvam" },
]);
export const vanNumber = (id: string) => vansStore.get(id)?.number ?? "-";
