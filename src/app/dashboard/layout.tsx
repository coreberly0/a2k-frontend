import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { ROLE_META, type Role } from "@/lib/roles";

const ADMIN_LINKS = [
  { href: "/dashboard/admin", label: "Overview" },
  { href: "/dashboard/admin/requests", label: "Requests" },
  { href: "/dashboard/admin/orders", label: "Vendor orders" },
  { href: "/dashboard/admin/vans", label: "Vans" },
  { href: "/dashboard/admin/expenses", label: "Expenses" },
  { href: "/dashboard/admin/vendors", label: "Vendors" },
  { href: "/dashboard/admin/customers", label: "Customers" },
];

const NAV: Record<Role, { href: string; label: string }[]> = {
  super_admin: [
    { href: "/dashboard/super-admin", label: "Overview" },
    { href: "/dashboard/super-admin/users", label: "Users" },
    { href: "/dashboard/super-admin/rights", label: "Rights" },
    { href: "/dashboard/super-admin/audit-log", label: "Audit log" },
    ...ADMIN_LINKS,
  ],
  admin: ADMIN_LINKS,
  vendor: [{ href: "/dashboard/vendor", label: "My orders" }],
  customer: [{ href: "/dashboard/customer", label: "My requests" }],
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between bg-steel px-6 py-4 text-white sm:px-10">
        <p className="font-display text-2xl font-bold">
          Load Ledger <span className="text-sm font-normal text-white/70">{ROLE_META[session.role].label}</span>
        </p>
        <div className="flex items-center gap-5">
          <span className="hidden text-sm text-white/75 sm:block">{session.name}</span>
          <form action="/api/logout" method="post">
            <button className="border border-white/40 px-3 py-1.5 text-sm hover:bg-white/10">Sign out</button>
          </form>
        </div>
      </header>
      <div className="hazard h-1.5" aria-hidden />
      <nav className="overflow-x-auto border-b border-ink/10 bg-white px-6 sm:px-10">
        <ul className="flex gap-6 whitespace-nowrap text-sm">
          {NAV[session.role].map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="block py-3 text-steel hover:underline underline-offset-4">{l.label}</Link>
            </li>
          ))}
        </ul>
      </nav>
      {children}
    </div>
  );
}
