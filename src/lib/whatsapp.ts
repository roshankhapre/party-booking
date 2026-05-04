import { prisma } from './prisma'

const WHATSAPP_API_TOKEN = process.env.WHATSAPP_API_TOKEN
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID

export function getMessageContent(reminderType: string, b: any) {
  const dateStr = new Date(b.eventDate).toLocaleDateString('en-IN')
  const reviewLink = process.env.NEXTAUTH_URL ? `${process.env.NEXTAUTH_URL}` : 'https://g.page/r/...'

  switch (reminderType) {
    case 'BOOKING_CONFIRMATION':
      return `🎉 बुकिंग कन्फर्म! | Booking Confirmed!
नमस्ते ${b.customerName} जी,
आपकी बुकिंग कन्फर्म हो गई है।
📋 Booking Code: ${b.bookingCode}
🎊 Party Type: ${b.partyType.replace('_', ' ')}
📅 Date: ${dateStr}
⏰ Time: ${b.eventTimeSlot}
👥 Members: ${b.memberCount}
💰 Advance Paid: ₹${b.advanceAmount}
💳 Balance Due: ₹${b.balanceAmount || (Number(b.totalAmount || 0) - Number(b.advanceAmount || 0))}
📍 Darshan's Cafe & Restaurant, Indore
किसी भी जानकारी के लिए संपर्क करें।`

    case 'THREE_DAYS_BEFORE':
      return `⏰ Reminder | याद दिलाना
नमस्ते ${b.customerName} जी,
आपकी पार्टी 3 दिन बाद है!
📅 Date: ${dateStr} | Time: ${b.eventTimeSlot}
👥 Members: ${b.memberCount}
💳 Balance Due: ₹${b.balanceAmount || (Number(b.totalAmount || 0) - Number(b.advanceAmount || 0))}
हम आपका इंतज़ार कर रहे हैं! 🎉`

    case 'ONE_DAY_BEFORE':
      return `🌟 कल है आपकी पार्टी! | Party Tomorrow!
नमस्ते ${b.customerName} जी,
कल आपकी पार्टी है, हम तैयार हैं!
📅 ${dateStr} | ⏰ ${b.eventTimeSlot}
📍 Darshan's Cafe, Indore`

    case 'DAY_OF':
      return `🎊 आज है आपकी पार्टी! | Party Today!
नमस्ते ${b.customerName} जी,
आज आपकी पार्टी है! हम आपका स्वागत करते हैं।
⏰ Time: ${b.eventTimeSlot}
📍 Darshan's Cafe & Restaurant, Indore
मिलते हैं! 😊`

    case 'THANK_YOU':
      return `🙏 धन्यवाद! | Thank You!
नमस्ते ${b.customerName} जी,
Darshan's Cafe में आने के लिए बहुत धन्यवाद!
आपकी पार्टी हमारे लिए खास थी।
अगली बार फिर आइए! ❤️
Google पर Review दें: ${reviewLink}`

    case 'ADMIN_DAILY_SUMMARY':
      const eventList = b.bookings && b.bookings.length > 0 
        ? b.bookings.map((booking: any) => `- ${booking.customerName} (${booking.partyType.replace('_', ' ')}) @ ${booking.eventTimeSlot}`).join('\n')
        : 'आज कोई बुकिंग नहीं है। (No bookings today)';

      return `📊 Darshan's Daily Report
दिनांक: ${dateStr}

आज की बुकिंग: ${b.count || 0}
आज की कमाई: ₹${b.earnings || 0}

आज के कार्यक्रम:
${eventList}

Darshan's Cafe & Restaurant, Indore`;

    case 'NEW_BOOKING_ALERT':
      return `🚨 New Booking Received!
Name: ${b.customerName}
Phone: ${b.customerPhone}
Date: ${dateStr}
Type: ${b.partyType.replace('_', ' ')}
Guests: ${b.memberCount}
Code: ${b.bookingCode}`;

    default:
      return ''
  }
}

export async function sendWhatsAppMessage(to: string, templateName: string, languageCode: 'en' | 'hi' = 'en', components: any[] = [], messageContent?: string) {
  if (WHATSAPP_API_TOKEN === 'MOCK_TOKEN' || !WHATSAPP_API_TOKEN) {
    console.log(`\n========== MOCK WHATSAPP MESSAGE ==========`)
    console.log(`To: ${to}`)
    console.log(`Template: ${templateName} (${languageCode})`)
    if (messageContent) console.log(`\n${messageContent}`)
    console.log(`===========================================\n`)
    
    return { success: true, messageId: 'mock-id-' + Date.now(), content: messageContent, mode: 'MOCK' }
  }

  // Real API integration
  try {
    const response = await fetch(`https://graph.facebook.com/v17.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template: {
          name: templateName,
          language: { code: languageCode },
          components
        }
      })
    })

    if (!response.ok) {
      const err = await response.json()
      console.error('WhatsApp API error:', err)
      return { success: false, error: err }
    }

    const data = await response.json()
    return { success: true, messageId: data.messages[0].id, content: messageContent, mode: 'REAL' }
  } catch (error) {
    console.error('Failed to send WhatsApp message:', error)
    return { success: false, error }
  }
}

export async function scheduleRemindersForBooking(bookingId: string) {
  await prisma.reminder.createMany({
    data: [
      { bookingId, reminderType: 'BOOKING_CONFIRMATION', channel: 'WHATSAPP' },
      { bookingId, reminderType: 'THREE_DAYS_BEFORE', channel: 'WHATSAPP' },
      { bookingId, reminderType: 'ONE_DAY_BEFORE', channel: 'WHATSAPP' },
      { bookingId, reminderType: 'DAY_OF', channel: 'WHATSAPP' },
      { bookingId, reminderType: 'THANK_YOU', channel: 'WHATSAPP' },
    ]
  })
}

export async function processReminder(reminderId: string) {
  const reminder = await prisma.reminder.findUnique({
    where: { id: reminderId },
    include: { booking: { include: { package: true } } }
  })

  if (!reminder) return { success: false, error: 'Reminder not found' }

  const b = reminder.booking
  let templateName = reminder.reminderType.toLowerCase()
  const content = getMessageContent(reminder.reminderType, b)

  // In a real setup, components would be derived from b properties
  const result = await sendWhatsAppMessage(b.customerPhone, templateName, 'hi', [], content)

  await prisma.reminder.update({
    where: { id: reminderId },
    data: {
      status: result.success ? (result.mode === 'MOCK' ? 'MOCK_SENT' : 'SENT') : 'FAILED',
      sentAt: result.success ? new Date() : null,
      messageContent: result.success ? content : null
    }
  })

  return result
}
