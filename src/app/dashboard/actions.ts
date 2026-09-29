"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/guard";
import { MODULES } from "@/lib/modules";
import { logAudit } from "@/lib/data/audit";
import { ordersStore, ORDER_STATUS } from "@/lib/data/orders";
import { usersStore } from "@/lib/users";

export async function saveRecord(fd: FormData) {
  const m = MODULES[String(fd.get("module"))];
  if (!m) return;
  const s = await requireRole(m.roles);
  const id = String(fd.get("id") ?? "");
  const back = `${m.base}/${m.key}`;

  if (id) {
    const existing = m.store.get(id);
    if (!existing || (m.filter && !m.filter(existing))) redirect(back);
  }

  const data: Record<string, unknown> = id ? {} : { ...m.fixed };
  for (const f of m.fields) {
    const raw = String(fd.get(f.name) ?? "").trim();
    if (f.type === "password" && id && !raw) continue; // blank = keep old password
    if (f.type === "password" && !id && !raw) redirect(`${back}/new?error=Password is required`);
    data[f.name] = f.type === "number" ? Number(raw) : f.type === "bool" ? raw === "yes" : raw;
  }

  if (m.unique === "email") {
    data.email = String(data.email).toLowerCase();
    const clash = usersStore.list().some((u) => u.email === data.email && u.id !== id);
    if (clash) redirect(`${back}/${id ? id + "/edit" : "new"}?error=That email is already used`);
  }

  if (id) m.store.update(id, data);
  else m.store.add(data);

  logAudit(s.email, `${id ? "Updated" : "Added"} ${m.single}: ${String(data.name ?? data.number ?? data.material ?? data.type ?? id)}`);
  revalidatePath("/dashboard", "layout");
  redirect(back);
}

export async function removeRecord(fd: FormData) {
  const m = MODULES[String(fd.get("module"))];
  if (!m) return;
  const s = await requireRole(m.roles);
  const id = String(fd.get("id") ?? "");
  const row = m.store.get(id);
  if (!row || (m.filter && !m.filter(row))) return;
  if (m.key === "users" && id === s.id) return; // cannot remove yourself
  m.store.remove(id);
  logAudit(s.email, `Removed ${m.single}: ${String(row.name ?? row.number ?? row.material ?? row.type ?? id)}`);
  revalidatePath("/dashboard", "layout");
}

// Vendor changes status of HIS OWN order only
export async function setOrderStatus(fd: FormData) {
  const s = await requireRole(["vendor"]);
  const status = String(fd.get("status"));
  const o = ordersStore.get(String(fd.get("orderId")));
  if (!o || o.vendorId !== s.id || !(ORDER_STATUS as readonly string[]).includes(status)) return;
  ordersStore.update(o.id, { status });
  logAudit(s.email, `Order ${o.id} → ${status}`);
  revalidatePath("/dashboard", "layout");
}
