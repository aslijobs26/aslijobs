import PDFDocument from "pdfkit";

type Party = {
  name: string;
  /** Secondary line under the name (contact person, tagline). */
  subtitle?: string;
  address: string;
  email: string;
  phone: string;
  gstin: string;
  pan?: string;
  state: string;
};

export type PaymentInvoiceData = {
  invoiceNumber: string;
  orderId: string;
  paymentId: string;
  paymentMethod: string;
  bankReference: string;
  paidAt: Date;
  planName: string;
  planDescription: string;
  /** e.g. ["5 job posts", "Live 15 days", "Up to 3 cities"] */
  planHighlights: string[];
  sacCode: string;
  baseAmount: number;
  gstRatePercent: number;
  gstAmount: number;
  /** Total charged (base + GST). */
  amount: number;
  currency: string;
  seller: Party;
  billedTo: Party;
};

const C = {
  brand: "#0e8585",
  brandDark: "#0b6f6f",
  brandTint: "#e8f5f5",
  ink: "#0f172a",
  body: "#334155",
  muted: "#64748b",
  faint: "#94a3b8",
  line: "#e2e8f0",
  panel: "#f8fafc",
  success: "#15803d",
  successTint: "#dcfce7",
};

const PAGE_MARGIN = 44;

// ---------------------------------------------------------------- formatting

/** Built-in Helvetica has no ₹ glyph, so amounts use "Rs." in the PDF. */
function money(amount: number, currency: string): string {
  const formatted = amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return currency === "INR" ? `Rs. ${formatted}` : `${currency} ${formatted}`;
}

function formatDate(value: Date): string {
  return value.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

function formatDateTime(value: Date): string {
  return value.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  });
}

function humanizePaymentMethod(value: string): string {
  if (!value) return "Online payment";
  const known: Record<string, string> = {
    upi: "UPI",
    credit_card: "Credit card",
    debit_card: "Debit card",
    net_banking: "Net banking",
    wallet: "Wallet",
    app: "Wallet",
    cardless_emi: "Cardless EMI",
    pay_later: "Pay later",
  };
  return known[value] ?? value.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

const ONES = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
  "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen",
  "Eighteen", "Nineteen",
];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function belowHundred(n: number): string {
  if (n < 20) return ONES[n]!;
  const tens = TENS[Math.floor(n / 10)]!;
  return n % 10 ? `${tens}-${ONES[n % 10]}` : tens;
}

function belowThousand(n: number): string {
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  return [hundreds ? `${ONES[hundreds]} Hundred` : "", rest ? belowHundred(rest) : ""]
    .filter(Boolean)
    .join(" ");
}

/** Indian numbering: crore / lakh / thousand. */
function integerToIndianWords(n: number): string {
  if (n === 0) return "Zero";
  const parts: string[] = [];
  const crore = Math.floor(n / 10_000_000);
  const lakh = Math.floor((n % 10_000_000) / 100_000);
  const thousand = Math.floor((n % 100_000) / 1000);
  const rest = n % 1000;
  if (crore) parts.push(`${integerToIndianWords(crore)} Crore`);
  if (lakh) parts.push(`${belowHundred(lakh)} Lakh`);
  if (thousand) parts.push(`${belowHundred(thousand)} Thousand`);
  if (rest) parts.push(belowThousand(rest));
  return parts.join(" ");
}

export function amountInWords(amount: number): string {
  const paiseTotal = Math.round(amount * 100);
  const rupees = Math.floor(paiseTotal / 100);
  const paise = paiseTotal % 100;
  const rupeeWords = `Rupees ${integerToIndianWords(rupees)}`;
  return paise ? `${rupeeWords} and ${belowHundred(paise)} Paise Only` : `${rupeeWords} Only`;
}

function normalizeState(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export type TaxLine = { label: string; amount: number };

/** CGST+SGST for intra-state supply, IGST inter-state, plain GST if unknown. */
export function resolveTaxLines(input: {
  gstRatePercent: number;
  gstAmount: number;
  sellerState: string;
  buyerState: string;
}): TaxLine[] {
  const { gstRatePercent: rate, gstAmount } = input;
  if (rate <= 0 || gstAmount <= 0) return [];
  const seller = normalizeState(input.sellerState);
  const buyer = normalizeState(input.buyerState);
  if (seller && buyer && seller === buyer) {
    const totalPaise = Math.round(gstAmount * 100);
    const cgstPaise = Math.round(totalPaise / 2);
    const half = rate / 2;
    return [
      { label: `CGST @ ${half}%`, amount: cgstPaise / 100 },
      { label: `SGST @ ${half}%`, amount: (totalPaise - cgstPaise) / 100 },
    ];
  }
  if (seller && buyer) {
    return [{ label: `IGST @ ${rate}%`, amount: gstAmount }];
  }
  return [{ label: `GST @ ${rate}%`, amount: gstAmount }];
}

// ------------------------------------------------------------------- drawing

type Doc = InstanceType<typeof PDFDocument>;

function sectionLabel(doc: Doc, text: string, x: number, y: number, width?: number) {
  doc
    .font("Helvetica-Bold")
    .fontSize(7.5)
    .fillColor(C.brand)
    .text(text.toUpperCase(), x, y, { width, characterSpacing: 1.1 });
}

function pill(doc: Doc, text: string, rightX: number, y: number, fg: string, bg: string) {
  doc.font("Helvetica-Bold").fontSize(8);
  const textWidth = doc.widthOfString(text, { characterSpacing: 1 });
  const w = textWidth + 20;
  const x = rightX - w;
  doc.roundedRect(x, y, w, 18, 9).fill(bg);
  doc.fillColor(fg).text(text, x + 10, y + 5.5, { characterSpacing: 1, lineBreak: false });
  return w;
}

/** Measures how tall a party card's content will be. */
function partyLines(party: Party): Array<{ text: string; strong?: boolean; muted?: boolean }> {
  const lines: Array<{ text: string; strong?: boolean; muted?: boolean }> = [];
  lines.push({ text: party.name || "—", strong: true });
  if (party.subtitle) lines.push({ text: party.subtitle, muted: true });
  if (party.address) lines.push({ text: party.address });
  if (party.email) lines.push({ text: party.email });
  if (party.phone) lines.push({ text: party.phone });
  if (party.gstin) lines.push({ text: `GSTIN: ${party.gstin}` });
  if (party.pan) lines.push({ text: `PAN: ${party.pan}` });
  return lines;
}

function drawPartyCard(
  doc: Doc,
  label: string,
  party: Party,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  doc.roundedRect(x, y, w, h, 8).lineWidth(0.8).strokeColor(C.line).stroke();
  doc.rect(x, y + 14, 3, 18).fill(C.brand);
  sectionLabel(doc, label, x + 16, y + 14);
  let cursor = y + 30;
  for (const line of partyLines(party)) {
    doc
      .font(line.strong ? "Helvetica-Bold" : "Helvetica")
      .fontSize(line.strong ? 11 : 8.8)
      .fillColor(line.strong ? C.ink : line.muted ? C.muted : C.body)
      .text(line.text, x + 16, cursor, { width: w - 32, lineGap: 1 });
    cursor = doc.y + (line.strong ? 3 : 1.5);
  }
}

function measurePartyCard(doc: Doc, party: Party, w: number): number {
  let h = 30;
  for (const line of partyLines(party)) {
    doc.font(line.strong ? "Helvetica-Bold" : "Helvetica").fontSize(line.strong ? 11 : 8.8);
    h += doc.heightOfString(line.text, { width: w - 32, lineGap: 1 }) + (line.strong ? 3 : 1.5);
  }
  return h + 14;
}

export function buildPaymentInvoicePdf(data: PaymentInvoiceData): Promise<Buffer> {
  const doc = new PDFDocument({
    size: "A4",
    margin: PAGE_MARGIN,
    info: {
      Title: `${data.seller.name} Invoice ${data.invoiceNumber}`,
      Author: data.seller.name,
      Subject: `${data.planName} plan`,
    },
  });

  const chunks: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  const pageW = doc.page.width;
  const pageH = doc.page.height;
  const left = PAGE_MARGIN;
  const right = pageW - PAGE_MARGIN;
  const width = right - left;
  const chargesGst = data.gstRatePercent > 0 && data.gstAmount > 0;
  // A GST "tax invoice" must carry the supplier's GSTIN.
  const isTaxInvoice = chargesGst && Boolean(data.seller.gstin);
  const taxLines = resolveTaxLines({
    gstRatePercent: data.gstRatePercent,
    gstAmount: data.gstAmount,
    sellerState: data.seller.state,
    buyerState: data.billedTo.state,
  });

  // ── Brand band ────────────────────────────────────────────────────────────
  doc.rect(0, 0, pageW, 6).fill(C.brand);

  doc
    .font("Helvetica-Bold")
    .fontSize(24)
    .fillColor(C.brand)
    .text("Asli", left, 34, { continued: true, lineBreak: false })
    .fillColor(C.ink)
    .text("Jobs", { lineBreak: false });
  doc
    .font("Helvetica")
    .fontSize(8.5)
    .fillColor(C.muted)
    .text("Hire verified talent, faster.", left, 64);

  doc
    .font("Helvetica-Bold")
    .fontSize(20)
    .fillColor(C.ink)
    .text(isTaxInvoice ? "TAX INVOICE" : "INVOICE", left, 34, {
      width,
      align: "right",
      characterSpacing: 1.5,
    });
  pill(doc, "PAID", right, 62, C.success, C.successTint);

  // ── Meta strip ────────────────────────────────────────────────────────────
  const metaY = 98;
  const metaH = 50;
  doc.roundedRect(left, metaY, width, metaH, 8).fill(C.brandTint);
  const meta: Array<[string, string]> = [
    ["Invoice no.", data.invoiceNumber],
    ["Invoice date", formatDate(data.paidAt)],
    ["Order ID", data.orderId],
    ["Place of supply", data.billedTo.state || "—"],
  ];
  const metaColW = width / meta.length;
  meta.forEach(([label, value], i) => {
    const x = left + i * metaColW + 14;
    if (i > 0) {
      doc
        .moveTo(left + i * metaColW, metaY + 12)
        .lineTo(left + i * metaColW, metaY + metaH - 12)
        .lineWidth(0.6)
        .strokeColor("#c5e3e3")
        .stroke();
    }
    doc
      .font("Helvetica")
      .fontSize(7.5)
      .fillColor(C.brandDark)
      .text(label.toUpperCase(), x, metaY + 12, { width: metaColW - 22, characterSpacing: 0.8 });
    // Shrink long ids so they stay on one line.
    const maxW = metaColW - 22;
    let size = 9.5;
    doc.font("Helvetica-Bold");
    while (size > 6.5 && doc.fontSize(size).widthOfString(value) > maxW) size -= 0.25;
    doc.fontSize(size).fillColor(C.ink).text(value, x, metaY + 26, { lineBreak: false });
  });

  // ── Billed by / Billed to ─────────────────────────────────────────────────
  const partyY = metaY + metaH + 18;
  const gap = 16;
  const cardW = (width - gap) / 2;
  const cardH = Math.max(
    measurePartyCard(doc, data.seller, cardW),
    measurePartyCard(doc, data.billedTo, cardW),
    92,
  );
  drawPartyCard(doc, "Billed by", data.seller, left, partyY, cardW, cardH);
  drawPartyCard(doc, "Billed to", data.billedTo, left + cardW + gap, partyY, cardW, cardH);

  // ── Plan details table ────────────────────────────────────────────────────
  let y = partyY + cardH + 26;
  sectionLabel(doc, "Plan details", left, y);
  y += 16;

  const cols = [
    { key: "idx", label: "#", w: 26, align: "left" as const },
    { key: "desc", label: "Description", w: 0, align: "left" as const },
    { key: "sac", label: "SAC", w: 56, align: "center" as const },
    { key: "qty", label: "Qty", w: 34, align: "center" as const },
    { key: "rate", label: "Rate", w: 82, align: "right" as const },
    { key: "amt", label: "Amount", w: 88, align: "right" as const },
  ];
  const fixed = cols.reduce((sum, c) => sum + c.w, 0);
  cols[1]!.w = width - fixed - 24;
  const colX: number[] = [];
  let cx = left + 12;
  for (const c of cols) {
    colX.push(cx);
    cx += c.w;
  }

  doc.roundedRect(left, y, width, 26, 6).fill(C.ink);
  cols.forEach((c, i) => {
    doc
      .font("Helvetica-Bold")
      .fontSize(7.5)
      .fillColor("#ffffff")
      .text(c.label.toUpperCase(), colX[i]!, y + 9.5, {
        width: c.w,
        align: c.align,
        characterSpacing: 0.8,
      });
  });
  y += 26;

  const rowTop = y + 12;
  const descW = cols[1]!.w - 8;
  doc
    .font("Helvetica-Bold")
    .fontSize(10.5)
    .fillColor(C.ink)
    .text(`${data.planName} plan`, colX[1]!, rowTop, { width: descW });
  let descBottom = doc.y + 2;
  if (data.planDescription) {
    doc
      .font("Helvetica")
      .fontSize(8.5)
      .fillColor(C.muted)
      .text(data.planDescription, colX[1]!, descBottom, { width: descW });
    descBottom = doc.y + 6;
  }
  // Inclusion chips
  let chipX = colX[1]!;
  let chipY = descBottom;
  doc.font("Helvetica").fontSize(7.5);
  for (const chip of data.planHighlights) {
    const w = doc.widthOfString(chip) + 14;
    if (chipX + w > colX[1]! + descW) {
      chipX = colX[1]!;
      chipY += 18;
    }
    doc.roundedRect(chipX, chipY, w, 14, 7).fill(C.brandTint);
    doc.fillColor(C.brandDark).text(chip, chipX + 7, chipY + 3.5, { lineBreak: false });
    chipX += w + 6;
  }
  const rowBottom = (data.planHighlights.length ? chipY + 14 : descBottom) + 12;

  const cellText = (i: number, text: string, bold = false) =>
    doc
      .font(bold ? "Helvetica-Bold" : "Helvetica")
      .fontSize(9.5)
      .fillColor(bold ? C.ink : C.body)
      .text(text, colX[i]!, rowTop + 1, { width: cols[i]!.w, align: cols[i]!.align });
  cellText(0, "1");
  cellText(2, data.sacCode || "—");
  cellText(3, "1");
  cellText(4, money(data.baseAmount, data.currency));
  cellText(5, money(data.baseAmount, data.currency), true);

  doc.moveTo(left, rowBottom).lineTo(right, rowBottom).lineWidth(0.8).strokeColor(C.line).stroke();
  y = rowBottom + 20;

  // ── Payment information + totals ──────────────────────────────────────────
  const totalsW = 236;
  const infoW = width - totalsW - gap;
  const totalsX = right - totalsW;

  const totalsRows: Array<[string, string]> = [
    ["Subtotal", money(data.baseAmount, data.currency)],
    ...taxLines.map((t): [string, string] => [t.label, money(t.amount, data.currency)]),
  ];
  const totalsInnerH = totalsRows.length * 20 + 12;
  const grandH = 40;
  const totalsH = totalsInnerH + grandH;

  const infoRows: Array<[string, string]> = [
    ["Paid on", formatDateTime(data.paidAt)],
    ["Method", humanizePaymentMethod(data.paymentMethod)],
    ["Transaction ID", data.paymentId || "—"],
    ...(data.bankReference ? ([["Bank reference", data.bankReference]] as Array<[string, string]>) : []),
    ["Gateway", "Cashfree Payments"],
  ];
  const infoH = Math.max(totalsH, 34 + infoRows.length * 17 + 8);

  // Payment info card
  doc.roundedRect(left, y, infoW, infoH, 8).fill(C.panel);
  sectionLabel(doc, "Payment information", left + 16, y + 14);
  let iy = y + 32;
  for (const [label, value] of infoRows) {
    doc
      .font("Helvetica")
      .fontSize(8.5)
      .fillColor(C.muted)
      .text(label, left + 16, iy, { width: 82, lineBreak: false });
    doc
      .font("Helvetica-Bold")
      .fontSize(8.5)
      .fillColor(C.ink)
      .text(value, left + 100, iy, { width: infoW - 116, lineBreak: false, ellipsis: true });
    iy += 17;
  }

  // Totals card
  doc.roundedRect(totalsX, y, totalsW, infoH, 8).lineWidth(0.8).strokeColor(C.line).stroke();
  let ty = y + 14;
  for (const [label, value] of totalsRows) {
    doc
      .font("Helvetica")
      .fontSize(9.5)
      .fillColor(C.body)
      .text(label, totalsX + 16, ty, { width: totalsW / 2 })
      .text(value, totalsX + 16, ty, { width: totalsW - 32, align: "right" });
    ty += 20;
  }
  const grandY = y + infoH - grandH;
  doc
    .roundedRect(totalsX, grandY, totalsW, grandH, 8)
    .fill(C.brand);
  // Square off the top corners of the grand-total band.
  doc.rect(totalsX, grandY, totalsW, 8).fill(C.brand);
  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor("#ffffff")
    .text("Total paid", totalsX + 16, grandY + 14, { width: totalsW / 2 })
    .fontSize(13)
    .text(money(data.amount, data.currency), totalsX + 16, grandY + 12, {
      width: totalsW - 32,
      align: "right",
    });

  y += infoH + 14;

  // Amount in words
  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor(C.muted)
    .text("AMOUNT IN WORDS", left, y, { characterSpacing: 0.8 });
  doc
    .font("Helvetica-Bold")
    .fontSize(9.5)
    .fillColor(C.ink)
    .text(amountInWords(data.amount), left, y + 12, { width });
  y = doc.y + 6;
  if (chargesGst) {
    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(C.muted)
      .text(
        `Includes ${money(data.gstAmount, data.currency)} GST @ ${data.gstRatePercent}% on the plan price.${
          isTaxInvoice ? " Tax payable on reverse charge: No." : ""
        }`,
        left,
        y,
        { width },
      );
  }

  // ── Footer ────────────────────────────────────────────────────────────────
  const footerY = pageH - PAGE_MARGIN - 52;
  doc.moveTo(left, footerY).lineTo(right, footerY).lineWidth(0.8).strokeColor(C.line).stroke();
  doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .fillColor(C.ink)
    .text(`Thank you for choosing ${data.seller.name}!`, left, footerY + 12, {
      width: width * 0.6,
    });
  const support = [data.seller.email, data.seller.phone].filter(Boolean).join("  ·  ");
  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor(C.muted)
    .text(
      support ? `Questions about this invoice? Reach us at ${support}` : "Keep this invoice for your records.",
      left,
      footerY + 26,
      { width: width * 0.65 },
    );
  doc
    .font("Helvetica")
    .fontSize(7.5)
    .fillColor(C.faint)
    .text("Computer-generated invoice.\nNo signature required.", left, footerY + 12, {
      width,
      align: "right",
    });

  doc.end();
  return done;
}
