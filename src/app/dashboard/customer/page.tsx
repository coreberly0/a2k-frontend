import { requireRole } from "@/lib/guard";
import { requestsStore } from "@/lib/data/requests";
import { ordersStore } from "@/lib/data/orders";
import { vanNumber } from "@/lib/data/vans";
import { usersStore } from "@/lib/users";
import { createCustomerRequest } from "../actions";

const box =
  "w-full border border-ink/20 bg-white px-3 py-2.5 outline-none focus:border-steel focus:ring-2 focus:ring-steel/30";

export default async function CustomerHome() {
  const s = await requireRole(["customer"]);
  const me = usersStore.get(s.id);
  const mine = requestsStore
    .list()
    .filter((r) => r.customerId === s.id) // only this customer
    .reverse();

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10 sm:px-10">
      <h1 className="font-display text-4xl font-bold">Order material</h1>

      <form
        action={createCustomerRequest}
        className="mt-6 grid gap-4 border border-ink/10 bg-white p-5 sm:grid-cols-2"
      >
        <div>
          <label htmlFor="material" className="mb-1.5 block text-sm font-medium">Material</label>
          <input id="material" name="material" list="materials" placeholder="M-sand" className={box} required />
          <datalist id="materials">
            <option value="M-sand" />
            <option value="P-sand" />
            <option value="River sand" />
            <option value="20mm jelly" />
            <option value="40mm jelly" />
            <option value="Blue metal" />
            <option value="Gravel" />
          </datalist>
        </div>
        <div>
          <label htmlFor="qty" className="mb-1.5 block text-sm font-medium">Quantity (units)</label>
          <input id="qty" name="qty" type="number" min="1" className={box} required />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="site" className="mb-1.5 block text-sm font-medium">Delivery site</label>
          <input id="site" name="site" defaultValue={me?.address ?? ""} className={box} required />
        </div>
        <div className="sm:col-span-2">
          <button className="bg-signal px-5 py-2.5 font-semibold text-ink hover:bg-signal/85">
            Place order
          </button>
        </div>
      </form>

      <h2 className="mt-10 font-display text-2xl font-semibold">My requests</h2>
      <ul className="mt-3 divide-y divide-ink/10 border-y border-ink/10 bg-white">
        {mine.length === 0 && <li className="px-4 py-6 text-gravel">No requests yet. Place your first order above.</li>}
        {mine.map((r) => {
          const orders = ordersStore.list().filter((o) => o.requestId === r.id);
          return (
            <li key={r.id} className="px-4 py-3">
              <p>
                {r.material} × {r.qty} to {r.site}
                <strong className="ml-2">{r.status}</strong>
              </p>
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