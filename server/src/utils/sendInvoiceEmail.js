const nodemailer = require("nodemailer");

const money = (n) => Number(n || 0).toFixed(2);

const buildConfirmedRowsHtml = (order) =>
  (order.items || [])
    .map((it) => {
      const qty = Number(it.requestedQty || 0);
      const name = it.nameSnapshot || "Medication";
      const unit = it.unitSnapshot || "";
      const total = Number(it.itemTotal || 0);

      return `
        <tr>
          <td style="padding:8px;border:1px solid #ddd;">${name} ${unit}</td>
          <td style="padding:8px;border:1px solid #ddd;text-align:center;">${qty}</td>
          <td style="padding:8px;border:1px solid #ddd;text-align:right;">${money(total)}</td>
        </tr>
      `;
    })
    .join("");

const buildWaitingRowsHtml = (order) =>
  (order.items || [])
    .map((it) => {
      const requested = Number(it.requestedQty || 0);
      const available = Number(it.availableQty || 0);
      const shortage = Number(it.shortageQty || Math.max(0, requested - available));
      const name = it.nameSnapshot || "Medication";
      const unit = it.unitSnapshot || "";

      return `
        <tr>
          <td style="padding:8px;border:1px solid #ddd;">${name} ${unit}</td>
          <td style="padding:8px;border:1px solid #ddd;text-align:center;">${requested}</td>
          <td style="padding:8px;border:1px solid #ddd;text-align:center;">${available}</td>
          <td style="padding:8px;border:1px solid #ddd;text-align:center;">${shortage}</td>
        </tr>
      `;
    })
    .join("");

/**
 * mode:
 * - "CONFIRMED" (default) => sends invoice bill
 * - "WAITING_STOCK" => sends waiting-stock notice with shortage table
 */
const sendInvoiceEmail = async ({ to, order, mode = "CONFIRMED" }) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const isWaiting = mode === "WAITING_STOCK" || order.status === "WAITING_STOCK";

  const subject = isWaiting
    ? `Order Waiting for Stock - ${order.orderNo}`
    : `Your Pharmacy Bill - ${order.orderNo}`;

  const html = isWaiting
    ? `
      <div style="font-family:Arial,sans-serif;">
        <h2>Pharmacy Order - Waiting for Stock</h2>
        <p>Hello ${order.patient?.name || ""},</p>
        <p>
          Your order has been received, but some items are currently <b>out of stock / insufficient</b>.
          We will notify you once stock is available.
        </p>

        <p><b>Order No:</b> ${order.orderNo}</p>

        <table style="border-collapse:collapse;width:100%;margin-top:12px;">
          <thead>
            <tr>
              <th style="padding:8px;border:1px solid #ddd;text-align:left;">Medication</th>
              <th style="padding:8px;border:1px solid #ddd;text-align:center;">Requested</th>
              <th style="padding:8px;border:1px solid #ddd;text-align:center;">Available</th>
              <th style="padding:8px;border:1px solid #ddd;text-align:center;">Shortage</th>
            </tr>
          </thead>
          <tbody>
            ${buildWaitingRowsHtml(order)}
          </tbody>
        </table>

        <p style="margin-top:12px;">
          <b>Note:</b> Total will be calculated when the order is confirmed.
        </p>
      </div>
    `
    : `
      <div style="font-family:Arial,sans-serif;">
        <h2>Pharmacy Bill</h2>
        <p><b>Order No:</b> ${order.orderNo}</p>
        <p><b>Patient:</b> ${order.patient?.name}</p>

        <table style="border-collapse:collapse;width:100%;margin-top:12px;">
          <thead>
            <tr>
              <th style="padding:8px;border:1px solid #ddd;text-align:left;">Medication</th>
              <th style="padding:8px;border:1px solid #ddd;text-align:center;">Qty</th>
              <th style="padding:8px;border:1px solid #ddd;text-align:right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${buildConfirmedRowsHtml(order)}
          </tbody>
        </table>

        <h3 style="text-align:right;margin-top:12px;">
          Grand Total: ${money(order.total)}
        </h3>
      </div>
    `;

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    html,
  });
};

module.exports = sendInvoiceEmail;