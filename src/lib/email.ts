import nodemailer from 'nodemailer';
import { formatINR } from './utils';

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

export async function sendBillEmail(email: string, booking: any) {
  if (!email || !process.env.GMAIL_USER) return;

  let parsedRequests: any = {}
  try {
    parsedRequests = JSON.parse(booking.specialRequests || "{}")
  } catch (e) {}

  const isPackage = booking.bookingType === 'PACKAGE'
  const packageAmount = isPackage ? (booking.package?.flatPrice ? Number(booking.package.flatPrice) : Number(booking.memberCount) * Number(booking.package?.pricePerHead || 0)) : 0
  const hallCharge = isPackage ? Number(booking.extraHallCharge || 0) : 0
  const buffetCharge = isPackage ? Number(booking.extraBuffetCharge || 0) : 0

  const subtotal = packageAmount + hallCharge + buffetCharge
  const gst = isPackage ? (subtotal * 0.05) : 0
  const grandTotal = isPackage ? (subtotal + gst) : Number(booking.advanceAmount)
  const advancePaid = Number(booking.advanceAmount)
  const balanceDue = isPackage ? (grandTotal - advancePaid) : 0

  const eventDateStr = new Date(booking.eventDate).toLocaleDateString('en-IN')

  const content = `
    <p>Dear ${booking.customerName},</p>
    <p>Thank you for choosing <strong>K's Darshan Cafe & Restaurant</strong>. Please find the details of your booking and receipt below:</p>
    
    <div style="border: 1px solid #333; padding: 15px; border-radius: 8px; margin-top: 20px;">
      <h3 style="color: #d4af37; margin-top: 0; border-bottom: 1px solid #333; padding-bottom: 8px;">Booking Information</h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr><td style="padding: 6px 0; color: #888;">Booking Code:</td><td style="padding: 6px 0; text-align: right; font-weight: bold;">${booking.bookingCode}</td></tr>
        <tr><td style="padding: 6px 0; color: #888;">Party Type:</td><td style="padding: 6px 0; text-align: right;">${booking.partyType.replace(/_/g, ' ')}</td></tr>
        <tr><td style="padding: 6px 0; color: #888;">Event Date:</td><td style="padding: 6px 0; text-align: right;">${eventDateStr}</td></tr>
        <tr><td style="padding: 6px 0; color: #888;">Time Slot:</td><td style="padding: 6px 0; text-align: right;">${booking.eventTimeSlot.replace(/_/g, ' ')}</td></tr>
        <tr><td style="padding: 6px 0; color: #888;">Members Count:</td><td style="padding: 6px 0; text-align: right;">${booking.memberCount} guests</td></tr>
        <tr><td style="padding: 6px 0; color: #888;">Venue:</td><td style="padding: 6px 0; text-align: right;">${parsedRequests.venue || 'Rooftop'}</td></tr>
      </table>
    </div>

    ${isPackage ? `
    <div style="border: 1px solid #333; padding: 15px; border-radius: 8px; margin-top: 20px;">
      <h3 style="color: #d4af37; margin-top: 0; border-bottom: 1px solid #333; padding-bottom: 8px;">Package & Food Selections</h3>
      <p style="margin: 5px 0;"><strong>Package:</strong> ${booking.package?.name || 'Custom'}</p>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-top: 10px;">
        <tr><td style="padding: 4px 0; color: #888;">Welcome Drink:</td><td style="padding: 4px 0; text-align: right;">${parsedRequests.welcomeDrink || 'None'}</td></tr>
        <tr><td style="padding: 4px 0; color: #888;">Starter:</td><td style="padding: 4px 0; text-align: right;">${parsedRequests.starter || 'None'}</td></tr>
        <tr><td style="padding: 4px 0; color: #888;">Paneer Sabji:</td><td style="padding: 4px 0; text-align: right;">${parsedRequests.paneerVeg || 'None'}</td></tr>
        <tr><td style="padding: 4px 0; color: #888;">Seasonal Veg:</td><td style="padding: 4px 0; text-align: right;">${parsedRequests.seasonalVeg || 'None'}</td></tr>
        <tr><td style="padding: 4px 0; color: #888;">Dal:</td><td style="padding: 4px 0; text-align: right;">${parsedRequests.dal || 'None'}</td></tr>
        <tr><td style="padding: 4px 0; color: #888;">Sweet:</td><td style="padding: 4px 0; text-align: right;">${parsedRequests.sweet || 'None'}</td></tr>
      </table>
    </div>
    ` : ''}

    <div style="border: 1px solid #333; padding: 15px; border-radius: 8px; margin-top: 20px;">
      <h3 style="color: #d4af37; margin-top: 0; border-bottom: 1px solid #333; padding-bottom: 8px;">Billing Details</h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr><td style="padding: 6px 0; color: #888;">Package Amount:</td><td style="padding: 6px 0; text-align: right;">${formatINR(packageAmount)}</td></tr>
        <tr><td style="padding: 6px 0; color: #888;">Hall Charge:</td><td style="padding: 6px 0; text-align: right;">${formatINR(hallCharge)}</td></tr>
        <tr><td style="padding: 6px 0; color: #888;">Buffet Charge:</td><td style="padding: 6px 0; text-align: right;">${formatINR(buffetCharge)}</td></tr>
        <tr><td style="padding: 6px 0; color: #888; border-top: 1px solid #333;">GST (5%):</td><td style="padding: 6px 0; text-align: right; border-top: 1px solid #333;">${formatINR(gst)}</td></tr>
        <tr style="font-weight: bold; color: #d4af37;"><td style="padding: 8px 0; border-top: 2px solid #d4af37;">GRAND TOTAL:</td><td style="padding: 8px 0; text-align: right; border-top: 2px solid #d4af37;">${formatINR(grandTotal)}</td></tr>
        <tr><td style="padding: 6px 0; color: #888; border-top: 1px solid #333;">Advance Paid:</td><td style="padding: 6px 0; text-align: right; border-top: 1px solid #333; color: #5cb85c;">${formatINR(advancePaid)}</td></tr>
        <tr style="font-weight: bold; font-size: 16px;"><td style="padding: 8px 0; border-top: 1px solid #333;">BALANCE DUE:</td><td style="padding: 8px 0; text-align: right; border-top: 1px solid #333; color: #d9534f;">${formatINR(balanceDue)}</td></tr>
      </table>
    </div>

    <div style="margin-top: 20px; font-size: 12px; color: #888; line-height: 1.5;">
      <p style="margin: 0 0 5px 0;"><strong>Terms & Conditions:</strong></p>
      <ul style="margin: 0; padding-left: 15px;">
        <li>Advance payment is non-refundable.</li>
        <li>Outside food is not allowed.</li>
        <li>Event duration is 3 hours. Extra ₹1000/hour after that.</li>
        <li>No alcoholic drinks or smoking allowed on premises.</li>
      </ul>
    </div>
  `;

  await transporter.sendMail({
    from: `"K's Darshan Cafe & Restaurant" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: `Booking Bill Receipt - ${booking.bookingCode}`,
    html: generateEmailTemplate('Booking Bill Receipt', content)
  });
}

