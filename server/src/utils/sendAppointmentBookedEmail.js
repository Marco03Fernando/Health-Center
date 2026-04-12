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
  console.log("📧 sendAppointmentBookedEmail called");
  console.log("📧 Incoming email data:", {
    userEmail,
    userName,
    doctorName,
    specialization,
    centerName,
    appointmentDate,
    startTime,
    endTime,
    fee,
    hasAppointmentUrl: !!appointmentUrl,
  });

  try {
    if (!userEmail) {
      console.warn("⚠️ User email missing. Skipping appointment email.");
      return;
    }

    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 587);
    const secure = String(process.env.SMTP_SECURE || "false") === "true";
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const from = process.env.SMTP_FROM || user;

    console.log("📧 SMTP env check:", {
      host,
      port,
      secure,
      user,
      from,
      hasPass: !!pass,
      passLength: pass ? pass.length : 0,
    });

    if (!host || !user || !pass) {
      console.warn(
        "❌ Missing SMTP environment variables. Check SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, SMTP_FROM."
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

    console.log("📧 Creating transporter...");

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
      logger: true,
      debug: true,
    });

    console.log("📧 Verifying SMTP connection...");
    await transporter.verify();
    console.log("✅ SMTP verification successful");

    const safeCenterName = centerName || "Health Center";
    const safeUserName = userName || "User";
    const safeDoctorName = doctorName || "Doctor";
    const safeSpecialization = specialization || "General";
    const safeDate = formatDate(appointmentDate) || "Not provided";
    const safeTime = formattedTime || "Not provided";
    const safeNote = note || "No note provided";
    const safeFee = fee != null ? `LKR ${fee}` : "Not specified";

    const html = `
      <h2>Appointment Confirmed</h2>
      <p>Hello ${safeUserName},</p>
      <p>Your appointment has been successfully scheduled.</p>
      <p><strong>Doctor:</strong> ${safeDoctorName}</p>
      <p><strong>Specialization:</strong> ${safeSpecialization}</p>
      <p><strong>Center:</strong> ${safeCenterName}</p>
      <p><strong>Date:</strong> ${safeDate}</p>
      <p><strong>Time:</strong> ${safeTime}</p>
      <p><strong>Fee:</strong> ${safeFee}</p>
      <p><strong>Note:</strong> ${safeNote}</p>
      ${
        appointmentUrl
          ? `<p><a href="${appointmentUrl}">View Appointment</a></p>`
          : ""
      }
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
Note: ${safeNote}
${appointmentUrl ? `Appointment Link: ${appointmentUrl}` : ""}
    `.trim();

    console.log("📧 About to send email to:", userEmail);

    const info = await transporter.sendMail({
      from: `"Health Center" <${from}>`,
      to: userEmail,
      subject: `Appointment Confirmed - ${safeCenterName}`,
      text,
      html,
    });

    console.log("✅ Email sent successfully");
    console.log("📧 Message ID:", info.messageId);
    console.log("📧 Response:", info.response);

    return info;
  } catch (error) {
    console.error("❌ EMAIL SEND ERROR");
    console.error("Message:", error.message);
    console.error("Code:", error.code);
    console.error("Command:", error.command);
    console.error("Response:", error.response);
    console.error("Full error:", error);

    throw error;
  }
};

module.exports = sendAppointmentBookedEmail;