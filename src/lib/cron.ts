import cron from 'node-cron';
import { prisma } from './prisma';
import { processReminder, sendWhatsAppMessage } from './whatsapp';
import { startOfDay, addDays, subDays } from 'date-fns';

export const scheduleCronJobs = () => {
  // Morning Cron (9:00 AM): Day-of Reminders & Admin Summary
  cron.schedule('0 9 * * *', async () => {
    console.log('Running daily morning cron job...');
    try {
      const today = startOfDay(new Date());
      const tomorrow = addDays(today, 1);
      
      const dayOfBookings = await prisma.booking.findMany({
        where: {
          status: 'CONFIRMED',
          eventDate: {
            gte: today,
            lt: tomorrow
          },
          reminders: { none: { reminderType: 'DAY_OF', status: 'SENT' } }
        }
      });
      console.log(`Found ${dayOfBookings.length} DAY_OF reminders to process.`);
      for (const booking of dayOfBookings) {
        await sendWhatsAppMessage(booking.customerPhone, 'day_of_event_reminder', 'en');
        await prisma.reminder.create({
          data: { bookingId: booking.id, reminderType: 'DAY_OF', status: 'SENT', sentAt: new Date() }
        });
      }

      // Admin Daily Summary
      await sendWhatsAppMessage(process.env.ADMIN_WHATSAPP || '919000000000', 'admin_daily_summary', 'en');
    } catch (error) {
      console.error('Error in morning cron job:', error);
    }
  });

  // Evening Cron (10:00 PM): Tomorrow's Reminders
  cron.schedule('0 22 * * *', async () => {
    console.log('Running daily evening cron job...');
    try {
      const today = startOfDay(new Date());
      const tomorrow = addDays(today, 1);
      const dayAfter = addDays(tomorrow, 1);

      const oneDayBookings = await prisma.booking.findMany({
        where: {
          status: 'CONFIRMED',
          eventDate: {
            gte: tomorrow,
            lt: dayAfter
          },
          reminders: { none: { reminderType: 'ONE_DAY_BEFORE', status: 'SENT' } }
        }
      });
      console.log(`Found ${oneDayBookings.length} ONE_DAY_BEFORE reminders to process.`);
      for (const booking of oneDayBookings) {
        await sendWhatsAppMessage(booking.customerPhone, 'one_day_before_reminder', 'en');
        await prisma.reminder.create({
          data: { bookingId: booking.id, reminderType: 'ONE_DAY_BEFORE', status: 'SENT', sentAt: new Date() }
        });
      }
    } catch (error) {
      console.error('Error in evening cron job:', error);
    }
  });
  
  console.log('Cron jobs scheduled.');
};
