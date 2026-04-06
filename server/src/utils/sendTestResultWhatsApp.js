const twilio = require("twilio");

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const sendTestResultWhatsApp = async (to, message) => {
  const res = await client.messages.create({
    from: process.env.TWILIO_WHATSAPP_NUMBER,
    to: `whatsapp:${to}`,
    body: message,
  });

  console.log("WhatsApp SID:", res.sid);
  console.log("WhatsApp STATUS:", res.status);
  return res;
};

module.exports = sendTestResultWhatsApp;