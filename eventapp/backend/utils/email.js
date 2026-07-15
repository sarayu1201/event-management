const nodemailer = require("nodemailer");
const AttendeeTicket = require("../models/AttendeeTicket");

const sendTicketEmail = async (booking) => {
  try {
    const user = booking.user;
    const event = booking.event;
    
    if (!user || !user.email) {
      console.warn("Cannot send ticket email: user or email is missing", booking);
      return;
    }

    // Fetch individual tickets for each attendee in the booking group
    const tickets = await AttendeeTicket.find({ booking: booking._id });

    const themeColor = event.ticketThemeColor || "#4f46e5";
    const headerImgHtml = event.ticketHeaderImage 
      ? `<div style="text-align: center; margin-bottom: 20px;"><img src="${event.ticketHeaderImage}" style="max-width: 100%; border-radius: 6px; max-height: 140px; object-fit: cover;" alt="Event Header" /></div>`
      : "";
    const instructionsHtml = event.ticketInstructions 
      ? `<p style="margin: 5px 0; color: #ef4444;"><strong>⚠️ Instructions:</strong> ${event.ticketInstructions}</p>`
      : "";

    // Generate HTML for each individual attendee ticket and QR code
    let ticketsHtml = "";
    if (tickets && tickets.length > 0) {
      ticketsHtml = tickets.map((t, idx) => {
        const ticketQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${t.qrCodeToken}`;
        return `
          <div style="border: 1px solid #cbd5e1; border-radius: 8px; padding: 15px; margin-bottom: 20px; background-color: #f8fafc; text-align: center;">
            <h4 style="margin: 0 0 10px 0; color: ${themeColor}; font-size: 15px;">Ticket #${idx + 1} (${t.ticketTypeName || "General"})</h4>
            <p style="margin: 3px 0; font-size: 14px;"><strong>Guest Name:</strong> ${t.attendeeName}</p>
            <p style="margin: 3px 0; font-size: 14px;"><strong>Ticket ID:</strong> <span style="font-family: monospace; font-weight: bold; color: ${themeColor};">${t.ticketId}</span></p>
            ${t.assignedSeat ? `<p style="margin: 3px 0; font-size: 14px;"><strong>Seat:</strong> ${t.assignedSeat}</p>` : ""}
            <div style="margin-top: 15px;">
              <img src="${ticketQrUrl}" alt="Ticket QR Code" style="border: 4px solid #ffffff; border-radius: 6px; width: 140px; height: 140px;" />
            </div>
          </div>
        `;
      }).join("");
    } else {
      // Fallback to a single booking QR code if no individual tickets exist
      const defaultQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${booking.ticketId}`;
      ticketsHtml = `
        <div style="border: 1px solid #cbd5e1; border-radius: 8px; padding: 15px; background-color: #f8fafc; text-align: center;">
          <p style="margin: 5px 0;"><strong>Ticket ID:</strong> <span style="font-family: monospace; font-size: 16px; color: ${themeColor}; font-weight: bold;">${booking.ticketId}</span></p>
          <div style="margin-top: 15px;">
            <img src="${defaultQrUrl}" alt="Ticket QR Code" style="border: 4px solid #ffffff; border-radius: 6px;" />
          </div>
        </div>
      `;
    }

    const mailOptions = {
      from: process.env.SMTP_FROM || `"EventHub Tickets" <no-reply@eventhub.com>`,
      to: user.email,
      subject: `Your Tickets are Confirmed! - ${event.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff; color: #1e293b;">
          ${headerImgHtml}
          <h2 style="color: ${themeColor}; text-align: center;">Booking Confirmed! 🎉</h2>
          <p>Hi ${user.name || "Customer"},</p>
          <p>Your tickets have been successfully booked. Below are the details for your booking and the individual QR entry tickets for each guest.</p>
          
          <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 6px; padding: 15px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>🎫 Order ID:</strong> <span style="font-family: monospace; font-size: 16px; color: ${themeColor}; font-weight: bold;">${booking.ticketId}</span></p>
            <p style="margin: 5px 0;"><strong>🎉 Event:</strong> ${event.title}</p>
            <p style="margin: 5px 0;"><strong>📅 Date & Time:</strong> ${new Date(event.date).toDateString()} at ${event.time}</p>
            <p style="margin: 5px 0;"><strong>📍 Venue:</strong> ${event.venue}, ${event.city}</p>
            <p style="margin: 5px 0;"><strong>👥 Seats Booked:</strong> ${booking.seats}</p>
            <p style="margin: 5px 0;"><strong>💳 Amount Paid:</strong> ₹${booking.totalAmount}</p>
            <p style="margin: 5px 0;"><strong>💳 Transaction ID:</strong> ${booking.transactionId || "N/A"}</p>
            ${instructionsHtml}
          </div>

          <h3 style="color: #334155; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-top: 30px;">Your Entry Tickets</h3>
          <div style="margin-top: 15px;">
            ${ticketsHtml}
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
