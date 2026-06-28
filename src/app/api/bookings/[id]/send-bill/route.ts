import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendWhatsAppMessage } from '@/lib/whatsapp'
import { sendBillEmail } from '@/lib/email'

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { method } = body

    if (method !== 'whatsapp' && method !== 'email') {
      return NextResponse.json({ error: 'Invalid send method. Use whatsapp or email.' }, { status: 400 })
    }

    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: { package: true }
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    let parsedRequests: any = {}
    try {
      parsedRequests = JSON.parse(booking.specialRequests || '{}')
    } catch (e) {}

    if (method === 'whatsapp') {
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

      const messageContent = `🧾 *BOOKING RECEIPT*
*K's Darshan Cafe & Restaurant*

Booking Code: *${booking.bookingCode}*
Party: ${booking.partyType.replace(/_/g, ' ')}
Date: ${eventDateStr}
Time: ${booking.eventTimeSlot.replace(/_/g, ' ')}
Members: ${booking.memberCount}

Package: ${booking.package?.name || 'Table Only'}
─────────────────
Package Amount: ₹${packageAmount}
Hall Charge: ₹${hallCharge}
Buffet Charge: ₹${buffetCharge}
GST (5%): ₹${gst.toFixed(2)}
*TOTAL: ₹${grandTotal.toFixed(2)}*
─────────────────
Advance Paid: ₹${advancePaid}
*Balance Due: ₹${balanceDue.toFixed(2)}*

Terms:
• Advance non-refundable
• Duration 3 hours
• No outside food

Thank you! 🙏
K's Darshan Cafe, Indore`

      const result = await sendWhatsAppMessage(booking.customerPhone, 'booking_bill', 'en', [], messageContent)
      if (!result.success) {
        return NextResponse.json({ error: 'Failed to send WhatsApp message' }, { status: 500 })
      }
      return NextResponse.json({ success: true, message: 'WhatsApp message sent successfully' })
    }

    if (method === 'email') {
      if (!booking.customerEmail) {
        return NextResponse.json({ error: 'Customer email was not provided for this booking' }, { status: 400 })
      }

      await sendBillEmail(booking.customerEmail, booking)
      return NextResponse.json({ success: true, message: 'Email sent successfully' })
    }

    return NextResponse.json({ error: 'Unknown error' }, { status: 500 })
  } catch (error: any) {
    console.error('Send bill error:', error)
    return NextResponse.json({ error: error.message || 'Failed to send bill' }, { status: 500 })
  }
}
