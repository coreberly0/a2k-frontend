import { requireRole } from "@/lib/guard";
import { requestsStore } from "@/lib/data/requests";
import { ordersStore } from "@/lib/data/orders";
import { vanNumber } from "@/lib/data/vans";

export default async function CustomerHome() {
  const s = await requireRole(["customer"]);
  const mine = requestsStore.list().filter((r) => r.customerId === s.id); // only this customer

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10 sm:px-10">
      <h1 className="font-display text-4xl font-bold">My requests</h1>
      <ul className="mt-6 divide-y divide-ink/10 border-y border-ink/10 bg-white">
        {mine.length === 0 && <li className="px-4 py-6 text-gravel">No requests yet.</li>}
        {mine.map((r) => {
          const orders = ordersStore.list().filter((o) => o.requestId === r.id);
          return (
            <li key={r.id} className="px-4 py-3">
              <p>{r.material} × {r.qty} to {r.site} <strong className="ml-2">{r.status}</strong></p>
              {orders.map((o) => (
                <p key={o.id} className="text-sm text-gravel">Van {vanNumber(o.vanId)}: {o.status}</p>
              ))}
            </li>
          );
        })}
      </ul>
    </main>
  );
}
