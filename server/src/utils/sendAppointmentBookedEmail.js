const nodemailer = require("nodemailer");

const sendAppointmentBookedEmail = async ({
  userEmail,
  userName,
  doctorName,
  specialization,
  centerName,
  appointmentDate,
  startTime,
  endTime,
  note,
  fee,
  appointmentUrl,
}) => {
  if (!userEmail) {
    console.warn("User email missing. Skipping appointment email.");
    return;
  }

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = String(process.env.SMTP_SECURE || "false") === "true";
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || user;

  if (!host || !user || !pass) {
    console.warn(
      "Missing SMTP environment variables. Check SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, SMTP_FROM."
    );
    return;
  }

  const formatDate = (value) => {
    if (!value) return "";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);

    return date.toLocaleDateString("en-GB", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formattedTime =
    startTime && endTime
      ? `${startTime} - ${endTime}`
      : startTime || endTime || "";

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 12000,
  });

  const safeCenterName = centerName || "Health Center";
  const safeUserName = userName || "User";
  const safeDoctorName = doctorName || "Doctor";
  const safeSpecialization = specialization || "General";
  const safeDate = formatDate(appointmentDate) || "Not provided";
  const safeTime = formattedTime || "Not provided";
  const safeNote = note || "No note provided";
  const safeFee = fee != null ? `LKR ${fee}` : "Not specified";

  const html = `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Appointment Confirmed</title>
    </head>
    <body style="margin:0; padding:0; background-color:#4b4b4b; font-family:Arial, Helvetica, sans-serif;">
      <div style="width:100%; background-color:#4b4b4b; padding:24px 12px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:540px; margin:0 auto; border-collapse:collapse; overflow:hidden; border-radius:12px;">
          
          <tr>
            <td style="background:linear-gradient(180deg, #2474ea 0%, #1656b8 100%); text-align:center; padding:40px 24px 26px 24px;">
              <div style="font-size:42px; line-height:42px; margin-bottom:16px;">✅</div>
              <div style="font-size:34px; line-height:34px; font-weight:bold; color:#ffffff; margin-bottom:12px;">
                Booking Confirmed
              </div>
              <div style="font-size:16px; line-height:24px; color:#dbeafe;">
                Your appointment has been successfully scheduled
              </div>
            </td>
          </tr>

          <tr>
            <td style="background:linear-gradient(90deg, #1f1f1f 0%, #2a2a2a 100%); padding:28px 22px 28px 22px;">
              
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:separate; border-spacing:0; border:1px solid #bfc6cf; border-radius:8px; overflow:hidden; background-color:#5a5c60;">
                <tr>
                  <td style="padding:16px 20px; border-bottom:1px solid #9ca3af;">
                    <div style="font-size:11px; letter-spacing:1px; text-transform:uppercase; color:#cbd5e1; margin-bottom:6px;">
                      Patient
                    </div>
                    <div style="font-size:22px; line-height:28px; font-weight:bold; color:#ffffff;">
                      ${safeUserName}
                    </div>
                  </td>
                </tr>

                <tr>
                  <td style="padding:16px 20px; border-bottom:1px solid #9ca3af;">
                    <div style="font-size:11px; letter-spacing:1px; text-transform:uppercase; color:#cbd5e1; margin-bottom:6px;">
                      Date & Time
                    </div>
                    <div style="font-size:18px; line-height:26px; font-weight:bold; color:#ffffff;">
                      ${safeDate}
                    </div>
                    <div style="font-size:16px; line-height:24px; color:#d1d5db; margin-top:4px;">
                      ${safeTime}
                    </div>
                  </td>
                </tr>

                <tr>
                  <td style="padding:16px 20px; border-bottom:1px solid #9ca3af;">
                    <div style="font-size:11px; letter-spacing:1px; text-transform:uppercase; color:#cbd5e1; margin-bottom:6px;">
                      Doctor
                    </div>
                    <div style="font-size:18px; line-height:26px; font-weight:bold; color:#ffffff;">
                      ${safeDoctorName}
                    </div>
                    <div style="font-size:15px; line-height:22px; color:#d1d5db; margin-top:4px;">
                      ${safeSpecialization}
                    </div>
                  </td>
                </tr>

                <tr>
                  <td style="padding:16px 20px; border-bottom:1px solid #9ca3af;">
                    <div style="font-size:11px; letter-spacing:1px; text-transform:uppercase; color:#cbd5e1; margin-bottom:6px;">
                      Center
                    </div>
                    <div style="font-size:18px; line-height:26px; font-weight:bold; color:#ffffff;">
                      ${safeCenterName}
                    </div>
                  </td>
                </tr>

                <tr>
                  <td style="padding:16px 20px; border-bottom:1px solid #9ca3af;">
                    <div style="font-size:11px; letter-spacing:1px; text-transform:uppercase; color:#cbd5e1; margin-bottom:6px;">
                      Fee
                    </div>
                    <div style="font-size:18px; line-height:26px; font-weight:bold; color:#ffffff;">
                      ${safeFee}
                    </div>
                  </td>
                </tr>

                <tr>
                  <td style="padding:16px 20px; border-bottom:1px solid #9ca3af;">
                    <div style="font-size:11px; letter-spacing:1px; text-transform:uppercase; color:#cbd5e1; margin-bottom:8px;">
                      Status
                    </div>
                    <span style="display:inline-block; background-color:#2f7d49; color:#bbf7d0; font-size:13px; font-weight:bold; padding:6px 14px; border-radius:999px;">
                      CONFIRMED
                    </span>
                  </td>
                </tr>

                <tr>
                  <td style="padding:16px 20px;">
                    <div style="font-size:11px; letter-spacing:1px; text-transform:uppercase; color:#cbd5e1; margin-bottom:6px;">
                      Note
                    </div>
                    <div style="font-size:15px; line-height:22px; color:#f3f4f6;">
                      ${safeNote}
                    </div>
                  </td>
                </tr>
              </table>

              <div style="margin-top:20px; background-color:#4b5563; border-left:4px solid #3b82f6; border-radius:6px; padding:14px 16px; color:#dbeafe; font-size:14px; line-height:22px;">
                Please arrive a few minutes early for your appointment.
              </div>

              ${
                appointmentUrl
                  ? `
                <div style="text-align:center; margin-top:28px;">
                  <a
                    href="${appointmentUrl}"
                    style="
                      display:inline-block;
                      background:linear-gradient(180deg, #2474ea 0%, #1656b8 100%);
                      color:#ffffff;
                      text-decoration:none;
                      font-size:17px;
                      font-weight:bold;
                      padding:14px 30px;
                      border-radius:8px;
                    "
                  >
                    View Appointment
                  </a>
                </div>
              `
                  : ""
              }
            </td>
          </tr>

          <tr>
            <td style="background-color:#5f6368; text-align:center; padding:16px 20px; color:#cbd5e1; font-size:12px; line-height:18px;">
              This is an automated confirmation email. Please do not reply.
            </td>
          </tr>
        </table>
      </div>
    </body>
  </html>
  `;

  const text = `
Appointment Confirmed - ${safeCenterName}

Hello ${safeUserName},

Your appointment has been successfully scheduled.

Doctor: ${safeDoctorName}
Specialization: ${safeSpecialization}
Center: ${safeCenterName}
Date: ${safeDate}
Time: ${safeTime}
Fee: ${safeFee}
Status: CONFIRMED
Note: ${safeNote}
${appointmentUrl ? `Appointment Link: ${appointmentUrl}` : ""}

Please arrive a few minutes early for your appointment.

This is an automated confirmation email. Please do not reply.
  `.trim();

  const info = await transporter.sendMail({
    from: `"Health Center" <${from}>`,
    to: userEmail,
    subject: `Appointment Confirmed - ${safeCenterName}`,
    text,
    html,
  });

  return info;
};

module.exports = sendAppointmentBookedEmail;