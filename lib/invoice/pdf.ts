/**
 * lib/invoice/pdf.ts
 *
 * Generates a professional GST Tax Invoice PDF for Southern Suites.
 * Uses @sparticuz/chromium + puppeteer-core for server-side HTML → PDF.
 *
 * Falls back to a plain HTML buffer if Chromium is unavailable
 * (useful in local dev without the binary).
 *
 * Install:
 *   npm install puppeteer-core @sparticuz/chromium-min
 *   # or for Vercel/Lambda:
 *   npm install @sparticuz/chromium puppeteer-core
 *
 * Usage:
 *   const buffer = await generateInvoicePDF(invoiceData);
 *   // In a Next.js route handler:
 *   return new Response(buffer, {
 *     headers: {
 *       "Content-Type": "application/pdf",
 *       "Content-Disposition": `attachment; filename="invoice-${ref}.pdf"`,
 *     },
 *   });
 */

import type { InvoiceData } from "./gst";
import { formatCurrencyINR } from "./gst";

// ─── Colours (match brand) ────────────────────────────────────────────────────

const NAVY = "#1B2A4A";
const GOLD = "#C9A84C";
const LIGHT_BG = "#F8F5EE";
const BORDER = "#EEE8DC";

// ─── HTML Template ────────────────────────────────────────────────────────────

function buildInvoiceHTML(inv: InvoiceData): string {
  const gst = inv.gstBreakdown;

  const lineItemsHTML = inv.lineItems
    .map(
      (item, i) => `
      <tr class="${i % 2 === 0 ? "row-even" : "row-odd"}">
        <td class="td-left">${item.description}</td>
        <td class="td-center">${item.hsn}</td>
        <td class="td-center">${item.quantity}</td>
        <td class="td-right">${formatCurrencyINR(item.unitPrice)}</td>
        <td class="td-right">${formatCurrencyINR(item.amount)}</td>
      </tr>`
    )
    .join("");

  const guestGSTRow = inv.guest.gstNumber
    ? `<p class="meta-line"><span class="meta-label">GSTIN</span><span>${inv.guest.gstNumber}</span></p>`
    : "";

  const guestCompanyRow = inv.guest.companyName
    ? `<p class="meta-line"><span class="meta-label">Company</span><span>${inv.guest.companyName}</span></p>`
    : "";

  const paymentRefRow = inv.paymentReference
    ? `<tr><td class="summary-label">Payment Ref.</td><td class="summary-value">${inv.paymentReference}</td></tr>`
    : "";

  const notesSection = inv.notes
    ? `<div class="notes-box">
         <p class="section-title">Notes / Special Requests</p>
         <p class="notes-text">${inv.notes}</p>
       </div>`
    : "";

  const hotelPANRow = inv.hotel.panNumber
    ? `<span class="sub-text">PAN: ${inv.hotel.panNumber}</span>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Tax Invoice – ${inv.invoiceNumber}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Inter', Arial, sans-serif;
      font-size: 11px;
      color: #1F2937;
      background: #fff;
      padding: 0;
    }

    .page {
      width: 794px;
      min-height: 1123px;
      margin: 0 auto;
      padding: 40px 48px;
      position: relative;
    }

    /* ── Header ── */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 24px;
      border-bottom: 2px solid ${GOLD};
      margin-bottom: 24px;
    }
    .hotel-brand {}
    .brand-sub {
      font-size: 9px;
      letter-spacing: 2.5px;
      color: ${GOLD};
      text-transform: uppercase;
      font-weight: 600;
      margin-bottom: 4px;
    }
    .brand-name {
      font-size: 22px;
      font-weight: 700;
      color: ${NAVY};
      letter-spacing: 0.5px;
      font-family: Georgia, serif;
    }
    .brand-contact {
      font-size: 10px;
      color: #6B7280;
      margin-top: 6px;
      line-height: 1.6;
    }
    .invoice-meta {
      text-align: right;
    }
    .invoice-badge {
      display: inline-block;
      background: ${NAVY};
      color: #fff;
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 2px;
      text-transform: uppercase;
      padding: 4px 12px;
      border-radius: 2px;
      margin-bottom: 10px;
    }
    .invoice-number {
      font-size: 16px;
      font-weight: 700;
      color: ${NAVY};
      margin-bottom: 4px;
    }
    .invoice-date {
      font-size: 10px;
      color: #6B7280;
    }

    /* ── Hotel GST Info ── */
    .hotel-gst-bar {
      background: ${LIGHT_BG};
      border: 1px solid ${BORDER};
      border-radius: 4px;
      padding: 10px 16px;
      margin-bottom: 20px;
      display: flex;
      gap: 32px;
      font-size: 10px;
      color: #4B5563;
    }
    .hotel-gst-bar span { font-weight: 600; color: ${NAVY}; }

    /* ── Party Grid ── */
    .party-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 24px;
    }
    .party-box {
      border: 1px solid ${BORDER};
      border-radius: 4px;
      padding: 14px 16px;
    }
    .party-box.billed-to { border-left: 3px solid ${GOLD}; }
    .party-box.hotel-box { border-left: 3px solid ${NAVY}; }
    .party-label {
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: #9CA3AF;
      margin-bottom: 8px;
    }
    .party-name {
      font-size: 13px;
      font-weight: 700;
      color: ${NAVY};
      margin-bottom: 4px;
    }
    .meta-line {
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      color: #4B5563;
      margin-top: 3px;
      line-height: 1.5;
    }
    .meta-label {
      color: #9CA3AF;
      font-weight: 600;
      font-size: 9px;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      margin-right: 8px;
      flex-shrink: 0;
    }

    /* ── Booking Reference Banner ── */
    .ref-banner {
      background: ${NAVY};
      color: #fff;
      border-radius: 4px;
      padding: 10px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      font-size: 10px;
    }
    .ref-banner-label { color: #8FA3C3; letter-spacing: 1px; font-weight: 600; }
    .ref-banner-value { color: ${GOLD}; font-size: 14px; font-weight: 700; letter-spacing: 1.5px; }

    /* ── Line Items Table ── */
    .section-title {
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: #9CA3AF;
      margin-bottom: 8px;
    }
    table.items {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    .items thead th {
      background: ${NAVY};
      color: #fff;
      font-size: 9px;
      font-weight: 600;
      letter-spacing: 1px;
      text-transform: uppercase;
      padding: 9px 10px;
    }
    .td-left { text-align: left; padding: 10px; font-size: 10px; line-height: 1.5; }
    .td-center { text-align: center; padding: 10px; font-size: 10px; }
    .td-right { text-align: right; padding: 10px; font-size: 10px; }
    .row-even { background: #fff; }
    .row-odd { background: ${LIGHT_BG}; }

    /* ── Totals Block ── */
    .totals-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 24px;
      align-items: start;
    }

    /* GST split table */
    table.gst-split {
      width: 100%;
      border-collapse: collapse;
      font-size: 10px;
    }
    .gst-split th {
      background: ${LIGHT_BG};
      padding: 7px 10px;
      font-size: 9px;
      font-weight: 600;
      color: #6B7280;
      letter-spacing: 0.5px;
      border: 1px solid ${BORDER};
    }
    .gst-split td {
      padding: 7px 10px;
      border: 1px solid ${BORDER};
      text-align: center;
    }

    /* Summary column */
    table.summary {
      width: 100%;
      border-collapse: collapse;
    }
    .summary-label {
      font-size: 10px;
      color: #6B7280;
      padding: 7px 0;
      border-bottom: 1px solid ${BORDER};
    }
    .summary-value {
      font-size: 10px;
      font-weight: 600;
      color: ${NAVY};
      padding: 7px 0;
      border-bottom: 1px solid ${BORDER};
      text-align: right;
    }
    .summary-total-row td {
      background: ${NAVY};
      color: ${GOLD};
      font-size: 13px;
      font-weight: 700;
      padding: 10px 12px;
      border-radius: 3px;
    }
    .summary-total-row td:first-child { border-radius: 3px 0 0 3px; }
    .summary-total-row td:last-child { border-radius: 0 3px 3px 0; text-align: right; }

    /* ── Notes ── */
    .notes-box {
      background: ${LIGHT_BG};
      border: 1px solid ${BORDER};
      border-radius: 4px;
      padding: 12px 16px;
      margin-bottom: 20px;
    }
    .notes-text { font-size: 10px; color: #4B5563; line-height: 1.6; margin-top: 6px; }

    /* ── Footer ── */
    .footer {
      border-top: 1px solid ${BORDER};
      padding-top: 16px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: auto;
    }
    .footer-note {
      font-size: 9px;
      color: #9CA3AF;
      line-height: 1.6;
    }
    .footer-stamp {
      text-align: right;
    }
    .footer-stamp-label {
      font-size: 9px;
      color: #9CA3AF;
      margin-bottom: 32px;
    }
    .footer-stamp-name {
      font-size: 10px;
      font-weight: 700;
      color: ${NAVY};
      border-top: 1px solid ${NAVY};
      padding-top: 4px;
    }
    .sub-text { font-size: 9px; color: #9CA3AF; }
  </style>
</head>
<body>
<div class="page">

  <!-- Header -->
  <div class="header">
    <div class="hotel-brand">
      <p class="brand-sub">Luxury Hospitality</p>
      <p class="brand-name">Southern Suites</p>
      <p class="brand-contact">
        ${inv.hotel.address}<br/>
        ${inv.hotel.phone} &nbsp;·&nbsp; ${inv.hotel.email}
      </p>
    </div>
    <div class="invoice-meta">
      <div class="invoice-badge">Tax Invoice</div>
      <p class="invoice-number">${inv.invoiceNumber}</p>
      <p class="invoice-date">Date: ${inv.invoiceDate}</p>
    </div>
  </div>

  <!-- Hotel GST Info Bar -->
  <div class="hotel-gst-bar">
    <div>GSTIN &nbsp;<span>${inv.hotel.gstNumber}</span></div>
    <div>SAC Code &nbsp;<span>${inv.hotel.sacCode}</span></div>
    ${inv.hotel.panNumber ? `<div>PAN &nbsp;<span>${inv.hotel.panNumber}</span></div>` : ""}
    <div>State &nbsp;<span>Andhra Pradesh (37)</span></div>
  </div>

  <!-- Booking Reference -->
  <div class="ref-banner">
    <span class="ref-banner-label">Booking Reference</span>
    <span class="ref-banner-value">${inv.bookingReference}</span>
  </div>

  <!-- Billed To / Hotel Details -->
  <div class="party-grid">
    <div class="party-box billed-to">
      <p class="party-label">Billed To</p>
      <p class="party-name">${inv.guest.name}</p>
      ${guestCompanyRow}
      ${inv.guest.address ? `<p class="meta-line"><span class="meta-label">Address</span><span>${inv.guest.address}</span></p>` : ""}
      <p class="meta-line"><span class="meta-label">Phone</span><span>${inv.guest.phone}</span></p>
      ${inv.guest.email ? `<p class="meta-line"><span class="meta-label">Email</span><span>${inv.guest.email}</span></p>` : ""}
      ${guestGSTRow}
    </div>
    <div class="party-box hotel-box">
      <p class="party-label">Supplied By</p>
      <p class="party-name">${inv.hotel.name}</p>
      <p class="meta-line"><span class="meta-label">Address</span><span>${inv.hotel.address}</span></p>
      <p class="meta-line"><span class="meta-label">GSTIN</span><span>${inv.hotel.gstNumber}</span></p>
      ${inv.hotel.panNumber ? `<p class="meta-line"><span class="meta-label">PAN</span><span>${inv.hotel.panNumber}</span></p>` : ""}
    </div>
  </div>

  <!-- Line Items -->
  <p class="section-title">Services Rendered</p>
  <table class="items">
    <thead>
      <tr>
        <th class="td-left" style="width:45%">Description</th>
        <th class="td-center" style="width:12%">HSN/SAC</th>
        <th class="td-center" style="width:10%">Qty (Nights)</th>
        <th class="td-right" style="width:15%">Unit Rate</th>
        <th class="td-right" style="width:18%">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${lineItemsHTML}
    </tbody>
  </table>

  <!-- Totals: GST Split + Summary -->
  <div class="totals-grid">
    <!-- GST Breakdown Table -->
    <div>
      <p class="section-title">GST Breakdown</p>
      <table class="gst-split">
        <thead>
          <tr>
            <th>Taxable Value</th>
            <th>CGST (${gst.cgstRate}%)</th>
            <th>SGST (${gst.sgstRate}%)</th>
            <th>Total GST</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${gst.formatted.baseAmount}</td>
            <td>${gst.formatted.cgstAmount}</td>
            <td>${gst.formatted.sgstAmount}</td>
            <td><strong>${gst.formatted.gstAmount}</strong></td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Summary -->
    <div>
      <table class="summary">
        <tr>
          <td class="summary-label">Taxable Amount</td>
          <td class="summary-value">${gst.formatted.baseAmount}</td>
        </tr>
        <tr>
          <td class="summary-label">CGST @ ${gst.cgstRate}%</td>
          <td class="summary-value">${gst.formatted.cgstAmount}</td>
        </tr>
        <tr>
          <td class="summary-label">SGST @ ${gst.sgstRate}%</td>
          <td class="summary-value">${gst.formatted.sgstAmount}</td>
        </tr>
        <tr>
          <td class="summary-label">Payment Method</td>
          <td class="summary-value">${inv.paymentMethod}</td>
        </tr>
        ${paymentRefRow}
        <tr class="summary-total-row">
          <td>TOTAL AMOUNT</td>
          <td>${gst.formatted.totalAmount}</td>
        </tr>
      </table>
    </div>
  </div>

  ${notesSection}

  <!-- Footer -->
  <div class="footer">
    <div class="footer-note">
      This is a computer-generated invoice and does not require a physical signature.<br/>
      GSTIN: ${inv.hotel.gstNumber} &nbsp;·&nbsp; SAC: ${inv.hotel.sacCode}<br/>
      © ${new Date().getFullYear()} Southern Suites Hospitality Pvt. Ltd.
    </div>
    <div class="footer-stamp">
      <p class="footer-stamp-label">For ${inv.hotel.name}</p>
      <p class="footer-stamp-name">Authorised Signatory</p>
    </div>
  </div>

</div>
</body>
</html>`;
}

// ─── PDF Generation ───────────────────────────────────────────────────────────

/**
 * Generate a PDF invoice buffer from an InvoiceData object.
 *
 * Uses puppeteer-core + @sparticuz/chromium (works on Vercel / AWS Lambda).
 * Falls back to returning the raw HTML as a Buffer if Chromium is unavailable
 * (set env INVOICE_PDF_FALLBACK_HTML=true to force HTML mode in dev).
 *
 * @param invoiceData  Built by formatInvoiceData() from lib/invoice/gst.ts
 * @returns            Buffer containing the PDF (or HTML in fallback mode)
 */
export async function generateInvoicePDF(
  invoiceData: InvoiceData
): Promise<{ buffer: Buffer; contentType: "application/pdf" | "text/html" }> {
  const html = buildInvoiceHTML(invoiceData);

  // ── HTML fallback (local dev without Chromium) ──
  if (process.env.INVOICE_PDF_FALLBACK_HTML === "true") {
    return { buffer: Buffer.from(html, "utf-8"), contentType: "text/html" };
  }

  // ── Puppeteer + Chromium ──
  try {
    let executablePath: string;
    let args: string[];

    if (process.env.AWS_EXECUTION_ENV || process.env.VERCEL) {
      // Serverless environment — use @sparticuz/chromium
      const chromium = await import("@sparticuz/chromium").then(
        (m) => m.default ?? m
      );
      executablePath = await chromium.executablePath();
      args = chromium.args;
    } else {
      // Local dev — use system Chromium or puppeteer's bundled binary
      const puppeteerFull = await import("puppeteer").catch(() => null);
      if (puppeteerFull) {
        const browser = await puppeteerFull.default.launch({ headless: true });
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: "networkidle0" });
        const pdf = await page.pdf({
          format: "A4",
          printBackground: true,
          margin: { top: "0", right: "0", bottom: "0", left: "0" },
        });
        await browser.close();
        return { buffer: Buffer.from(pdf), contentType: "application/pdf" };
      }
      // Last resort — fall back to HTML
      console.warn("[Invoice] puppeteer not found; falling back to HTML");
      return { buffer: Buffer.from(html, "utf-8"), contentType: "text/html" };
    }

    const puppeteer = await import("puppeteer-core").then((m) => m.default ?? m);
    const browser = await puppeteer.launch({
      args,
      executablePath,
      headless: true,
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });
    await browser.close();

    return { buffer: Buffer.from(pdf), contentType: "application/pdf" };
  } catch (err) {
    console.error("[Invoice] PDF generation failed, falling back to HTML:", err);
    return { buffer: Buffer.from(html, "utf-8"), contentType: "text/html" };
  }
}

/**
 * Convenience re-export: build invoice data then generate the PDF in one call.
 * Import formatInvoiceData from gst.ts and pass result here, or use this shortcut.
 */
export { buildInvoiceHTML };
