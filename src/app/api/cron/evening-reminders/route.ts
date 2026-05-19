import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendWhatsAppMessage } from '@/lib/whatsapp'
import { startOfDay, addDays } from 'date-fns'

export async function GET(request: Request) {
  // To protect this endpoint, Vercel provides a CRON_SECRET headers
  // For local mocking, we will just allow it if not set
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const today = startOfDay(new Date())
  const tomorrow = addDays(today, 1)
  const dayAfter = addDays(tomorrow, 1)

  let messagesSent = 0

  // 1. Send "1 Day Before" Reminder (Tomorrow's parties)
  const oneDayBookings = await prisma.booking.findMany({
    where: {
      status: 'CONFIRMED',
      eventDate: {
        gte: tomorrow,
        lt: dayAfter
      },
      reminders: { none: { reminderType: 'ONE_DAY_BEFORE', status: 'SENT' } }
    }
  })

  for (const b of oneDayBookings) {
    await sendWhatsAppMessage(b.customerPhone, 'one_day_before_reminder', 'en')
    await prisma.reminder.create({
      data: {
        bookingId: b.id,
        reminderType: 'ONE_DAY_BEFORE',
        status: 'SENT',
        sentAt: new Date()
      }
    })
    messagesSent++
  }

  return NextResponse.json({ success: true, processed: messagesSent })
}
