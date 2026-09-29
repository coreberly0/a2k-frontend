export const ROLES = ["super_admin", "admin", "vendor", "customer"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_META: Record<
  Role,
  { label: string; hint: string; demo: { email: string; password: string } }
> = {
  super_admin: {
    label: "Super Admin",
    hint: "Create users, give rights, watch the audit log",
    demo: { email: "super@demo.com", password: "super123" },
  },
  admin: {
    label: "Admin (Agent)",
    hint: "Requests, vendor orders, vans and expenses",
    demo: { email: "owner@demo.com", password: "owner123" },
  },
  vendor: {
    label: "Vendor",
    hint: "Orders sent to you",
    demo: { email: "vendor@demo.com", password: "vendor123" },
  },
  customer: {
    label: "Customer",
    hint: "Your material requests and delivery status",
    demo: { email: "customer@demo.com", password: "customer123" },
  },
};

export const isRole = (v: unknown): v is Role =>
  typeof v === "string" && (ROLES as readonly string[]).includes(v);

// URL folder for each role (super_admin uses a dash in the URL)
export const homePath = (role: Role) =>
  `/dashboard/${role === "super_admin" ? "super-admin" : role}`;

// Shown on the Rights page. Change here when your rules change.
export const RIGHTS: { right: string; allowed: Role[] }[] = [
  { right: "Create and edit any user", allowed: ["super_admin"] },
  { right: "See audit log", allowed: ["super_admin"] },
  { right: "Add vendors and customers", allowed: ["super_admin", "admin"] },
  { right: "Create vendor orders and assign vans", allowed: ["super_admin", "admin"] },
  { right: "Enter expenses (diesel, toll, bata...)", allowed: ["super_admin", "admin"] },
  { right: "See profit and van tracking", allowed: ["super_admin", "admin"] },
  { right: "Update status of own orders", allowed: ["vendor"] },
  { right: "See own requests and delivery status", allowed: ["customer"] },
];
