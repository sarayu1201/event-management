const twilio = require("twilio");

const sendTicketWhatsApp = async (booking) => {
  try {
    const user = booking.user;
    const event = booking.event;
    
    if (!user || !user.phone) {
      console.warn("[WhatsApp] Cannot send WhatsApp: user phone number is missing", booking._id);
      return;
    }

    const cleanPhone = user.phone.replace(/[\s\-]/g, "");
    const formattedPhone = cleanPhone.startsWith("+") ? cleanPhone : `+91${cleanPhone}`;

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromWhatsApp = process.env.TWILIO_WHATSAPP_FROM || "whatsapp:+14155238886";

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${booking.ticketId}`;
    const msgText = `🎫 *Ticket Confirmed!* 🎉\n\n*Ticket ID:* ${booking.ticketId}\n*Event:* ${event.title}\n*Date:* ${new Date(event.date).toDateString()} at ${event.time}\n*Venue:* ${event.venue}, ${event.city}\n*Seats:* ${booking.seats}\n*Total Paid:* ₹${booking.totalAmount}\n\n*Special Instructions:* ${event.ticketInstructions || "Please carry a valid ID card."}\n\n*View Ticket QR Code:* ${qrUrl}\n\nScan at the venue entrance. See you there!`;

    if (accountSid && authToken) {
      const client = twilio(accountSid, authToken);
      const message = await client.messages.create({
        body: msgText,
        from: fromWhatsApp,
        to: `whatsapp:${formattedPhone}`,
      });
      console.log(`[WhatsApp] Auto-ticket sent successfully to ${formattedPhone}. Message SID: ${message.sid}`);
    } else {
      console.log("---------------- MOCK WHATSAPP DISPATCH ----------------");
      console.log(`To: whatsapp:${formattedPhone}`);
      console.log(`Body:\n${msgText}`);
      console.log("--------------------------------------------------------");
    }
  } catch (err) {
    console.error("[WhatsApp] Failed to send WhatsApp ticket:", err.message || err);
  }
};

module.exports = { sendTicketWhatsApp };
