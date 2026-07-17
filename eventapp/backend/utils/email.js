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

    const themeColor = event.ticketThemeColor || "#7c3aed";
    
    // Construct Google Calendar Link
    let datesParam = "";
    try {
      const d = new Date(event.date);
      const start = d.toISOString().replace(/-|:|\.\d\d\d/g, "");
      const dEnd = new Date(d.getTime() + 3 * 60 * 60 * 1000); // Default 3 hours event duration
      const end = dEnd.toISOString().replace(/-|:|\.\d\d\d/g, "");
      datesParam = `${start}/${end}`;
    } catch (e) {
      datesParam = "";
    }
    
    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${datesParam}&details=${encodeURIComponent(event.ticketInstructions || "Your digital tickets with QR codes for entry.")}&location=${encodeURIComponent(event.venue + ", " + event.city)}`;

    const headerImgHtml = event.ticketHeaderImage 
      ? `<div style="text-align: center; margin-bottom: 20px;"><img src="${event.ticketHeaderImage}" style="max-width: 100%; border-radius: 8px; max-height: 140px; object-fit: cover;" alt="Event Header" /></div>`
      : "";

    // Generate HTML for each individual attendee ticket and QR code matching premium card design
    let ticketsHtml = "";
    if (tickets && tickets.length > 0) {
      ticketsHtml = tickets.map((t, idx) => {
        const ticketQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${t.qrCodeToken}`;
        return `
          <div style="border: 2px dashed #bfdbfe; border-radius: 12px; padding: 20px; margin-bottom: 20px; background-color: #ffffff; text-align: center;">
            <h4 style="margin: 0 0 5px 0; color: ${themeColor}; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: bold;">🎫 Ticket ${idx + 1}</h4>
            <p style="margin: 0 0 12px 0; font-size: 14px; color: #475569;">Guest: <strong>${t.attendeeName || user.name}</strong></p>
            <div style="display: inline-block; background-color: #3b82f6; color: #ffffff; font-family: monospace; font-size: 16px; font-weight: bold; padding: 6px 24px; border-radius: 20px; margin-bottom: 15px; letter-spacing: 1px;">
              ${t.ticketId}
            </div>
            <div style="margin: 10px 0;">
              <img src="${ticketQrUrl}" alt="Ticket QR Code" style="border: 4px solid #ffffff; width: 140px; height: 140px; display: inline-block;" />
            </div>
            <p style="margin: 8px 0 0 0; font-size: 12px; color: #64748b;">Show this QR code at the venue entrance</p>
          </div>
        `;
      }).join("");
    } else {
      // Fallback to a single booking QR code if no individual tickets exist
      const defaultQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${booking.ticketId}`;
      ticketsHtml = `
        <div style="border: 2px dashed #bfdbfe; border-radius: 12px; padding: 20px; background-color: #ffffff; text-align: center;">
          <div style="display: inline-block; background-color: #3b82f6; color: #ffffff; font-family: monospace; font-size: 16px; font-weight: bold; padding: 6px 24px; border-radius: 20px; margin-bottom: 15px; letter-spacing: 1px;">
            ${booking.ticketId}
          </div>
          <div style="margin: 10px 0;">
            <img src="${defaultQrUrl}" alt="Ticket QR Code" style="border: 4px solid #ffffff; width: 140px; height: 140px; display: inline-block;" />
          </div>
          <p style="margin: 8px 0 0 0; font-size: 12px; color: #64748b;">Show this QR code at the venue entrance</p>
        </div>
      `;
    }

    const mailOptions = {
      from: process.env.SMTP_FROM || `"EventHub Tickets" <no-reply@eventhub.com>`,
      to: user.email,
      subject: `Your ${event.title} Tickets - QR Codes & Calendar Event Ready! 🎫`,
      html: `
        <div style="background-color: #f3f4f6; padding: 20px 10px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); border: 1px solid #e5e7eb;">
            
            <!-- Custom Purple/Theme Header Band -->
            <div style="background: linear-gradient(135deg, ${themeColor} 0%, #4c1d95 100%); padding: 30px 20px; text-align: center; color: #ffffff;">
              <h2 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 0.5px;">🎉 ${event.title} - ${event.venue}</h2>
              <div style="font-size: 13px; opacity: 0.9; margin-top: 6px; text-transform: uppercase; letter-spacing: 1px; font-weight: bold;">Your Digital Tickets with QR Codes</div>
            </div>

            <div style="padding: 24px;">
              ${headerImgHtml}
              
              <!-- Payment Verified Welcome Box -->
              <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
                <h4 style="color: #166534; font-size: 14px; font-weight: bold; margin: 0 0 4px 0;">✅ Payment Verified! Welcome to ${event.title}!</h4>
                <p style="color: #1e3a1e; font-size: 13px; margin: 0; line-height: 1.5;">Hi <strong>${user.name || "Customer"}</strong>, your payment has been successfully verified. Here are your digital tickets with QR codes!</p>
              </div>

              <!-- Add to Calendar Box -->
              <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 20px; margin-bottom: 24px; text-align: center;">
                <h4 style="color: #1e3a8a; font-size: 14px; font-weight: bold; margin: 0 0 8px 0;">📅 Add to Your Calendar</h4>
                <p style="color: #1e40af; font-size: 14px; font-weight: bold; margin: 0 0 4px 0;">${event.title} — ${new Date(event.date).toDateString()}, ${event.time}</p>
                <p style="color: #2563eb; font-size: 13px; margin: 0 0 16px 0;">${event.venue} (${event.city})</p>
                <a href="${calendarUrl}" target="_blank" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 10px 24px; border-radius: 24px; font-size: 13px; font-weight: bold; box-shadow: 0 2px 4px rgba(37, 99, 235, 0.25);">📅 Add to Google Calendar</a>
                <p style="color: #64748b; font-size: 11px; margin: 12px 0 0 0; line-height: 1.4;">Click the button above to automatically add the event to your Google Calendar with all your booking details!</p>
              </div>

              <!-- Order Summary List -->
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin-bottom: 24px; font-size: 13px; color: #334155; line-height: 1.6;">
                <ul style="margin: 0; padding-left: 15px; list-style-type: square;">
                  <li><strong>Total Tickets:</strong> ${booking.seats}</li>
                  <li><strong>Total Amount:</strong> ₹${booking.totalAmount}</li>
                  <li><strong>Contact:</strong> ${user.phone || "N/A"}</li>
                </ul>
              </div>

              <!-- Digital Tickets Grid -->
              <h3 style="font-size: 15px; font-weight: bold; color: #1e293b; margin: 0 0 16px 0; text-align: center; text-transform: uppercase; letter-spacing: 0.5px;">🎫 Your Digital Tickets</h3>
              <div>
                ${ticketsHtml}
              </div>

              <!-- Important Instructions -->
              <div style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 15px; margin-top: 24px; font-size: 13px; color: #451a03; line-height: 1.6;">
                <h4 style="color: #b45309; font-size: 13px; font-weight: bold; margin: 0 0 8px 0;">⚠️ Important Instructions:</h4>
                <ul style="margin: 0; padding-left: 15px; list-style-type: none;">
                  <li style="margin-bottom: 5px;">💾 <strong>Save these QR codes</strong> - required for venue entry</li>
                  <li style="margin-bottom: 5px;">👥 <strong>Each person needs their own ticket</strong> - don't share QR codes</li>
                  <li style="margin-bottom: 5px;">📱 <strong>Print or screenshot</strong> - ensure QR codes are clearly visible</li>
                  <li style="margin-bottom: 5px;">🆔 <strong>Bring valid ID</strong> - may be required at the venue</li>
                  <li style="margin-bottom: 0;">📅 <strong>Add to calendar</strong> - don't miss the event!</li>
                </ul>
              </div>

            </div>

            <!-- Footer Details -->
            <div style="background-color: #f8fafc; border-top: 1px solid #e5e7eb; padding: 24px 20px; text-align: center; font-size: 12px; color: #64748b; line-height: 1.6;">
              <p style="margin: 0 0 8px 0;">Questions? Contact us at <a href="mailto:telugunight@aashveetech.com" style="color: #2563eb; text-decoration: none;">telugunight@aashveetech.com</a> | <a href="tel:+916281614117" style="color: #2563eb; text-decoration: none;">+91 6281614117</a></p>
              <p style="margin: 0 0 12px 0; font-weight: bold;">${event.title} - The Ultimate DJ Experience at ${event.venue}</p>
              <p style="margin: 0;"><a href="${calendarUrl}" target="_blank" style="color: #2563eb; text-decoration: none; font-weight: bold;">📅 Add Event to Google Calendar</a></p>
            </div>

          </div>
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
        tls: {
          rejectUnauthorized: false
        }
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
