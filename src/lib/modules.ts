import { asStore, type Row, type Store } from "./store";
import { usersStore, usersByRole } from "./users";
import { vansStore } from "./data/vans";
import { requestsStore, REQUEST_STATUS } from "./data/requests";
import { ordersStore, ORDER_STATUS } from "./data/orders";
import { expensesStore, EXPENSE_TYPES } from "./data/expenses";
import { ROLES, ROLE_META, type Role } from "./roles";
import { today } from "./format";

export type Opt = { value: string; label: string };
export type Field = {
  name: string; label: string;
  type?: "text" | "number" | "password" | "select" | "date" | "bool";
  options?: () => Opt[];
  required?: boolean;
};
export type Mod = {
  key: string; label: string; single: string; base: string; roles: Role[];
  store: Store; fields: Field[];
  filter?: (r: Row) => boolean;      // which rows this module may see or change
  fixed?: Record<string, unknown>;   // values forced when adding
  unique?: string;                   // field that must be unique (email)
};

const list = (a: readonly string[]): Opt[] => a.map((x) => ({ value: x, label: x }));
const people = (role: Role): Opt[] => usersByRole(role).map((u) => ({ value: u.id, label: u.name }));
const ADMINS: Role[] = ["admin", "super_admin"];

const person = (role: Role, key: string, label: string, single: string, extra: Field[]): Mod => ({
  key, label, single, base: "/dashboard/admin", roles: ADMINS,
  store: asStore(usersStore),
  filter: (r) => r.role === role,
  fixed: { role, active: true, phone: "", address: "" },
  unique: "email",
  fields: [
    { name: "name", label: "Name", required: true },
    { name: "email", label: "Email (login)", required: true },
    { name: "password", label: "Password", type: "password" },
    ...extra,
  ],
});

export const MODULES: Record<string, Mod> = {
  users: {
    key: "users", label: "Users", single: "user", base: "/dashboard/super-admin", roles: ["super_admin"],
    store: asStore(usersStore), unique: "email",
    fixed: { phone: "", address: "" },
    fields: [
      { name: "name", label: "Name", required: true },
      { name: "email", label: "Email (login)", required: true },
      { name: "password", label: "Password", type: "password" },
      { name: "role", label: "Role", type: "select", required: true,
        options: () => ROLES.map((r) => ({ value: r, label: ROLE_META[r].label })) },
      { name: "active", label: "Active", type: "bool" },
    ],
  },
  vendors: person("vendor", "vendors", "Vendors", "vendor", [{ name: "phone", label: "Phone" }]),
  customers: person("customer", "customers", "Customers", "customer", [
    { name: "phone", label: "Phone" }, { name: "address", label: "Site address" },
  ]),
  vans: {
    key: "vans", label: "Vans", single: "van", base: "/dashboard/admin", roles: ADMINS,
    store: asStore(vansStore),
    fields: [
      { name: "number", label: "Van number", required: true },
      { name: "driver", label: "Driver", required: true },
    ],
  },
  requests: {
    key: "requests", label: "Customer requests", single: "request", base: "/dashboard/admin", roles: ADMINS,
    store: asStore(requestsStore),
    fixed: { date: today(), status: "New" },
    fields: [
      { name: "customerId", label: "Customer", type: "select", required: true, options: () => people("customer") },
      { name: "material", label: "Material", required: true },
      { name: "qty", label: "Quantity", type: "number", required: true },
      { name: "site", label: "Delivery site", required: true },
      { name: "sellRate", label: "Selling rate", type: "number", required: true },
      { name: "status", label: "Status", type: "select", required: true, options: () => list(REQUEST_STATUS) },
    ],
  },
  orders: {
    key: "orders", label: "Vendor orders", single: "order", base: "/dashboard/admin", roles: ADMINS,
    store: asStore(ordersStore),
    fixed: { date: today() },
    fields: [
      { name: "requestId", label: "For request", type: "select", required: true,
        options: () => requestsStore.list().map((r) => ({ value: r.id, label: `${r.material} × ${r.qty} · ${usersStore.get(r.customerId)?.name ?? "-"}` })) },
      { name: "vendorId", label: "Vendor", type: "select", required: true, options: () => people("vendor") },
      { name: "vanId", label: "Van", type: "select", required: true,
        options: () => vansStore.list().map((v) => ({ value: v.id, label: `${v.number} (${v.driver})` })) },
      { name: "material", label: "Material", required: true },
      { name: "qty", label: "Quantity", type: "number", required: true },
      { name: "buyRate", label: "Buying rate", type: "number", required: true },
      { name: "status", label: "Status", type: "select", required: true, options: () => list(ORDER_STATUS) },
    ],
  },
  expenses: {
    key: "expenses", label: "Expenses", single: "expense", base: "/dashboard/admin", roles: ADMINS,
    store: asStore(expensesStore),
    fields: [
      { name: "vanId", label: "Van", type: "select", required: true,
        options: () => vansStore.list().map((v) => ({ value: v.id, label: v.number })) },
      { name: "type", label: "Type", type: "select", required: true, options: () => list(EXPENSE_TYPES) },
      { name: "amount", label: "Amount", type: "number", required: true },
      { name: "date", label: "Date", type: "date", required: true },
    ],
  },
};

// Turn a stored value into readable text for lists
export function display(f: Field, v: unknown): string {
  if (f.type === "bool") return v ? "Yes" : "No";
  if (f.type === "select") return f.options?.().find((o) => o.value === v)?.label ?? String(v ?? "-");
  return v === undefined || v === "" ? "-" : String(v);
}
