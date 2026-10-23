import { api } from '@/lib/api'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const esc = (v: unknown) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))

const inr = (n: unknown) =>
  '₹' + (Number(n) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function fmtDate(v: unknown) {
  const [y, m, d] = String(v ?? '').slice(0, 10).split('-')
  if (!y || !m || !d) return '-'
  return `${d} ${MONTHS[Number(m) - 1] ?? m} ${y}`
}

function billHtml(b: any) {
  const pay = String(b.payment || '').toLowerCase()
  const stamp =
    pay === 'paid'
      ? '<span class="stamp paid">PAID</span>'
      : pay === 'unpaid'
        ? '<span class="stamp unpaid">UNPAID</span>'
        : ''
  const c = b.customer || {}
  const unit = b.material?.unit && b.material.unit !== 'unit' ? ` ${esc(b.material.unit)}` : ''
  const gst = Number(b.gst_percent) > 0

  return `<!doctype html>
<html><head><meta charset="utf-8"><title>Bill ${esc(b.bill_no)}</title>
<style>
  @page { size: A4; margin: 14mm; }
  * { box-sizing: border-box; }
  body { font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; color: #14181d; margin: 0; font-size: 14px; }
  .head { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #f2b705; padding-bottom: 14px; }
  .head img { height: 64px; }
  .head h1 { margin: 0; font-size: 26px; letter-spacing: .5px; }
  .head p { margin: 2px 0 0; color: #6b7280; }
  .meta { text-align: right; }
  .meta b { font-size: 18px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin: 22px 0; }
  .box h3 { margin: 0 0 6px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; }
  .box p { margin: 2px 0; }
  table { width: 100%; border-collapse: collapse; margin-top: 4px; }
  th { background: #14181d; color: #f2b705; text-align: left; padding: 10px 12px; font-size: 12px; }
  td { padding: 12px; border-bottom: 1px solid #e5e7eb; }
  .r { text-align: right; }
  .totals { margin-left: auto; width: 280px; margin-top: 14px; }
  .totals div { display: flex; justify-content: space-between; padding: 6px 0; }
  .totals .grand { border-top: 2px solid #14181d; margin-top: 6px; padding-top: 10px; font-size: 18px; font-weight: 700; }
  .stamp { display: inline-block; border: 2px solid; padding: 3px 14px; border-radius: 6px; font-weight: 800; letter-spacing: 2px; transform: rotate(-6deg); }
  .stamp.paid { color: #15803d; } .stamp.unpaid { color: #b45309; }
  .notes { margin-top: 22px; padding: 10px 14px; background: #f6f6f4; border-radius: 8px; }
  .foot { margin-top: 36px; text-align: center; color: #6b7280; font-size: 12px; border-top: 1px solid #e5e7eb; padding-top: 12px; }
</style></head>
<body>
  <div class="head">
    <div style="display:flex;align-items:center;gap:14px">
      <img src="${location.origin}/images/a2k-logo.png" alt="">
      <div><h1>A2K Transport</h1><p>Sales bill</p></div>
    </div>
    <div class="meta"><b>Bill #${esc(b.bill_no)}</b><p>${esc(fmtDate(b.date))}</p>${stamp}</div>
  </div>

  <div class="grid">
    <div class="box">
      <h3>Bill to</h3>
      <p><b>${esc(c.name || '-')}</b></p>
      ${c.address ? `<p>${esc(c.address)}</p>` : ''}
      ${c.phone ? `<p>Phone: ${esc(c.phone)}</p>` : ''}
      ${c.gstin ? `<p>GSTIN: ${esc(c.gstin)}</p>` : ''}
    </div>
    <div class="box">
      <h3>Transport</h3>
      <p>Vehicle: <b>${esc(b.vehicle?.plate_number || '-')}</b>${b.vehicle?.type ? ` (${esc(b.vehicle.type)})` : ''}</p>
      <p>Driver: <b>${esc(b.driver?.full_name || '-')}</b></p>
      ${b.driver?.phone ? `<p>Driver phone: ${esc(b.driver.phone)}</p>` : ''}
    </div>
  </div>

  <table>
    <thead><tr><th>Material</th><th class="r">Quantity</th><th class="r">Rate</th><th class="r">Amount</th></tr></thead>
    <tbody><tr>
      <td>${esc(b.material?.name || '-')}</td>
      <td class="r">${esc(b.quantity)}${unit}</td>
      <td class="r">${inr(b.rate)}</td>
      <td class="r">${inr(b.amount)}</td>
    </tr></tbody>
  </table>

  <div class="totals">
    <div><span>Subtotal</span><span>${inr(b.amount)}</span></div>
    ${gst ? `<div><span>GST (${esc(b.gst_percent)}%)</span><span>${inr(b.gst_amount)}</span></div>` : ''}
    <div class="grand"><span>Total</span><span>${inr(b.total_amount)}</span></div>
  </div>

  ${b.notes ? `<div class="notes"><b>Notes:</b> ${esc(b.notes)}</div>` : ''}
  <div class="foot">Thank you for your business.</div>

  <script>window.onload = function () { setTimeout(function () { window.print() }, 250) }</script>
</body></html>`
}

/** Opens the bill in a new tab and starts printing. Call it straight from a click. */
export async function printSale(id: string) {
  // open first, inside the click, so pop-up blockers allow it
  const w = window.open('', '_blank')
  if (!w) throw new Error('Allow pop-ups for this site to print bills')
  w.document.write('<p style="font-family:sans-serif;padding:24px">Preparing bill…</p>')
  try {
    const data = await api<any>(`/sales/${id}/print`)
    w.document.open()
    w.document.write(billHtml(data))
    w.document.close()
  } catch (e) {
    w.close()
    throw e
  }
}