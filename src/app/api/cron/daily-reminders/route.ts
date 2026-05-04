import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendWhatsAppMessage } from '@/lib/whatsapp'
import { startOfDay, addDays, subDays } from 'date-fns'

export async function GET(request: Request) {
  // To protect this endpoint, Vercel provides a CRON_SECRET headers
  // For local mocking, we will just allow it if not set
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const today = startOfDay(new Date())
  const tomorrow = addDays(today, 1)
  const threeDaysFromNow = addDays(today, 3)
  const yesterday = subDays(today, 1)

  let messagesSent = 0

  // 1. Send "1 Day Before" Reminder
  const oneDayBookings = await prisma.booking.findMany({
    where: {
      status: 'CONFIRMED',
      eventDate: {
        gte: tomorrow,
        lt: addDays(tomorrow, 1)
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

  // 2. Send "Day of" Reminder
  const dayOfBookings = await prisma.booking.findMany({
    where: {
      status: 'CONFIRMED',
      eventDate: {
        gte: today,
        lt: tomorrow
      },
      reminders: { none: { reminderType: 'DAY_OF', status: 'SENT' } }
    }
  })

  for (const b of dayOfBookings) {
    await sendWhatsAppMessage(b.customerPhone, 'day_of_event_reminder', 'en')
    await prisma.reminder.create({
      data: {
        bookingId: b.id,
        reminderType: 'DAY_OF',
        status: 'SENT',
        sentAt: new Date()
      }
    })
    messagesSent++
  }

  // 3. Send "Thank You" 1 Day After
  const thankYouBookings = await prisma.booking.findMany({
    where: {
      status: 'COMPLETED',
      eventDate: {
        gte: yesterday,
        lt: today
      },
      reminders: { none: { reminderType: 'THANK_YOU', status: 'SENT' } }
    }
  })

  for (const b of thankYouBookings) {
    await sendWhatsAppMessage(b.customerPhone, 'thank_you_post_event', 'en')
    await prisma.reminder.create({
      data: {
        bookingId: b.id,
        reminderType: 'THANK_YOU',
        status: 'SENT',
        sentAt: new Date()
      }
    })
    messagesSent++
  }

  return NextResponse.json({ success: true, processed: messagesSent })
}
