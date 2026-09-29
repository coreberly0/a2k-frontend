import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { ROLE_META, type Role } from "@/lib/roles";

const MODULES: Record<Role, { title: string; items: string[] }[]> = {
  vendor: [
    { title: "Orders", items: ["Purchase orders", "Deliveries", "Payments received"] },
  ],
  seller: [
    { title: "Sales", items: ["New sale", "Monthly sales", "Family sale", "Bookings"] },
  ],
  admin: [
    {
      title: "Expenses",
      items: [
        "Diesel",
        "Toll gate",
        "Driver bata",
        "Maintenance",
        "Tyre",
        "Tyre puncture",
        "Vehicle grease",
        "Air",
        "Material purchase",
      ],
    },
    { title: "Income", items: ["Sale", "Monthly", "With GST", "Without GST"] },
    { title: "Vendors", items: ["Vendor list (purchase)", "Sale vendors"] },
    { title: "Fleet", items: ["GPS tracking"] },
  ],
  super_admin: [
    { title: "System", items: ["Manage admins", "Manage vendors and sellers", "Roles and access", "Audit log"] },
    { title: "Business", items: ["All expenses", "All income", "Reports"] },
  ],
};

export default async function RoleDashboard({
  params,
}: {
  params: Promise<{ role: string }>;
}) {
  const { role } = await params;
  const session = await getSession();

  if (!session) redirect("/login");
  if (role !== session.role) redirect(`/dashboard/${session.role}`);

  const groups = MODULES[session.role];

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between bg-steel px-6 py-4 text-white sm:px-10">
        <p className="font-display text-2xl font-bold">Load Ledger</p>
        <div className="flex items-center gap-5">
          <span className="hidden text-sm text-white/75 sm:block">{session.email}</span>
          <form action="/api/logout" method="post">
            <button className="border border-white/40 px-3 py-1.5 text-sm hover:bg-white/10">
              Sign out
            </button>
          </form>
        </div>
      </header>
      <div className="hazard h-1.5" aria-hidden />

      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10 sm:px-10">
        <h1 className="font-display text-4xl font-bold">{ROLE_META[session.role].label} dashboard</h1>
        <p className="mt-1 text-gravel">{ROLE_META[session.role].hint}</p>

        <div className="mt-8 space-y-8">
          {groups.map((g) => (
            <section key={g.title}>
              <h2 className="font-display text-2xl font-semibold">{g.title}</h2>
              <ul className="mt-2 divide-y divide-ink/10 border-y border-ink/10 bg-white">
                {g.items.map((item) => (
                  <li key={item} className="px-4 py-3">
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}