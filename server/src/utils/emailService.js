const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendBookingConfirmationEmail(toEmail, bookingDetails) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: toEmail,
    subject: "Appointment Booking Confirmation",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin:0;padding:0;background-color:#f4f6f9;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f9;padding:40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
                
                <!-- Header -->
                <tr>
                  <td style="background:linear-gradient(135deg,#1a73e8,#0d47a1);padding:40px 40px 32px;text-align:center;">
                    <div style="font-size:48px;margin-bottom:12px;">✅</div>
                    <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;letter-spacing:-0.5px;">Booking Confirmed</h1>
                    <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:15px;">Your appointment has been successfully scheduled</p>
                  </td>
                </tr>

                <!-- Details -->
                <tr>
                  <td style="padding:32px 40px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;">
                      <tr>
                        <td style="padding:20px 24px;border-bottom:1px solid #e2e8f0;">
                          <span style="display:block;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;margin-bottom:4px;">Date & Time</span>
                          <span style="font-size:16px;font-weight:600;color:#1e293b;">${bookingDetails.appointmentDate}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:20px 24px;border-bottom:1px solid #e2e8f0;">
                          <span style="display:block;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;margin-bottom:4px;">Center</span>
                          <span style="font-size:16px;font-weight:600;color:#1e293b;">${bookingDetails.center}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:20px 24px;">
                          <span style="display:block;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;margin-bottom:4px;">Status</span>
                          <span style="display:inline-block;background-color:#dcfce7;color:#166534;font-size:13px;font-weight:600;padding:4px 12px;border-radius:20px;">${bookingDetails.status}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Reminder -->
                <tr>
                  <td style="padding:0 40px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#eff6ff;border-radius:8px;border-left:4px solid #1a73e8;">
                      <tr>
                        <td style="padding:16px 20px;">
                          <p style="margin:0;color:#1e40af;font-size:14px;">📌 Please arrive a few minutes early for your appointment.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- CTA Button -->
                <tr>
                  <td style="padding:32px 40px;text-align:center;">
                    <a href="#" style="display:inline-block;background:linear-gradient(135deg,#1a73e8,#0d47a1);color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 36px;border-radius:8px;">View Appointment</a>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding:24px 40px;background-color:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
                    <p style="margin:0;color:#94a3b8;font-size:12px;">This is an automated confirmation email. Please do not reply.</p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  };

  return transporter.sendMail(mailOptions);
}


async function sendBookingCancellationEmail(toEmail, bookingDetails) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: toEmail,
    subject: "Appointment Cancelled",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin:0;padding:0;background-color:#fff7f7;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fff7f7;padding:40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
                <tr>
                  <td style="background:linear-gradient(135deg,#ef4444,#b91c1c);padding:40px 40px 32px;text-align:center;">
                    <div style="font-size:48px;margin-bottom:12px;">❌</div>
                    <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;letter-spacing:-0.5px;">Booking Cancelled</h1>
                    <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:15px;">Your appointment has been cancelled</p>
                  </td>
                </tr>

                <tr>
                  <td style="padding:32px 40px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fff7f7;border-radius:8px;border:1px solid #fee2e2;">
                      <tr>
                        <td style="padding:20px 24px;border-bottom:1px solid #fee2e2;">
                          <span style="display:block;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#9f1239;margin-bottom:4px;">Date & Time</span>
                          <span style="font-size:16px;font-weight:600;color:#111827;">${bookingDetails.appointmentDate}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:20px 24px;border-bottom:1px solid #fee2e2;">
                          <span style="display:block;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#9f1239;margin-bottom:4px;">Center</span>
                          <span style="font-size:16px;font-weight:600;color:#111827;">${bookingDetails.center}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:20px 24px;">
                          <span style="display:block;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#9f1239;margin-bottom:4px;">Status</span>
                          <span style="display:inline-block;background-color:#fee2e2;color:#7f1d1d;font-size:13px;font-weight:600;padding:4px 12px;border-radius:20px;">${bookingDetails.status}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td style="padding:24px 40px;background-color:#fff7f7;border-top:1px solid #fee2e2;text-align:center;">
                    <p style="margin:0;color:#9f1239;font-size:12px;">This is an automated cancellation email. Please contact the center if you need further assistance.</p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  };

  return transporter.sendMail(mailOptions);
}


async function sendBookingCompletedEmail(toEmail, bookingDetails) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: toEmail,
    subject: "Appointment Completed",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin:0;padding:0;background-color:#f7fffb;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f7fffb;padding:40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
                <tr>
                  <td style="background:linear-gradient(135deg,#10b981,#047857);padding:40px 40px 32px;text-align:center;">
                    <div style="font-size:48px;margin-bottom:12px;">✅</div>
                    <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;letter-spacing:-0.5px;">Appointment Completed</h1>
                    <p style="margin:8px 0 0;color:rgba(255,255,255,0.9);font-size:15px;">Thank you — your appointment was completed</p>
                  </td>
                </tr>

                <tr>
                  <td style="padding:32px 40px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0fdf4;border-radius:8px;border:1px solid #d1fae5;">
                      <tr>
                        <td style="padding:20px 24px;border-bottom:1px solid #d1fae5;">
                          <span style="display:block;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#065f46;margin-bottom:4px;">Date & Time</span>
                          <span style="font-size:16px;font-weight:600;color:#064e3b;">${bookingDetails.appointmentDate}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:20px 24px;border-bottom:1px solid #d1fae5;">
                          <span style="display:block;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#065f46;margin-bottom:4px;">Center</span>
                          <span style="font-size:16px;font-weight:600;color:#064e3b;">${bookingDetails.center}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:20px 24px;">
                          <span style="display:block;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#065f46;margin-bottom:4px;">Status</span>
                          <span style="display:inline-block;background-color:#dcfce7;color:#065f46;font-size:13px;font-weight:600;padding:4px 12px;border-radius:20px;">${bookingDetails.status}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td style="padding:24px 40px;background-color:#f7fffb;border-top:1px solid #d1fae5;text-align:center;">
                    <p style="margin:0;color:#065f46;font-size:12px;">If you need follow-up care or reports, please contact the center.</p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  };

  return transporter.sendMail(mailOptions);
}

module.exports = { sendBookingConfirmationEmail, sendBookingCancellationEmail, sendBookingCompletedEmail };