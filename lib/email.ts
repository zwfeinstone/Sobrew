import { Resend } from "resend";
import { env } from "@/lib/env";
import { formatUsd } from "@/lib/money";

const resend = new Resend(env.resendApiKey);

type OrderEmailInput = {
  orderId: string;
  centerName: string;
  centerEmail: string;
  createdAt: string;
  shipping: {
    contact_name: string;
    phone: string;
    address_line1: string;
    address_line2: string | null;
    city: string;
    state: string;
    postal_code: string;
  };
  notes: string | null;
  po_number: string | null;
  total_cents: number;
  items: Array<{ name: string; quantity: number; unit_price_cents: number; line_total_cents: number }>;
};

function htmlOrder(input: OrderEmailInput) {
  const itemRows = input.items
    .map(
      (item) =>
        `<tr><td>${item.name}</td><td>${item.quantity}</td><td>${formatUsd(
          item.unit_price_cents
        )}</td><td>${formatUsd(item.line_total_cents)}</td></tr>`
    )
    .join("");

  return `<h2>Order ${input.orderId}</h2>
  <p><strong>Center:</strong> ${input.centerName}</p>
  <p><strong>Placed:</strong> ${new Date(input.createdAt).toLocaleString()}</p>
  <p><strong>Shipping:</strong> ${input.shipping.contact_name}, ${input.shipping.phone}, ${input.shipping.address_line1} ${
    input.shipping.address_line2 ?? ""
  }, ${input.shipping.city}, ${input.shipping.state} ${input.shipping.postal_code}</p>
  <p><strong>PO:</strong> ${input.po_number ?? "N/A"}</p>
  <p><strong>Notes:</strong> ${input.notes ?? "N/A"}</p>
  <table border="1" cellpadding="8" cellspacing="0"><thead><tr><th>Product</th><th>Qty</th><th>Unit</th><th>Line</th></tr></thead><tbody>${itemRows}</tbody></table>
  <p><strong>Total:</strong> ${formatUsd(input.total_cents)}</p>`;
}

export async function sendNewOrderEmails(input: OrderEmailInput) {
  const subject = `New wholesale order ${input.orderId} from ${input.centerName}`;
  const html = htmlOrder(input);
  await resend.emails.send({
    from: "Wholesale Portal <orders@sobrew.com>",
    to: env.orderInbox,
    subject,
    html
  });

  await resend.emails.send({
    from: `${env.brandName} <orders@sobrew.com>`,
    to: input.centerEmail,
    subject: `Order confirmation ${input.orderId}`,
    html
  });
}

export async function sendShippedEmail(input: OrderEmailInput) {
  await resend.emails.send({
    from: `${env.brandName} <orders@sobrew.com>`,
    to: input.centerEmail,
    subject: `Your order ${input.orderId} has shipped`,
    html: `<p>Your order has been marked as shipped.</p>${htmlOrder(input)}`
  });
}
