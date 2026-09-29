import { makeStore } from "./store";
import type { Role } from "./roles";

export type User = {
  id: string; name: string; email: string; password: string;
  role: Role; phone: string; address: string; active: boolean;
};

// DEMO ONLY: plain passwords. Use a database + bcrypt for real use.
export const usersStore = makeStore<User>("users", [
  { id: "x1", name: "Super Admin", email: "super@demo.com", password: "super123", role: "super_admin", phone: "", address: "", active: true },
  { id: "a1", name: "Owner", email: "owner@demo.com", password: "owner123", role: "admin", phone: "9000000000", address: "", active: true },
  { id: "v1", name: "Ravi Quarry", email: "vendor@demo.com", password: "vendor123", role: "vendor", phone: "9000000001", address: "", active: true },
  { id: "v2", name: "Sri Blue Metal", email: "sri@demo.com", password: "vendor123", role: "vendor", phone: "9000000002", address: "", active: true },
  { id: "c1", name: "Kumar Constructions", email: "customer@demo.com", password: "customer123", role: "customer", phone: "9000000003", address: "Anna Nagar, Chennai", active: true },
]);

export const usersByRole = (role: Role) => usersStore.list().filter((u) => u.role === role);
export const userName = (id: string) => usersStore.get(id)?.name ?? "-";
