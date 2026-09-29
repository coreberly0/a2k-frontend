export const ROLES = ["vendor", "seller", "admin", "super_admin"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_META: Record<
  Role,
  { label: string; hint: string; demo: { email: string; password: string } }
> = {
  vendor: {
    label: "Vendor",
    hint: "Quarries and suppliers",
    demo: { email: "vendor@demo.com", password: "vendor123" },
  },
  seller: {
    label: "Seller",
    hint: "Sales and bookings",
    demo: { email: "seller@demo.com", password: "seller123" },
  },
  admin: {
    label: "Admin (Owner)",
    hint: "Expenses, income, vendors",
    demo: { email: "owner@demo.com", password: "owner123" },
  },
  super_admin: {
    label: "Super Admin",
    hint: "Full system control",
    demo: { email: "super@demo.com", password: "super123" },
  },
};

export const isRole = (v: unknown): v is Role =>
  typeof v === "string" && (ROLES as readonly string[]).includes(v);