import Link from "next/link";
import { requireRole } from "@/lib/guard";
import { MODULES, display } from "@/lib/modules";
import { removeRecord } from "@/app/dashboard/actions";

export default async function ModuleList({ moduleKey }: { moduleKey: string }) {
  const m = MODULES[moduleKey];
  await requireRole(m.roles);
  const rows = m.store.list().filter(m.filter ?? (() => true));
  const cols = m.fields.filter((f) => f.type !== "password");

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10 sm:px-10">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-4xl font-bold">{m.label}</h1>
        <Link href={`${m.base}/${m.key}/new`} className="bg-signal px-4 py-2 font-semibold text-ink hover:bg-signal/85">
          Add {m.single}
        </Link>
      </div>

      <div className="mt-6 overflow-x-auto border border-ink/10 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-ink/10 bg-paper">
            <tr>
              {cols.map((f) => <th key={f.name} className="px-4 py-2 font-medium">{f.label}</th>)}
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10">
            {rows.length === 0 && (
              <tr><td colSpan={cols.length + 1} className="px-4 py-6 text-gravel">No {m.label.toLowerCase()} yet. Add the first one.</td></tr>
            )}
            {rows.map((r) => (
              <tr key={r.id}>
                {cols.map((f) => <td key={f.name} className="px-4 py-3">{display(f, r[f.name])}</td>)}
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  <Link href={`${m.base}/${m.key}/${r.id}/edit`} className="mr-4 text-steel underline underline-offset-4">Edit</Link>
                  <form action={removeRecord} className="inline">
                    <input type="hidden" name="module" value={m.key} />
                    <input type="hidden" name="id" value={r.id} />
                    <button className="text-red-700 underline underline-offset-4">Remove</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
