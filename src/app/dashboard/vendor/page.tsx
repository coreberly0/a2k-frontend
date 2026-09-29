import { requireRole } from "@/lib/guard";
import { ordersStore, ORDER_STATUS } from "@/lib/data/orders";
import { requestsStore } from "@/lib/data/requests";
import { vanNumber } from "@/lib/data/vans";
import { setOrderStatus } from "../actions";

export default async function VendorHome() {
  const s = await requireRole(["vendor"]);
  const mine = ordersStore.list().filter((o) => o.vendorId === s.id); // only this vendor

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10 sm:px-10">
      <h1 className="font-display text-4xl font-bold">My orders</h1>
      <ul className="mt-6 divide-y divide-ink/10 border-y border-ink/10 bg-white">
        {mine.length === 0 && <li className="px-4 py-6 text-gravel">No orders yet.</li>}
        {mine.map((o) => (
          <li key={o.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <span>
              {o.material} × {o.qty} · Van {vanNumber(o.vanId)}
              <span className="block text-sm text-gravel">Deliver to: {requestsStore.get(o.requestId)?.site ?? "-"}</span>
            </span>
            <form action={setOrderStatus} className="flex items-center gap-2">
              <input type="hidden" name="orderId" value={o.id} />
              <select name="status" defaultValue={o.status} className="border border-ink/20 bg-white px-2 py-1.5">
                {ORDER_STATUS.map((x) => <option key={x}>{x}</option>)}
              </select>
              <button className="bg-steel px-3 py-1.5 text-sm text-white">Update</button>
            </form>
          </li>
        ))}
      </ul>
    </main>
  );
}
