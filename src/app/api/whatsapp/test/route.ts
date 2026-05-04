import { NextResponse } from 'next/server'
import { getMessageContent, sendWhatsAppMessage } from '@/lib/whatsapp'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const { phone, name, templateType, action } = await req.json()

    // Create a mock booking for testing the template
    const mockBooking = {
      customerName: name || "Test User",
      customerPhone: phone || "9876543210",
      bookingCode: "TEST-1234",
      partyType: "BIRTHDAY",
      eventDate: new Date(Date.now() + 86400000 * 3), // 3 days from now
      eventTimeSlot: "EVENING",
      memberCount: 25,
      advanceAmount: 2000,
      totalAmount: 15000,
      balanceAmount: 13000
    }

    const content = getMessageContent(templateType, mockBooking)

    if (action === 'preview') {
      return NextResponse.json({ success: true, preview: content })
    }

    const token = process.env.WHATSAPP_API_TOKEN
    const isMock = !token || token === 'MOCK_TOKEN'

    let result
    if (isMock) {
      console.log(`\n========== MOCK WHATSAPP MESSAGE ==========`)
      console.log(`To: +91${mockBooking.customerPhone}`)
      console.log(`Template: ${templateType}`)
      console.log(`\n${content}`)
      console.log(`===========================================\n`)
      result = { success: true, mode: 'MOCK', content }
    } else {
      result = await sendWhatsAppMessage(`91${mockBooking.customerPhone}`, templateType.toLowerCase(), 'en', [], content)
      result.mode = 'REAL'
    }

    // Attempt to save to reminder table using a dummy or latest booking just to record the test log
    // For test purposes, we might not have a real booking. Let's create a temporary dummy booking to satisfy relation.
    // Or just look for any existing booking to attach this test log to, or don't save if there are no bookings.
    const anyBooking = await prisma.booking.findFirst()
    if (anyBooking) {
      await prisma.reminder.create({
        data: {
          bookingId: anyBooking.id,
          reminderType: templateType,
          status: isMock ? 'MOCK_SENT' : (result.success ? 'SENT' : 'FAILED'),
          channel: 'WHATSAPP',
          sentAt: new Date(),
          messageContent: content
        }
      })
    }

    return NextResponse.json({ success: true, message: content, mode: result.mode })
  } catch (error: any) {
    console.error('Test WhatsApp error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
