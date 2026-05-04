import cron from 'node-cron';
import { prisma } from './prisma';
import { processReminder } from './whatsapp';

// Run every day at 10:00 AM
export const scheduleCronJobs = () => {
  cron.schedule('0 10 * * *', async () => {
    console.log('Running daily reminder cron job...');
    
    try {
      // Find all pending reminders that are scheduled for today or earlier
      // E.g., for 'ONE_DAY_BEFORE', find bookings where eventDate is tomorrow.
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const nextDay = new Date(tomorrow);
      nextDay.setDate(nextDay.getDate() + 1);

      const reminders = await prisma.reminder.findMany({
        where: {
          status: 'PENDING',
          reminderType: 'ONE_DAY_BEFORE',
          booking: {
            eventDate: {
              gte: tomorrow,
              lt: nextDay
            }
          }
        }
      });

      console.log(`Found ${reminders.length} ONE_DAY_BEFORE reminders to process.`);

      for (const reminder of reminders) {
        await processReminder(reminder.id);
      }
      
      // We can add logic for DAY_OF, THREE_DAYS_BEFORE, THANK_YOU, etc.
      
    } catch (error) {
      console.error('Error in cron job:', error);
    }
  });
  
  console.log('Cron jobs scheduled.');
};
