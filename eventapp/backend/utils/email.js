const nodemailer = require("nodemailer");

const sendTicketEmail = async (booking) => {
  try {
    const user = booking.user;
    const event = booking.event;
    
    if (!user || !user.email) {
      console.warn("Cannot send ticket email: user or email is missing", booking);
      return;
    }

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${booking.ticketId}`;

    const mailOptions = {
      from: process.env.SMTP_FROM || `"EventHub Tickets" <no-reply@eventhub.com>`,
      to: user.email,
      subject: `Your Ticket is Confirmed! - ${event.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff; color: #1e293b;">
          <h2 style="color: #4f46e5; text-align: center;">Booking Confirmed! 🎉</h2>
          <p>Hi ${user.name || "Customer"},</p>
          <p>Your tickets have been successfully booked. Below are your ticket details and QR code for entry.</p>
          
          <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 6px; padding: 15px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>🎫 Ticket ID:</strong> <span style="font-family: monospace; font-size: 16px; color: #4f46e5;">${booking.ticketId}</span></p>
            <p style="margin: 5px 0;"><strong>🎉 Event:</strong> ${event.title}</p>
            <p style="margin: 5px 0;"><strong>📅 Date & Time:</strong> ${new Date(event.date).toDateString()} at ${event.time}</p>
            <p style="margin: 5px 0;"><strong>📍 Venue:</strong> ${event.venue}, ${event.city}</p>
            <p style="margin: 5px 0;"><strong>👥 Seats:</strong> ${booking.seats}</p>
            <p style="margin: 5px 0;"><strong>💳 Amount Paid:</strong> ₹${booking.totalAmount}</p>
            <p style="margin: 5px 0;"><strong>💳 Transaction ID:</strong> ${booking.transactionId}</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <p style="margin-bottom: 10px; color: #64748b;">Scan the QR code below at the event entrance:</p>
            <img src="${qrUrl}" alt="Ticket QR Code" style="border: 4px solid #f1f5f9; border-radius: 8px;" />
          </div>

          <p style="color: #64748b; font-size: 12px; text-align: center; margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 20px;">
            Thank you for booking with EventHub! Have a great time at the event.
          </p>
        </div>
      `,
    };

    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const info = await transporter.sendMail(mailOptions);
      console.log(`[Email] Ticket email sent to ${user.email} successfully. Message ID: ${info.messageId}`);
    } else {
      console.log("---------------- MOCK EMAIL DISPATCH ----------------");
      console.log(`To: ${user.email}`);
      console.log(`Subject: ${mailOptions.subject}`);
      console.log(`Ticket ID: ${booking.ticketId}`);
      console.log("-----------------------------------------------------");
    }
  } catch (err) {
    console.error("Failed to send ticket email:", err);
  }
};

module.exports = { sendTicketEmail };
