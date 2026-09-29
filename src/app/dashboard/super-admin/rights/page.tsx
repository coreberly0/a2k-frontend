import { requireRole } from "@/lib/guard";
import { RIGHTS, ROLES, ROLE_META } from "@/lib/roles";

export default async function RightsPage() {
  await requireRole(["super_admin"]);
  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10 sm:px-10">
      <h1 className="font-display text-4xl font-bold">Rights</h1>
      <p className="mt-1 text-gravel">What each role can do. Change the list in lib/roles.ts.</p>
      <div className="mt-6 overflow-x-auto border border-ink/10 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-ink/10 bg-paper">
            <tr>
              <th className="px-4 py-2 font-medium">Right</th>
              {ROLES.map((r) => <th key={r} className="px-4 py-2 font-medium">{ROLE_META[r].label}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10">
            {RIGHTS.map((x) => (
              <tr key={x.right}>
                <td className="px-4 py-3">{x.right}</td>
                {ROLES.map((r) => <td key={r} className="px-4 py-3">{x.allowed.includes(r) ? "Yes" : "-"}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
