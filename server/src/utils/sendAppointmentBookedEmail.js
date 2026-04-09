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

  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const templateId = process.env.EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY;
  const privateKey = process.env.EMAILJS_PRIVATE_KEY;

  if (!serviceId || !templateId || !publicKey || !privateKey) {
    console.warn(
      "Missing EmailJS environment variables. Check EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, EMAILJS_PUBLIC_KEY, EMAILJS_PRIVATE_KEY."
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
    startTime && endTime ? `${startTime} - ${endTime}` : startTime || endTime || "";

  const payload = {
    service_id: serviceId,
    template_id: templateId,
    user_id: publicKey,
    accessToken: privateKey,
    template_params: {
      to_email: userEmail,
      user_name: userName || "User",
      doctor_name: doctorName || "Doctor",
      specialization: specialization || "General",
      center_name: centerName || "Health Center",
      appointment_date: formatDate(appointmentDate),
      appointment_time: formattedTime,
      appointment_start_time: startTime || "",
      appointment_end_time: endTime || "",
      note: note || "No note provided",
      fee: fee != null ? `LKR ${fee}` : "",
      status: "CONFIRMED",
      appointment_url: appointmentUrl || "#",
    },
  };

  const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(`EmailJS failed: ${response.status} ${text}`);
  }

  return text;
};

module.exports = sendAppointmentBookedEmail;