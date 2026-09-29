import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/guard";
import { MODULES } from "@/lib/modules";
import { today } from "@/lib/format";
import { saveRecord } from "@/app/dashboard/actions";

const box = "w-full border border-ink/20 bg-white px-3 py-2.5 outline-none focus:border-steel focus:ring-2 focus:ring-steel/30";

export default async function ModuleForm({ moduleKey, id, error }: { moduleKey: string; id?: string; error?: string }) {
  const m = MODULES[moduleKey];
  await requireRole(m.roles);
  const row = id ? m.store.get(id) : undefined;
  if (id && (!row || (m.filter && !m.filter(row)))) notFound();

  return (
    <main className="mx-auto w-full max-w-xl px-6 py-10 sm:px-10">
      <h1 className="font-display text-4xl font-bold">{id ? "Edit" : "Add"} {m.single}</h1>
      {error && <p role="alert" className="mt-4 border-l-4 border-red-600 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}

      <form action={saveRecord} className="mt-6 space-y-4">
        <input type="hidden" name="module" value={m.key} />
        {id && <input type="hidden" name="id" value={id} />}

        {m.fields.map((f) => {
          const v = row?.[f.name];
          return (
            <div key={f.name}>
              <label htmlFor={f.name} className="mb-1.5 block text-sm font-medium">{f.label}</label>
              {f.type === "select" || f.type === "bool" ? (
                <select id={f.name} name={f.name} className={box} required={f.required}
                  defaultValue={f.type === "bool" ? (v === false ? "no" : "yes") : String(v ?? "")}>
                  {f.type === "bool"
                    ? <><option value="yes">Yes</option><option value="no">No</option></>
                    : <>{!v && <option value="">Choose...</option>}{f.options?.().map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</>}
                </select>
              ) : (
                <input id={f.name} name={f.name} className={box}
                  type={f.type === "password" ? "password" : f.type ?? "text"}
                  required={f.required && !(f.type === "password" && id)}
                  placeholder={f.type === "password" && id ? "Leave blank to keep the same" : undefined}
                  defaultValue={f.type === "password" ? "" : String(v ?? (f.type === "date" ? today() : ""))} />
              )}
            </div>
          );
        })}

        <div className="flex gap-3 pt-2">
          <button className="bg-signal px-5 py-2.5 font-semibold text-ink hover:bg-signal/85">Save {m.single}</button>
          <Link href={`${m.base}/${m.key}`} className="border border-ink/20 px-5 py-2.5">Cancel</Link>
        </div>
      </form>
    </main>
  );
}
