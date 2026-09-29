import { requireRole } from "@/lib/guard";
import { auditStore } from "@/lib/data/audit";

export default async function AuditLog() {
  await requireRole(["super_admin"]);
  const rows = [...auditStore.list()].reverse().slice(0, 200);
  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10 sm:px-10">
      <h1 className="font-display text-4xl font-bold">Audit log</h1>
      <ul className="mt-6 divide-y divide-ink/10 border-y border-ink/10 bg-white">
        {rows.length === 0 && <li className="px-4 py-6 text-gravel">Nothing recorded yet.</li>}
        {rows.map((a) => (
          <li key={a.id} className="flex flex-wrap justify-between gap-2 px-4 py-3 text-sm">
            <span>{a.action}</span>
            <span className="text-gravel">{a.who} · {new Date(a.at).toLocaleString("en-IN")}</span>
          </li>
        ))}
      </ul>
    </main>
  );
}
