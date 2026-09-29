import { requireRole } from "@/lib/guard";
import { vansStore } from "@/lib/data/vans";
import { requestsStore } from "@/lib/data/requests";
import { ordersStore } from "@/lib/data/orders";
import { expensesStore } from "@/lib/data/expenses";
import { userName } from "@/lib/users";
import { inr } from "@/lib/format";

const Box = ({ label, value }: { label: string; value: string | number }) => (
  <div className="border border-ink/10 bg-white p-4">
    <p className="text-sm text-gravel">{label}</p>
    <p className="font-display text-3xl font-bold">{value}</p>
  </div>
);

export default async function AdminHome() {
  await requireRole(["admin", "super_admin"]);
  const sales = requestsStore.list().filter((r) => r.status !== "Cancelled").reduce((s, r) => s + r.qty * r.sellRate, 0);
  const vendorCost = ordersStore.list().reduce((s, o) => s + o.qty * o.buyRate, 0);
  const spent = expensesStore.list().reduce((s, e) => s + e.amount, 0);

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10 sm:px-10">
      <h1 className="font-display text-4xl font-bold">Overview</h1>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Box label="Sales to customers" value={inr(sales)} />
        <Box label="Paid to vendors" value={inr(vendorCost)} />
        <Box label="Van expenses" value={inr(spent)} />
        <Box label="Profit" value={inr(sales - vendorCost - spent)} />
      </div>

      <h2 className="mt-10 font-display text-2xl font-semibold">Van tracking</h2>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        {vansStore.list().map((van) => {
          const orders = ordersStore.list().filter((o) => o.vanId === van.id);
          const active = orders.filter((o) => o.status !== "Delivered");
          const cost = expensesStore.list().filter((e) => e.vanId === van.id).reduce((s, e) => s + e.amount, 0);
          return (
            <div key={van.id} className="border border-ink/10 bg-white p-4">
              <p className="font-display text-xl font-bold">{van.number}</p>
              <p className="text-sm text-gravel">Driver: {van.driver}</p>
              <p className="mt-2">Loads: {orders.length} ({active.length} running)</p>
              <p>Expenses: {inr(cost)}</p>
              {active.map((o) => (
                <p key={o.id} className="mt-1 text-sm">
                  {o.material} × {o.qty} from {userName(o.vendorId)}: <strong>{o.status}</strong>
                </p>
              ))}
            </div>
          );
        })}
      </div>
    </main>
  );
}
