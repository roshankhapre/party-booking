import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { startOfMonth, endOfMonth, startOfDay, addDays } from 'date-fns'

export async function GET() {
  try {
    const today = startOfDay(new Date())
    const monthStart = startOfMonth(today)
    const monthEnd = endOfMonth(today)
    
    const [
      totalBookingsMonth,
      totalEarningsMonth,
      upcomingToday,
      upcomingTomorrow,
      bookingsByPartyType,
      recentBookings
    ] = await Promise.all([
      // 1. Total bookings this month
      prisma.booking.count({
        where: { eventDate: { gte: monthStart, lte: monthEnd }, status: { not: 'CANCELLED' } }
      }),
      // 2. Earnings this month (Sum of advance and balance paid if completed)
      prisma.booking.aggregate({
        where: { eventDate: { gte: monthStart, lte: monthEnd }, status: { in: ['CONFIRMED', 'COMPLETED'] } },
        _sum: { advanceAmount: true, totalAmount: true }
      }),
      // 3. Upcoming today
      prisma.booking.count({
        where: { eventDate: { gte: today, lt: addDays(today, 1) }, status: 'CONFIRMED' }
      }),
      // 4. Upcoming tomorrow
      prisma.booking.count({
        where: { eventDate: { gte: addDays(today, 1), lt: addDays(today, 2) }, status: 'CONFIRMED' }
      }),
      // 5. Bookings by Party Type (groupBy)
      prisma.booking.groupBy({
        by: ['partyType'],
        _count: { partyType: true },
        where: { eventDate: { gte: monthStart, lte: monthEnd } }
      }),
      // 6. Revenue trend - simplified to recent bookings
      prisma.booking.findMany({
        where: { status: { in: ['CONFIRMED', 'COMPLETED'] } },
        orderBy: { createdAt: 'desc' },
        take: 5
      })
    ])

    const totalEarnings = Number(totalEarningsMonth._sum.totalAmount || 0)

    const revenueTrendData = recentBookings.map(b => ({
      date: b.createdAt.toISOString().split('T')[0],
      amount: Number(b.totalAmount || b.advanceAmount || 0)
    })).reverse() // simplified trend

    return NextResponse.json({
      stats: {
        totalBookingsMonth,
        totalEarningsMonth: totalEarnings,
        upcomingToday,
        upcomingTomorrow
      },
      chartData: bookingsByPartyType.map(b => ({ name: b.partyType, value: b._count.partyType })),
      revenueTrend: revenueTrendData
    })
  } catch (err) {
    console.error('Admin Dashboard API Error:', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
