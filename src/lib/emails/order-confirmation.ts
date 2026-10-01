import { formatNaira } from "@/lib/format";

type EmailItem = {
  name: string;
  quantity: number;
  unitPriceKobo: number;
};

type OrderConfirmationData = {
  customerName: string;
  orderReference: string;
  totalKobo: number;
  items: EmailItem[];
  address: string;
  city: string;
  state: string;
};

// Customer-entered text (names, addresses) must be escaped before it goes into
// HTML, so nothing they type can be treated as HTML code.
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function buildOrderConfirmationEmail(data: OrderConfirmationData) {
  const firstName = data.customerName.split(" ")[0] || "there";
  const subject = `Your Crafted order ${data.orderReference} is confirmed`;
  const addressLine = `${data.address}, ${data.city}, ${data.state}`;

  const text = [
    `Hi ${firstName},`,
    "",
    `Thank you for your order! We've received your payment of ${formatNaira(data.totalKobo)}.`,
    "",
    `Order reference: ${data.orderReference}`,
    "",
    ...data.items.map(
      (item) =>
        `${item.quantity} × ${item.name}: ${formatNaira(item.unitPriceKobo * item.quantity)}`
    ),
    "",
    `Total: ${formatNaira(data.totalKobo)}`,
    `Delivering to: ${addressLine}`,
    "",
    "Thank you for supporting independent Nigerian makers.",
    "Crafted",
  ].join("\n");

  const itemRows = data.items
    .map(
      (item) => `
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #eee;">${item.quantity} × ${escapeHtml(item.name)}</td>
          <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;">${formatNaira(item.unitPriceKobo * item.quantity)}</td>
        </tr>`
    )
    .join("");

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a;">
      <h1 style="font-size:24px;margin-bottom:4px;">Crafted</h1>
      <p style="font-size:16px;">Hi ${escapeHtml(firstName)},</p>
      <p style="font-size:16px;">
        Thank you for your order! We&rsquo;ve received your payment of
        <strong>${formatNaira(data.totalKobo)}</strong>.
      </p>
      <p style="font-size:14px;color:#555;">Order reference: <strong>${data.orderReference}</strong></p>

      <table style="width:100%;border-collapse:collapse;font-size:14px;margin:16px 0;">
        ${itemRows}
        <tr>
          <td style="padding:12px 0;font-weight:bold;">Total</td>
          <td style="padding:12px 0;font-weight:bold;text-align:right;">${formatNaira(data.totalKobo)}</td>
        </tr>
      </table>

      <p style="font-size:14px;color:#555;">
        <strong>Delivering to:</strong><br />
        ${escapeHtml(addressLine)}
      </p>

      <p style="font-size:14px;color:#555;margin-top:24px;">
        Thank you for supporting independent Nigerian makers.<br />
        Crafted
      </p>
    </div>`;

  return { subject, text, html };
}