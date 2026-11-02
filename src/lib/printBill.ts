import { api } from '@/lib/api'

/* ------------------------------------------------------------------ */
/*  Your company details. They are printed on every invoice.           */
/*  Change them here if anything changes (address, bank, GSTIN).       */
/* ------------------------------------------------------------------ */
const COMPANY = {
  name: 'A2K TRANSPORT',
  address: ['No.78, Thirisul Muthu Balakumaran Nagar', 'A PART Kolathur Chennai Tiruvallur', 'Tamil Nadu 600099'],
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

/** Full unit names, printed under the quantity so "MT" is clear (Metric Ton) */
const UNIT_NAMES: Record<string, string> = { mt: 'Metric Ton', kg: 'Kilogram', ltr: 'Litre', cft: 'Cubic Feet', nos: 'Numbers' }

/** true  = "Amount Chargeable (in words)" shows the base value only (as asked on the printed bill)
 *  false = it shows the full total including GST (the usual Tally way) */
const WORDS_ON_BASE_AMOUNT = true

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
  if (!y || !m || !d) return ''
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

/** 1639143 paise -> "INR Sixteen Thousand Three Hundred Ninety One Rupees and Forty Three Paise Only" (Tally style) */
export function inrWords(paise: number) {
  const rupees = Math.floor(paise / 100)
  const ps = paise % 100
  const r = words(rupees)
  if (!ps) return `INR ${r || 'Zero'} Only`
  return `INR ${r ? r + ' Rupees and ' : ''}${below100(ps)} Paise Only`
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

/* ------------------------------ the invoice page (Tally layout) ------------------------------ */
function partyBlock(title: string, c: any, code: string) {
  return `<div class="cell"><div class="lbl">${title}</div>
    <b>${esc(c.name || '')}</b>
    ${c.address ? `<div>${esc(c.address)}</div>` : ''}
    ${c.phone ? `<div>Phone : ${esc(c.phone)}</div>` : ''}
    ${c.gstin ? `<div>GSTIN/UIN : ${esc(c.gstin)}</div>` : ''}
    ${code ? `<div>State Name : ${esc(STATES[code] || '-')}, Code : ${esc(code)}</div>` : ''}
  </div>`
}

const metaCell = (label: string, value: unknown = '', cls = '') =>
  `<div class="m ${cls}"><div class="lbl">${label}</div><b>${esc(value)}</b></div>`

export function billHtml(b: any, autoPrint = true) {
  const c = b.customer || {}
  const k = calcInvoice(b)
  const unit = b.material?.unit && b.material.unit !== 'unit' ? String(b.material.unit) : ''
  const hsn = String(b.material?.hsn_code ?? b.material?.hsn ?? '')
  const unitName = UNIT_NAMES[unit.toLowerCase()] || ''
  // customer ledger (the backend sends these on /sales/:id/print); the block is hidden if they are missing
  const hasLedger = b.opening_balance != null
  const opening = Math.round(Number(b.opening_balance || 0) * 100)
  const closing = b.closing_balance != null ? Math.round(Number(b.closing_balance) * 100) : opening + k.total
  const buyerCode = String(c.gstin || '').trim().slice(0, 2)
  const half = +(k.pct / 2).toFixed(2)
  const pay = String(b.payment || '')
  const qty = Number(b.quantity).toFixed(2)

  const taxRow = (label: string, pct: number, amt: number) =>
    `<tr class="tx"><td></td><td class="r">${label}</td><td></td><td></td><td class="r">${pct.toFixed(2)}</td><td>%</td><td class="r">${money(amt)}</td></tr>`

  const taxRows = k.interState
    ? taxRow(`OUTPUT IGST - ${+k.pct.toFixed(2)}%`, k.pct, k.igst)
    : k.pct > 0
      ? taxRow(`OUTPUT CGST - ${half}%`, half, k.cgst) + taxRow(`OUTPUT SGST - ${half}%`, half, k.sgst)
      : ''

  // Tally always prints the ROUND OFF line, even when it is 0.00
  const roundRow = `<tr class="tx"><td></td><td class="r">ROUND OFF</td><td></td><td></td><td></td><td></td><td class="r">${k.roundOff < 0 ? '(-)' : ''}${money(Math.abs(k.roundOff))}</td></tr>`

  const hsnCols = k.interState
    ? [18, 24, 14, 22, 22]
    : [14, 18, 10, 16, 10, 16, 16]
  const hsnColgroup = `<colgroup>${hsnCols.map((w) => `<col style="width:${w}%">`).join('')}</colgroup>`

  const hsnHead = k.interState
    ? `<tr><th class="f" rowspan="2">HSN/SAC</th><th rowspan="2">Taxable<br>Value</th><th colspan="2">IGST</th><th rowspan="2">Total<br>Tax Amount</th></tr>
       <tr><th>Rate</th><th>Amount</th></tr>`
    : `<tr><th class="f" rowspan="2">HSN/SAC</th><th rowspan="2">Taxable<br>Value</th><th colspan="2">CGST</th><th colspan="2">SGST/UTGST</th><th rowspan="2">Total<br>Tax Amount</th></tr>
       <tr><th>Rate</th><th>Amount</th><th>Rate</th><th>Amount</th></tr>`

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
  body { font-family: Arial, Helvetica, sans-serif; color: #000; font-size: 11px; line-height: 1.35; padding: 10mm; }
  .ttl { text-align: center; font-size: 15px; font-weight: 700; padding: 4px 0; border-bottom: 1px solid #000; }
  .inv { border: 1px solid #000; }
  .lbl { font-size: 9.5px; color: #222; }
  b { font-weight: 700; }

  /* ---------- header: company / consignee / buyer on the left, reference cells on the right ---------- */
  .top { display: grid; grid-template-columns: 1.1fr 1fr; border-bottom: 1px solid #000; }
  .top > .l { border-right: 1px solid #000; }
  .cell { padding: 5px 7px; border-bottom: 1px solid #000; }
  .cell:last-child { border-bottom: 0; }
  .cell b { display: block; font-size: 12px; }
  .co { display: flex; gap: 10px; align-items: center; }
  .co img { height: 46px; }

  .meta { display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: repeat(5, auto) 1fr; }
  .m { padding: 4px 7px; min-height: 36px; border-bottom: 1px solid #000; }
  .m:nth-child(odd) { border-right: 1px solid #000; }
  .m b { display: block; font-size: 11.5px; }
  .m.full { grid-column: 1 / 3; border-right: 0; border-bottom: 0; }

  /* ---------- items: vertical lines run the full height, like Tally ---------- */
  table { width: 100%; border-collapse: collapse; }
  .items th, .items td { border-left: 1px solid #000; padding: 3px 6px; vertical-align: top; }
  .items th:first-child, .items td:first-child { border-left: 0; }
  .items thead th { border-bottom: 1px solid #000; text-align: left; font-weight: 400; }
  .items td.sp { height: 26px; }
  .items tr.fill td { height: 120px; }
  .items tr.tx td { font-weight: 700; font-style: italic; padding-top: 1px; padding-bottom: 1px; }
  .items tr.tot td { border-top: 1px solid #000; border-bottom: 1px solid #000; font-weight: 700; }
  .r, .items th.r { text-align: right; }
  .un { font-size: 9px; font-weight: 400; color: #333; }

  .words { padding: 4px 7px; display: flex; justify-content: space-between; border-bottom: 1px solid #000; }
  .hsn { table-layout: fixed; }
  .hsn th, .hsn td { border-left: 1px solid #000; border-bottom: 1px solid #000; padding: 2px 5px; text-align: center; vertical-align: middle; }
  .hsn .f { border-left: 0; text-align: left; }
  .hsn th { font-weight: 400; }
  .hsn td.r { text-align: right; }
  .hsn tr.sum td { font-weight: 700; text-align: right; }
  .tw { padding: 4px 7px; border-bottom: 1px solid #000; }

  /* ---------- footer: declaration | bank details + signature ---------- */
  .foot { display: grid; grid-template-columns: 1fr 1fr; }
  .foot > .decl { padding: 6px 7px; min-height: 110px; }
  .foot > .right { border-left: 1px solid #000; display: flex; flex-direction: column; }
  .bank { padding: 6px 7px; }
  .bank .t { text-decoration: underline; font-weight: 700; margin-bottom: 3px; }
  .bk { width: auto; }
  .bk td { padding: 1px 0; vertical-align: top; white-space: nowrap; }
  .bk td:first-child { padding-right: 14px; }
  .bk td.c { padding-right: 8px; }
  .sig { margin-top: auto; border-top: 1px solid #000; padding: 4px 7px 4px; text-align: right; min-height: 62px; display: flex; flex-direction: column; justify-content: space-between; }
  .notes { margin-top: 6px; font-size: 10px; }

  .ledger { margin-top: 8px; font-size: 11px; }
  .ledger td { border: 1px solid #000; padding: 4px 8px; }
  .ledger td.r { text-align: right; font-weight: 700; }
  .cg { text-align: center; margin-top: 5px; font-size: 10px; }
</style></head>
<body>
  <div class="inv">
  <div class="ttl">TAX INVOICE</div>
  <div class="top">
    <div class="l">
      <div class="cell">
        <div class="co">
          <img src="${location.origin}/images/a2k-logo.png" alt="" onerror="this.remove()">
          <div>
            <b>${esc(COMPANY.name)}</b>
            ${COMPANY.address.map((a) => `<div>${esc(a)}</div>`).join('')}
            <div>GSTIN/UIN : ${esc(COMPANY.gstin)}</div>
            <div>State Name : ${esc(COMPANY.state)}, Code : ${esc(COMPANY.stateCode)}</div>
          </div>
        </div>
      </div>
      ${partyBlock('Consignee (Ship to)', c, buyerCode)}
      ${partyBlock('Buyer (Bill to)', c, buyerCode)}
    </div>

    <div class="meta">
      ${metaCell('Invoice No.', b.bill_no)}
      ${metaCell('Dated', fmtDate(b.date))}
      ${metaCell('Delivery Note', b.delivery_note)}
      ${metaCell('Mode/Terms of Payment', pay ? pay.charAt(0).toUpperCase() + pay.slice(1) : '')}
      ${metaCell('Reference No. & Date.', b.reference)}
      ${metaCell('Other References', b.driver?.full_name ? 'Driver: ' + b.driver.full_name : '')}
      ${metaCell("Buyer's Order No.", b.order_no)}
      ${metaCell('Dated', b.order_date ? fmtDate(b.order_date) : '')}
      ${metaCell('Dispatch Doc No.', b.dispatch_doc)}
      ${metaCell('Delivery Note Date', b.delivery_note_date ? fmtDate(b.delivery_note_date) : '')}
      ${metaCell('Dispatched through', b.vehicle?.plate_number)}
      ${metaCell('Destination', b.destination)}
      ${metaCell('Terms of Delivery', b.terms_of_delivery, 'full')}
    </div>
  </div>

  <table class="items">
    <thead><tr>
      <th style="width:34px">Sl<br>No.</th><th style="text-align:center">Description of Goods</th><th style="width:62px">HSN/SAC</th>
      <th class="r" style="width:92px">Quantity</th><th class="r" style="width:80px">Rate</th><th style="width:34px">per</th><th class="r" style="width:96px">Amount</th>
    </tr></thead>
    <tbody>
      <tr>
        <td>1</td><td><b>${esc(b.material?.name || '')}</b></td><td>${esc(hsn)}</td>
        <td class="r"><b>${qty}${unit ? ' ' + esc(unit) : ''}</b>${unitName ? `<div class="un">${esc(unitName)}</div>` : ''}</td>
        <td class="r">${money(Math.round(Number(b.rate) * 100))}</td><td>${esc(unit)}</td>
        <td class="r"><b>${money(k.amount)}</b></td>
      </tr>
      <tr><td class="sp"></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>
      ${taxRows}
      ${roundRow}
      <tr class="fill"><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>
      <tr class="tot">
        <td></td><td class="r">Total</td><td></td>
        <td class="r">${qty}${unit ? ' ' + esc(unit) : ''}</td><td></td><td></td>
        <td class="r">₹ ${money(k.total)}</td>
      </tr>
    </tbody>
  </table>

  <div class="words">
    <div><span class="lbl">Amount Chargeable (in words)${WORDS_ON_BASE_AMOUNT && k.tax > 0 ? ' - base value' : ''}</span><br><b>${esc(inrWords(WORDS_ON_BASE_AMOUNT ? k.amount : k.total))}</b></div>
    <div style="text-align:right"><i>E. &amp; O.E</i></div>
  </div>

  ${
    k.pct > 0
      ? `<table class="hsn">
    ${hsnColgroup}
    <thead>${hsnHead}</thead>
    <tbody>
      <tr><td class="f">${esc(hsn)}</td>${hsnRow}</tr>
      <tr class="sum"><td class="f" style="text-align:right">Total</td>${hsnTotal}</tr>
    </tbody>
  </table>
  <div class="tw">Tax Amount (in words) : <b>${esc(inrWords(k.tax))}</b></div>`
      : ''
  }

  <div class="foot">
    <div class="decl">
      <u>Declaration</u>
      <div>We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.</div>
      ${b.notes ? `<div class="notes"><b>Notes:</b> ${esc(b.notes)}</div>` : ''}
    </div>
    <div class="right">
      <div class="bank">
        <div class="t">Company's Bank Details</div>
        <table class="bk">
          <tr><td>Bank Name</td><td class="c">:</td><td><b>${esc(COMPANY.bank.name)}</b></td></tr>
          <tr><td>A/c No</td><td class="c">:</td><td><b>${esc(COMPANY.bank.account)}</b></td></tr>
          <tr><td>Branch &amp; IFS Code</td><td class="c">:</td><td><b>${esc(COMPANY.bank.branch)}</b></td></tr>
        </table>
      </div>
      <div class="sig"><b>for ${esc(COMPANY.name)}</b><span>Authorised Signatory</span></div>
    </div>
  </div>
  </div>
  <div class="cg">This is a Computer Generated Invoice</div>
  ${
    hasLedger
      ? `<table class="ledger"><tr>
      <td>Customer ledger</td>
      <td>Opening balance</td><td class="r">₹ ${money(opening)}</td>
      <td>This invoice</td><td class="r">₹ ${money(k.total)}</td>
      <td>Closing balance</td><td class="r">₹ ${money(closing)}</td>
    </tr></table>`
      : ''
  }

  ${autoPrint ? '<script>window.onload = function () { setTimeout(function () { window.print() }, 400) }</script>' : ''}
</body></html>`
}

/* ------------------------------ printing: no blank tab, a loading card on the same page ------------------------------ */

/** Shows a centred "loading" card over the page. Returns a function that removes it. */
function showLoader(text: string) {
  const el = document.createElement('div')
  el.setAttribute('role', 'status')
  el.style.cssText =
    'position:fixed;inset:0;z-index:99999;display:grid;place-items:center;background:rgba(17,17,17,.55);backdrop-filter:blur(2px)'
  el.innerHTML = `<style>@keyframes a2kspin{to{transform:rotate(360deg)}}</style>
    <div style="background:#fff;border-radius:16px;padding:22px 30px;display:flex;align-items:center;gap:14px;font:600 15px Arial,Helvetica,sans-serif;color:#111;box-shadow:0 20px 50px rgba(0,0,0,.3)">
      <span style="width:22px;height:22px;border:3px solid #e5e5e5;border-top-color:#facc15;border-radius:50%;animation:a2kspin .8s linear infinite"></span>${text}
    </div>`
  document.body.appendChild(el)
  return () => el.remove()
}

/** Loads the bill into a hidden frame and opens the print dialog. `onReady` runs just before the dialog opens. */
function printInFrame(html: string, onReady: () => void) {
  return new Promise<void>((resolve, reject) => {
    const f = document.createElement('iframe')
    f.setAttribute('aria-hidden', 'true')
    f.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0'
    const remove = () => setTimeout(() => f.remove(), 500)
    f.onload = () => {
      try {
        const w = f.contentWindow!
        w.onafterprint = remove
        onReady() // hide the loading card first, the print dialog blocks the page
        setTimeout(() => {
          w.focus()
          w.print()
          resolve()
        }, 150)
        setTimeout(() => f.remove(), 5 * 60 * 1000) // safety clean-up
      } catch (e) {
        f.remove()
        reject(e)
      }
    }
    f.srcdoc = html
    document.body.appendChild(f)
  })
}

/** Click "Print": shows a loading card, then opens the print dialog. No new tab, no pop-up blocker. */
export async function printSale(id: string) {
  const hide = showLoader('Preparing bill…')
  try {
    const data = await api<any>(`/sales/${id}/print`)
    await printInFrame(billHtml(data, false), hide)
  } finally {
    hide() // safe to call twice; also covers errors
  }
}