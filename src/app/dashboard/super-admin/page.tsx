import Link from "next/link";
import { requireRole } from "@/lib/guard";
import { usersStore } from "@/lib/users";
import { vansStore } from "@/lib/data/vans";
import { ordersStore } from "@/lib/data/orders";

export default async function SuperAdminHome() {
  await requireRole(["super_admin"]);
  const users = usersStore.list();
  const stats = [
    ["Users", users.length],
    ["Vendors", users.filter((u) => u.role === "vendor").length],
    ["Customers", users.filter((u) => u.role === "customer").length],
    ["Vans", vansStore.list().length],
    ["Vendor orders", ordersStore.list().length],
  ];
  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10 sm:px-10">
      <h1 className="font-display text-4xl font-bold">Super Admin</h1>
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
        {stats.map(([l, v]) => (
          <div key={l} className="border border-ink/10 bg-white p-4">
            <p className="text-sm text-gravel">{l}</p>
            <p className="font-display text-3xl font-bold">{v}</p>
          </div>
        ))}
      </div>
      <p className="mt-8">
        <Link href="/dashboard/super-admin/users" className="bg-signal px-4 py-2 font-semibold text-ink">Manage users</Link>
      </p>
    </main>
  );
}
