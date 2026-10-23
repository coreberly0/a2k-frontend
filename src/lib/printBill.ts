import { api } from '@/lib/api'

/* ------------------------------------------------------------------ */
/*  Your company details. They are printed on every invoice.           */
/*  Change them here if anything changes (address, bank, GSTIN).       */
/* ------------------------------------------------------------------ */
const COMPANY = {
  name: 'A2K TRANSPORT',
  address: ['No.78 THIRISUL MUTHU BALAKUMARAN NAGAR', 'A PART Kolathur Chennai Tiruvallur', 'Tamil Nadu 600099'],
  gstin: '33ACOFA3138R1ZX',
  state: 'Tamil Nadu',
  stateCode: '33',
  bank: {
    holder: 'A2K TRANSPORT',
    name: 'HDFC BANK - 2501',
    account: '50200121572501',
    branch: 'KOYAMBEDU & HDFC0005555',
  },
}

const STATES: Record<string, string> = {
  '33': 'Tamil Nadu', '29': 'Karnataka', '32': 'Kerala', '37': 'Andhra Pradesh',
  '36': 'Telangana', '27': 'Maharashtra', '07': 'Delhi', '24': 'Gujarat', '19': 'West Bengal',
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const esc = (v: unknown) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))

/** paise (whole number) -> "17,887.00" */
const money = (paise: number) =>
  (paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/** "2026-08-05" -> "5-Aug-26" (same style as Tally) */
function fmtDate(v: unknown) {
  const [y, m, d] = String(v ?? '').slice(0, 10).split('-')
  if (!y || !m || !d) return '-'
  return `${Number(d)}-${MONTHS[Number(m) - 1] ?? m}-${y.slice(2)}`
}

/* ------------------------------ amount in words (Indian style) ------------------------------ */
const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve',
  'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

const below100 = (n: number) => (n < 20 ? ONES[n] : TENS[Math.floor(n / 10)] + (n % 10 ? ' ' + ONES[n % 10] : ''))
const below1000 = (n: number) =>
  [n >= 100 ? ONES[Math.floor(n / 100)] + ' Hundred' : '', n % 100 ? below100(n % 100) : ''].filter(Boolean).join(' ')

function words(n: number): string {
  if (n === 0) return ''
  const parts: string[] = []
  const crore = Math.floor(n / 10000000); n %= 10000000
  const lakh = Math.floor(n / 100000); n %= 100000
  const thousand = Math.floor(n / 1000); n %= 1000
  if (crore) parts.push(words(crore) + ' Crore')
  if (lakh) parts.push(below100(lakh) + ' Lakh')
  if (thousand) parts.push(below100(thousand) + ' Thousand')
  if (n) parts.push(below1000(n))
  return parts.join(' ')
}

/** 1788700 paise -> "INR Seventeen Thousand Eight Hundred Eighty Seven Only" */
export function inrWords(paise: number) {
  const rupees = Math.floor(paise / 100)
  const ps = paise % 100
  let s = words(rupees)
  if (ps) s += (s ? ' and ' : '') + below100(ps) + ' paise'
  return `INR ${s || 'Zero'} Only`
}

/* ------------------------------ invoice maths (all in paise, so no decimal errors) ------------------------------ */
export function calcInvoice(b: any) {
  const amount = Math.round(Number(b.quantity) * Number(b.rate) * 100)
  const pct = Number(b.gst_percent) || 0 // the backend sends 0 when the bill has no GST
  const gstin = String(b.customer?.gstin || '').trim().toUpperCase()
  // customer in another state -> IGST, otherwise CGST + SGST
  const interState = gstin.length >= 2 && gstin.slice(0, 2) !== COMPANY.stateCode

  let cgst = 0, sgst = 0, igst = 0
  if (pct > 0) {
    if (interState) igst = Math.round((amount * pct) / 100)
    else { cgst = Math.round((amount * pct) / 200); sgst = cgst }
  }
  const tax = cgst + sgst + igst
  const exact = amount + tax
  const total = Math.round(exact / 100) * 100 // whole rupees, like Tally
  return { amount, pct, interState, cgst, sgst, igst, tax, total, roundOff: total - exact }
}

/* ------------------------------ the invoice page ------------------------------ */
function partyBlock(title: string, c: any, code: string) {
  return `<div class="cell"><small>${title}</small>
    <b>${esc(c.name || '-')}</b>
    ${c.address ? `<div>${esc(c.address)}</div>` : ''}
    ${c.phone ? `<div>Phone : ${esc(c.phone)}</div>` : ''}
    ${c.gstin ? `<div>GSTIN/UIN : ${esc(c.gstin)}</div>` : ''}
    ${code ? `<div>State Name : ${esc(STATES[code] || '-')}, Code : ${esc(code)}</div>` : ''}
  </div>`
}

export function billHtml(b: any) {
  const c = b.customer || {}
  const k = calcInvoice(b)
  const unit = b.material?.unit && b.material.unit !== 'unit' ? String(b.material.unit) : ''
  const hsn = b.material?.hsn_code ?? b.material?.hsn ?? ''
  const buyerCode = String(c.gstin || '').trim().slice(0, 2)
  const half = +(k.pct / 2).toFixed(2)
  const pay = String(b.payment || '')

  const taxRows = k.interState
    ? `<tr class="tx"><td></td><td class="r">OUTPUT IGST - ${+k.pct.toFixed(2)}%</td><td></td><td></td><td class="r">${k.pct.toFixed(2)}</td><td>%</td><td class="r">${money(k.igst)}</td></tr>`
    : k.pct > 0
      ? `<tr class="tx"><td></td><td class="r">OUTPUT CGST - ${half}%</td><td></td><td></td><td class="r">${half.toFixed(2)}</td><td>%</td><td class="r">${money(k.cgst)}</td></tr>
         <tr class="tx"><td></td><td class="r">OUTPUT SGST - ${half}%</td><td></td><td></td><td class="r">${half.toFixed(2)}</td><td>%</td><td class="r">${money(k.sgst)}</td></tr>`
      : ''

  const roundRow =
    k.roundOff !== 0
      ? `<tr class="tx"><td></td><td class="r">ROUND OFF</td><td></td><td></td><td></td><td></td><td class="r">${k.roundOff < 0 ? '(-)' : ''}${money(Math.abs(k.roundOff))}</td></tr>`
      : ''

  const hsnTax = k.interState
    ? `<th rowspan="2">Taxable<br>Value</th><th colspan="2">IGST</th><th rowspan="2">Total<br>Tax Amount</th></tr><tr><th>Rate</th><th>Amount</th></tr>`
    : `<th rowspan="2">Taxable<br>Value</th><th colspan="2">CGST</th><th colspan="2">SGST/UTGST</th><th rowspan="2">Total<br>Tax Amount</th></tr><tr><th>Rate</th><th>Amount</th><th>Rate</th><th>Amount</th></tr>`

  const hsnRow = k.interState
    ? `<td class="r">${money(k.amount)}</td><td class="r">${k.pct.toFixed(2)}%</td><td class="r">${money(k.igst)}</td><td class="r">${money(k.tax)}</td>`
    : `<td class="r">${money(k.amount)}</td><td class="r">${half.toFixed(2)}%</td><td class="r">${money(k.cgst)}</td><td class="r">${half.toFixed(2)}%</td><td class="r">${money(k.sgst)}</td><td class="r">${money(k.tax)}</td>`

  const hsnTotal = k.interState
    ? `<td class="r">${money(k.amount)}</td><td></td><td class="r">${money(k.igst)}</td><td class="r">${money(k.tax)}</td>`
    : `<td class="r">${money(k.amount)}</td><td></td><td class="r">${money(k.cgst)}</td><td></td><td class="r">${money(k.sgst)}</td><td class="r">${money(k.tax)}</td>`

  return `<!doctype html>
<html><head><meta charset="utf-8"><title>Invoice ${esc(b.bill_no)}</title>
<style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; }
  html, body { margin: 0; }
  body { font-family: Arial, Helvetica, sans-serif; color: #000; font-size: 11.5px; line-height: 1.35; padding: 10mm; }
  .ttl { text-align: center; font-size: 16px; font-weight: 700; margin-bottom: 4px; }
  /* one outer frame draws the left/right/top/bottom border, so nothing is clipped when printing */
  .inv { border: 1px solid #000; }
  .top { display: grid; grid-template-columns: 1.15fr 1fr; border-bottom: 1px solid #000; }
  .top > .l { border-right: 1px solid #000; }
  .cell { padding: 6px 8px; border-bottom: 1px solid #000; }
  .cell:last-child { border-bottom: 0; }
  .cell small { display: block; font-size: 10px; color: #333; margin-bottom: 1px; }
  .cell b { display: block; font-size: 12.5px; }
  .co { display: flex; gap: 10px; align-items: center; }
  .co img { height: 46px; }
  .meta { display: grid; grid-template-columns: 1fr 1fr; }
  .meta .cell { border-right: 1px solid #000; }
  .meta .cell:nth-child(2n) { border-right: 0; }
  .meta .cell:nth-last-child(-n+2) { border-bottom: 0; }
  table { width: 100%; border-collapse: collapse; }
  .items th, .items td { border-left: 1px solid #000; padding: 4px 6px; vertical-align: top; }
  .items th:first-child, .items td:first-child { border-left: 0; }
  .items th { border-bottom: 1px solid #000; text-align: left; font-weight: 700; }
  .items tr.fill td { height: 90px; }
  .items tr.tx td { font-weight: 700; font-style: italic; }
  .items tr.tot td { border-top: 1px solid #000; font-weight: 700; }
  .r, .items th.r { text-align: right; }
  .words { border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 6px 8px; display: flex; justify-content: space-between; }
  .hsn th, .hsn td { border-left: 1px solid #000; border-bottom: 1px solid #000; padding: 3px 6px; text-align: center; }
  .hsn th:first-child, .hsn td:first-child { border-left: 0; }
  .hsn td.r { text-align: right; }
  .hsn tr.sum td { font-weight: 700; }
  .tw { padding: 6px 8px; border-bottom: 1px solid #000; }
  .foot { display: grid; grid-template-columns: 1fr 1fr; }
  .foot > div { padding: 8px; min-height: 110px; }
  .foot > div + div { border-left: 1px solid #000; }
  .sign { text-align: right; margin-top: 34px; }
  .notes { margin-top: 6px; font-size: 10.5px; }
  .cg { text-align: center; margin-top: 6px; font-size: 10.5px; }
</style></head>
<body>
  <div class="ttl">Tax Invoice</div>

  <div class="inv">
  <div class="top">
    <div class="l">
      <div class="cell">
        <div class="co">
          <img src="${location.origin}/images/a2k-logo.png" alt="" onerror="this.remove()">
          <div>
            <b>${esc(COMPANY.name)}</b>
            ${COMPANY.address.map((a) => `<div>${esc(a)}</div>`).join('')}
            <div>GSTIN/UIN: ${esc(COMPANY.gstin)}</div>
            <div>State Name : ${esc(COMPANY.state)}, Code : ${esc(COMPANY.stateCode)}</div>
          </div>
        </div>
      </div>
      ${partyBlock('Consignee (Ship to)', c, buyerCode)}
      ${partyBlock('Buyer (Bill to)', c, buyerCode)}
    </div>

    <div class="meta">
      <div class="cell"><small>Invoice No.</small><b>${esc(b.bill_no)}</b></div>
      <div class="cell"><small>Dated</small><b>${esc(fmtDate(b.date))}</b></div>
      <div class="cell"><small>Dispatched through</small><b>${esc(b.vehicle?.plate_number || '-')}</b></div>
      <div class="cell"><small>Driver</small><b>${esc(b.driver?.full_name || '-')}</b></div>
      <div class="cell"><small>Payment</small><b style="text-transform:capitalize">${esc(pay || '-')}</b></div>
      <div class="cell"><small>Vehicle type</small><b>${esc(b.vehicle?.type || '-')}</b></div>
    </div>
  </div>

  <table class="items">
    <thead><tr>
      <th style="width:34px">Sl No.</th><th>Description of Goods</th><th style="width:70px">HSN/SAC</th>
      <th class="r" style="width:92px">Quantity</th><th class="r" style="width:84px">Rate</th><th style="width:36px">per</th><th class="r" style="width:96px">Amount</th>
    </tr></thead>
    <tbody>
      <tr>
        <td>1</td><td><b>${esc(b.material?.name || '-')}</b></td><td>${esc(hsn)}</td>
        <td class="r"><b>${Number(b.quantity).toFixed(2)}${unit ? ' ' + esc(unit) : ''}</b></td>
        <td class="r">${money(Math.round(Number(b.rate) * 100))}</td><td>${esc(unit)}</td>
        <td class="r"><b>${money(k.amount)}</b></td>
      </tr>
      <tr class="fill"><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>
      ${taxRows}
      ${roundRow}
      <tr class="tot">
        <td></td><td class="r">Total</td><td></td>
        <td class="r">${Number(b.quantity).toFixed(2)}${unit ? ' ' + esc(unit) : ''}</td><td></td><td></td>
        <td class="r">₹ ${money(k.total)}</td>
      </tr>
    </tbody>
  </table>

  <div class="words">
    <div><small>Amount Chargeable (in words)</small><br><b>${esc(inrWords(k.total))}</b></div>
    <div>E. &amp; O.E</div>
  </div>

  ${
    k.pct > 0
      ? `<table class="hsn">
    <thead><tr><th rowspan="2">HSN/SAC</th>${hsnTax}</thead>
    <tbody>
      <tr><td>${esc(hsn)}</td>${hsnRow}</tr>
      <tr class="sum"><td>Total</td>${hsnTotal}</tr>
    </tbody>
  </table>
  <div class="tw">Tax Amount (in words) : <b>${esc(inrWords(k.tax))}</b></div>`
      : ''
  }

  <div class="foot">
    <div>
      <b>Declaration</b>
      <div>We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.</div>
      ${b.notes ? `<div class="notes"><b>Notes:</b> ${esc(b.notes)}</div>` : ''}
    </div>
    <div>
      <b>Company's Bank Details</b>
      <div>A/c Holder's Name : ${esc(COMPANY.bank.holder)}</div>
      <div>Bank Name : ${esc(COMPANY.bank.name)}</div>
      <div>A/c No. : ${esc(COMPANY.bank.account)}</div>
      <div>Branch &amp; IFS Code : ${esc(COMPANY.bank.branch)}</div>
      <div class="sign"><b>for ${esc(COMPANY.name)}</b><br><br>Authorised Signatory</div>
    </div>
  </div>
  </div>
  <div class="cg">This is a Computer Generated Invoice</div>

  <script>window.onload = function () { setTimeout(function () { window.print() }, 400) }</script>
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