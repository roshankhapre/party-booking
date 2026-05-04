import { NextResponse } from 'next/server';
import { processReminder } from '@/lib/whatsapp';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { bookingId, reminderType } = await request.json();

    if (!bookingId) {
      return NextResponse.json({ error: 'bookingId is required' }, { status: 400 });
    }

    let reminder;

    if (reminderType) {
      reminder = await prisma.reminder.findFirst({
        where: {
          bookingId,
          reminderType,
        }
      });
      // create it if not found just to trigger it now
      if (!reminder) {
        reminder = await prisma.reminder.create({
          data: {
            bookingId,
            reminderType,
            channel: 'WHATSAPP',
            status: 'PENDING'
          }
        });
      }
    } else {
      // default: just take the first pending reminder
      reminder = await prisma.reminder.findFirst({
        where: {
          bookingId,
          status: 'PENDING'
        }
      });
    }

    if (!reminder) {
      return NextResponse.json({ error: 'No pending reminder found for this booking.' }, { status: 404 });
    }

    const result = await processReminder(reminder.id);

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error('Error in /api/reminders/send:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
