import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  }
});

const generateEmailTemplate = (title: string, content: string) => `
  <div style="background-color: #1a1a1a; color: #ffffff; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px 20px;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #262626; border-radius: 12px; overflow: hidden; border: 1px solid #d4af37;">
      <div style="background-color: #d4af37; padding: 20px; text-align: center;">
        <h1 style="color: #1a1a1a; margin: 0; font-size: 24px; font-weight: bold;">Darshan's Cafe & Restaurant</h1>
      </div>
      <div style="padding: 30px;">
        <h2 style="color: #d4af37; margin-top: 0;">${title}</h2>
        <div style="color: #e5e5e5; font-size: 16px; line-height: 1.6;">
          ${content}
        </div>
      </div>
      <div style="background-color: #111111; padding: 15px; text-align: center; color: #888888; font-size: 14px;">
        <p style="margin: 0;">&copy; ${new Date().getFullYear()} Darshan's Cafe & Restaurant. All rights reserved.</p>
      </div>
    </div>
  </div>
`;

export async function sendBookingConfirmationEmail(email: string, booking: any) {
  if (!email || !process.env.GMAIL_USER) return;
  
  const content = `
    <p>Dear ${booking.customerName},</p>
    <p>Thank you for choosing Darshan's Cafe & Restaurant for your event. Your booking has been received and is currently <strong>${booking.status}</strong>.</p>
    <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
      <tr><td style="padding: 8px 0; border-bottom: 1px solid #333;"><strong>Booking Code:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #333; text-align: right;">${booking.bookingCode}</td></tr>
      <tr><td style="padding: 8px 0; border-bottom: 1px solid #333;"><strong>Event Date:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #333; text-align: right;">${new Date(booking.eventDate).toLocaleDateString()}</td></tr>
      <tr><td style="padding: 8px 0; border-bottom: 1px solid #333;"><strong>Time Slot:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #333; text-align: right;">${booking.eventTimeSlot}</td></tr>
      <tr><td style="padding: 8px 0; border-bottom: 1px solid #333;"><strong>Guests:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #333; text-align: right;">${booking.memberCount}</td></tr>
    </table>
    <p style="margin-top: 20px;">If you have any questions, please contact us on WhatsApp.</p>
  `;

  await transporter.sendMail({
    from: `"Darshan's Party Booking" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: `Booking Confirmation - ${booking.bookingCode}`,
    html: generateEmailTemplate('Booking Received', content)
  });
}

export async function sendAdminNewBookingEmail(booking: any) {
  if (!process.env.GMAIL_USER) return;
  
  const content = `
    <p>A new booking has been created.</p>
    <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
      <tr><td style="padding: 8px 0; border-bottom: 1px solid #333;"><strong>Code:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #333; text-align: right;">${booking.bookingCode}</td></tr>
      <tr><td style="padding: 8px 0; border-bottom: 1px solid #333;"><strong>Customer:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #333; text-align: right;">${booking.customerName}</td></tr>
      <tr><td style="padding: 8px 0; border-bottom: 1px solid #333;"><strong>Phone:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #333; text-align: right;">${booking.customerPhone}</td></tr>
      <tr><td style="padding: 8px 0; border-bottom: 1px solid #333;"><strong>Date:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #333; text-align: right;">${new Date(booking.eventDate).toLocaleDateString()}</td></tr>
    </table>
    <div style="margin-top: 20px; text-align: center;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/bookings/${booking.id}" style="background-color: #d4af37; color: #1a1a1a; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">View Booking</a>
    </div>
  `;

  await transporter.sendMail({
    from: `"System Alert" <${process.env.GMAIL_USER}>`,
    to: process.env.ADMIN_EMAIL || process.env.GMAIL_USER,
    subject: `New Booking Alert - ${booking.bookingCode}`,
    html: generateEmailTemplate('New Booking Notification', content)
  });
}
