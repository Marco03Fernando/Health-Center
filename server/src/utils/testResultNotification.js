const sendWhatsApp = require("./sendWhatsapp");
const sendEmail = require("./sendEmail");

function formatSriLankaPhone(phone = "") {
  let formatted = String(phone).trim();

  if (!formatted) return "";

  formatted = formatted.replace(/[\s-]/g, "");

  if (formatted.startsWith("+")) return formatted;

  if (formatted.startsWith("0")) {
    return `+94${formatted.substring(1)}`;
  }

  return `+94${formatted}`;
}

function buildResultNotificationContent(result) {
  const patient = result.patientId || result.appointmentId?.user || {};
  const testType = result.testTypeId || {};
  const appointment = result.appointmentId || {};
  const center = appointment.healthCenter || {};

  const patientName = patient.fullName || patient.name || "Patient";
  const patientEmail = patient.email || "";
  const patientPhone = formatSriLankaPhone(patient.phone || "");

  const testName =
    testType.name ||
    appointment.diagnosticTest?.name ||
    "lab test";

  const centerName = center.name || "Health Center";
  const websiteLink = process.env.CLIENT_URL || "Website link coming soon";

  const subject = `${centerName} - Test Result Ready`;

  const text = `Dear ${patientName},

Your test result for ${testName} is now ready to view.
Please log in to the system to access your report.

Website: ${websiteLink}

Best regards,
${centerName} - Laboratory Service`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    </head>
    <body style="margin:0;padding:0;background-color:#f4f6f9;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f9;padding:40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
              
              <tr>
                <td style="background:linear-gradient(135deg,#0f766e,#0d9488);padding:40px 40px 32px;text-align:center;">
                  <div style="font-size:48px;margin-bottom:12px;">🧪</div>
                  <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;letter-spacing:-0.5px;">Test Result Ready</h1>
                  <p style="margin:8px 0 0;color:rgba(255,255,255,0.9);font-size:15px;">
                    Your laboratory result is now available to view
                  </p>
                </td>
              </tr>

              <tr>
                <td style="padding:32px 40px;">
                  <p style="margin:0 0 18px;color:#111827;font-size:15px;">Dear ${patientName},</p>
                  <p style="margin:0 0 18px;color:#374151;font-size:15px;">
                    Your test result for <strong>${testName}</strong> is now ready to view.
                  </p>
                  <p style="margin:0 0 22px;color:#374151;font-size:15px;">
                    Please log in to the system to access your report.
                  </p>

                  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;">
                    <tr>
                      <td style="padding:20px 24px;border-bottom:1px solid #e2e8f0;">
                        <span style="display:block;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;margin-bottom:4px;">Test</span>
                        <span style="font-size:16px;font-weight:600;color:#1e293b;">${testName}</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:20px 24px;">
                        <span style="display:block;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;margin-bottom:4px;">Center</span>
                        <span style="font-size:16px;font-weight:600;color:#1e293b;">${centerName}</span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <tr>
                <td style="padding:0 40px 32px;text-align:center;">
                  <a href="${websiteLink}" style="display:inline-block;background:linear-gradient(135deg,#0f766e,#0d9488);color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 36px;border-radius:8px;">
                    Open Website
                  </a>
                </td>
              </tr>

              <tr>
                <td style="padding:24px 40px;background-color:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
                  <p style="margin:0;color:#94a3b8;font-size:12px;">
                    ${centerName} - Laboratory Service
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return {
    patient,
    patientName,
    patientEmail,
    patientPhone,
    testName,
    centerName,
    websiteLink,
    subject,
    text,
    html,
  };
}

async function notifyTestResultCreated(result, options = {}) {
  const { sendWhatsapp = true, sendEmailNotification = true } = options;

  const content = buildResultNotificationContent(result);

  const response = {
    whatsapp: {
      attempted: false,
      success: false,
      error: null,
      sid: null,
      status: null,
    },
    email: {
      attempted: false,
      success: false,
      error: null,
      messageId: null,
    },
  };

  if (sendWhatsapp && content.patientPhone) {
    response.whatsapp.attempted = true;
    try {
      const waResult = await sendWhatsApp(content.patientPhone, content.text);
      response.whatsapp.success = true;
      response.whatsapp.sid = waResult?.sid || null;
      response.whatsapp.status = waResult?.status || null;
    } catch (err) {
      response.whatsapp.error = err.message;
      console.error("WhatsApp send failed:", err.message);
    }
  }

  if (sendEmailNotification && content.patientEmail) {
    response.email.attempted = true;
    try {
      const emailResult = await sendEmail({
        to: content.patientEmail,
        subject: content.subject,
        text: content.text,
        html: content.html,
      });

      response.email.success = true;
      response.email.messageId = emailResult?.messageId || null;
    } catch (err) {
      response.email.error = err.message;
      console.error("Email send failed:", err.message);
    }
  }

  return response;
}

module.exports = {
  formatSriLankaPhone,
  buildResultNotificationContent,
  notifyTestResultCreated,
};