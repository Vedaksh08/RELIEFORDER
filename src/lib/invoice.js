import { BUSINESS, CONTACT, LOCATION, LEGAL } from '../data/siteData.js'

const inr = (n) =>
  '₹' +
  Number(n || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

const esc = (v) =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

export const invoiceNo = (order) =>
  `RM-${String(order.id).slice(0, 8).toUpperCase()}`

const STATUS_NOTE = {
  placed: 'Awaiting confirmation',
  accepted: 'Confirmed',
  dispatched: 'Out for delivery',
  delivered: 'Delivered',
  rejected: 'Cancelled',
}

/**
 * Builds a print-ready A4 invoice.
 *
 * Rendered as HTML and handed to the browser's own print dialog rather than
 * generated with a PDF library: it keeps the bundle small, the output is
 * selectable text rather than a bitmap, and "Save as PDF" is built into
 * every browser and phone.
 */
export function invoiceHTML(order, customer = {}) {
  const items = order.order_items ?? []
  const subtotal = items.reduce((n, i) => n + Number(i.price) * i.qty, 0)
  const units = items.reduce((n, i) => n + i.qty, 0)
  const placed = new Date(order.created_at)

  const rows = items
    .map(
      (i, idx) => `
      <tr>
        <td class="c">${idx + 1}</td>
        <td>
          <div class="nm">${esc(i.name)}</div>
          ${i.brand ? `<div class="sub">${esc(i.brand)}</div>` : ''}
        </td>
        <td class="c">${i.qty}</td>
        <td class="r">${inr(i.price)}</td>
        <td class="r b">${inr(Number(i.price) * i.qty)}</td>
      </tr>`,
    )
    .join('')

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Invoice ${esc(invoiceNo(order))} — ${esc(BUSINESS.fullName)}</title>
<style>
  @page { size: A4; margin: 12mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
    color: #123040;
    background: #fff;
    font-size: 12px;
    line-height: 1.5;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .sheet { max-width: 190mm; margin: 0 auto; padding: 4mm; }

  /* ---------- brand header ---------- */
  .head {
    display: flex; align-items: flex-start; gap: 14px;
    padding: 16px 18px;
    border-radius: 14px;
    background: linear-gradient(120deg, #2e3192 0%, #0a66d6 62%, #12b981 130%);
    color: #fff;
  }
  .mark {
    width: 52px; height: 52px; flex: 0 0 52px;
    display: grid; place-items: center;
    border-radius: 13px;
    background: #fff;
    font-weight: 800; font-size: 21px; color: #2e3192;
    letter-spacing: -0.5px;
  }
  .biz { flex: 1; min-width: 0; }
  .biz h1 { font-size: 19px; font-weight: 800; letter-spacing: -0.2px; }
  .biz .tag {
    font-size: 10px; text-transform: uppercase; letter-spacing: 2px;
    opacity: 0.85; margin-top: 1px;
  }
  .biz .meta { font-size: 10.5px; opacity: 0.92; margin-top: 6px; line-height: 1.45; }
  .inv { text-align: right; flex: 0 0 auto; }
  .inv .label {
    font-size: 9.5px; text-transform: uppercase; letter-spacing: 1.6px; opacity: 0.85;
  }
  .inv .no { font-size: 15px; font-weight: 800; margin-top: 2px; }
  .inv .date { font-size: 10.5px; opacity: 0.92; margin-top: 4px; }

  /* ---------- parties ---------- */
  .parties { display: flex; gap: 12px; margin-top: 14px; }
  .party {
    flex: 1; min-width: 0;
    border: 1px solid #e3e9ee; border-radius: 12px; padding: 11px 13px;
  }
  .party h2 {
    font-size: 9.5px; text-transform: uppercase; letter-spacing: 1.4px;
    color: #6b7f8b; font-weight: 700; margin-bottom: 5px;
  }
  .party .who { font-size: 13px; font-weight: 700; }
  .party .line { font-size: 11px; color: #4a5b66; margin-top: 2px; }

  .chip {
    display: inline-block; margin-top: 7px;
    padding: 2px 9px; border-radius: 999px;
    font-size: 9.5px; font-weight: 700; letter-spacing: 0.3px;
    background: #eef2ff; color: #2e3192;
  }
  .chip.ok { background: #dcfce7; color: #15803d; }
  .chip.no { background: #fee2e2; color: #b91c1c; }

  /* ---------- items ---------- */
  table { width: 100%; border-collapse: collapse; margin-top: 14px; }
  thead th {
    background: #f4f7f9;
    font-size: 9.5px; text-transform: uppercase; letter-spacing: 1.1px;
    color: #586c78; font-weight: 700; text-align: left;
    padding: 9px 10px;
    border-bottom: 1.5px solid #e3e9ee;
  }
  thead th:first-child { border-radius: 9px 0 0 0; }
  thead th:last-child  { border-radius: 0 9px 0 0; }
  tbody td { padding: 9px 10px; border-bottom: 1px solid #eef2f5; vertical-align: top; }
  tbody tr:last-child td { border-bottom: 0; }
  .nm { font-weight: 600; font-size: 12px; }
  .sub { font-size: 10px; color: #7b8c96; margin-top: 1px; }
  .c { text-align: center; }
  .r { text-align: right; white-space: nowrap; }
  .b { font-weight: 700; }

  /* ---------- totals ---------- */
  .foot { display: flex; gap: 12px; margin-top: 14px; align-items: flex-start; }
  .notes { flex: 1; min-width: 0; }
  .note-box {
    border: 1px solid #e3e9ee; border-radius: 11px; padding: 10px 12px;
    font-size: 10.5px; color: #4a5b66;
  }
  .note-box strong { color: #123040; }
  .totals { flex: 0 0 210px; }
  .trow {
    display: flex; justify-content: space-between; gap: 12px;
    padding: 6px 12px; font-size: 11.5px;
  }
  .grand {
    display: flex; justify-content: space-between; gap: 12px;
    margin-top: 5px; padding: 11px 12px;
    border-radius: 11px;
    background: linear-gradient(120deg, #2e3192, #0a66d6);
    color: #fff;
  }
  .grand .lbl { font-size: 11px; opacity: 0.9; }
  .grand .amt { font-size: 16px; font-weight: 800; }

  .thanks {
    margin-top: 16px; padding-top: 12px;
    border-top: 1px dashed #d6dee4;
    text-align: center; font-size: 10.5px; color: #6b7f8b;
  }
  .thanks .big { font-size: 12px; font-weight: 700; color: #2e3192; margin-bottom: 2px; }

  .bar { height: 4px; border-radius: 99px; margin-top: 14px;
    background: linear-gradient(90deg, #2e3192, #0a66d6 45%, #22c55e); }

  @media print { .noprint { display: none !important; } body { font-size: 11.5px; } }
  .noprint {
    position: fixed; bottom: 16px; left: 50%; transform: translateX(-50%);
    display: flex; gap: 8px; z-index: 10;
  }
  .noprint button {
    border: 0; border-radius: 10px; padding: 11px 20px;
    font-size: 13px; font-weight: 700; cursor: pointer;
    box-shadow: 0 8px 22px rgba(10,60,140,.3);
  }
  .noprint .p { background: #2e3192; color: #fff; }
  .noprint .s { background: #fff; color: #123040; border: 1px solid #d6dee4; }
</style>
</head>
<body>
<div class="sheet">

  <div class="head">
    <div class="mark">RM</div>
    <div class="biz">
      <h1>${esc(BUSINESS.fullName)}</h1>
      <div class="tag">${esc(BUSINESS.tagline)}</div>
      <div class="meta">
        ${esc(LOCATION.lines.join(', '))}<br/>
        ${esc(CONTACT.phone)} &nbsp;·&nbsp; ${esc(CONTACT.email)}
        ${LEGAL?.gstin ? `<br/>GSTIN: ${esc(LEGAL.gstin)}` : ''}
        ${LEGAL?.dlNo ? `${LEGAL?.gstin ? ' &nbsp;·&nbsp; ' : '<br/>'}D.L. No: ${esc(LEGAL.dlNo)}` : ''}
      </div>
    </div>
    <div class="inv">
      <div class="label">Invoice</div>
      <div class="no">${esc(invoiceNo(order))}</div>
      <div class="date">
        ${placed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}<br/>
        ${placed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
      </div>
    </div>
  </div>

  <div class="parties">
    <div class="party">
      <h2>Billed to</h2>
      <div class="who">${esc(customer.full_name ?? customer.email ?? 'Customer')}</div>
      ${order.mobile ? `<div class="line">${esc(order.mobile)}</div>` : ''}
      ${order.address ? `<div class="line">${esc(order.address)}</div>` : ''}
    </div>
    <div class="party">
      <h2>Order details</h2>
      <div class="line"><strong>Status:</strong> ${esc(STATUS_NOTE[order.status] ?? order.status)}</div>
      <div class="line"><strong>Items:</strong> ${items.length} product${items.length === 1 ? '' : 's'} · ${units} unit${units === 1 ? '' : 's'}</div>
      <div class="line"><strong>Payment:</strong> Cash on delivery</div>
      <span class="chip ${order.status === 'delivered' ? 'ok' : order.status === 'rejected' ? 'no' : ''}">
        ${esc(STATUS_NOTE[order.status] ?? order.status)}
      </span>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:34px" class="c">#</th>
        <th>Item</th>
        <th style="width:52px" class="c">Qty</th>
        <th style="width:78px" class="r">Rate</th>
        <th style="width:92px" class="r">Amount</th>
      </tr>
    </thead>
    <tbody>${rows || '<tr><td colspan="5" class="c">No items on this order.</td></tr>'}</tbody>
  </table>

  <div class="foot">
    <div class="notes">
      <div class="note-box">
        ${order.note ? `<div style="margin-bottom:6px"><strong>Note:</strong> ${esc(order.note)}</div>` : ''}
        <strong>Please retain this invoice.</strong> Medicines are non-returnable
        once delivered, except where supplied in error. For any query about this
        order, quote invoice ${esc(invoiceNo(order))}.
      </div>
    </div>
    <div class="totals">
      <div class="trow"><span>Subtotal</span><span>${inr(subtotal)}</span></div>
      <div class="trow"><span>Delivery</span><span>Free</span></div>
      <div class="grand">
        <span class="lbl">Total payable</span>
        <span class="amt">${inr(order.total ?? subtotal)}</span>
      </div>
    </div>
  </div>

  <div class="bar"></div>

  <div class="thanks">
    <div class="big">Thank you for choosing ${esc(BUSINESS.fullName)}</div>
    ${esc(BUSINESS.blurb)}<br/>
    This is a computer-generated invoice and does not require a signature.
  </div>
</div>

<div class="noprint">
  <button class="p" onclick="window.print()">Save as PDF / Print</button>
  <button class="s" onclick="window.close()">Close</button>
</div>

<script>
  // Give the layout a moment to settle, then offer the print dialog. The
  // browser's "Save as PDF" destination is what produces the file.
  window.addEventListener('load', function () { setTimeout(function () { window.print() }, 350) })
</script>
</body>
</html>`
}

/** Opens the invoice in a new tab and triggers the print/save dialog. */
export function downloadInvoice(order, customer) {
  const w = window.open('', '_blank')
  if (!w) {
    alert('Please allow pop-ups for this site to download the invoice.')
    return false
  }
  w.document.write(invoiceHTML(order, customer))
  w.document.close()
  return true
}
