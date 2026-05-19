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
      pendingConfirmations,
      bookingsByPartyType,
      recentBookings,
      todaySchedule
    ] = await Promise.all([
      // 1. Total bookings this month
      prisma.booking.count({
        where: { eventDate: { gte: monthStart, lte: monthEnd }, status: { not: 'CANCELLED' } }
      }),
      // 2. Earnings this month
      prisma.booking.aggregate({
        where: { eventDate: { gte: monthStart, lte: monthEnd }, status: { in: ['CONFIRMED', 'COMPLETED'] } },
        _sum: { advanceAmount: true, totalAmount: true }
      }),
      // 3. Upcoming today
      prisma.booking.count({
        where: { eventDate: { gte: today, lt: addDays(today, 1) }, status: 'CONFIRMED' }
      }),
      // 4. Pending confirmations
      prisma.booking.count({
        where: { status: 'PENDING' }
      }),
      // 5. Bookings by Party Type
      prisma.booking.groupBy({
        by: ['partyType'],
        _count: { partyType: true },
        where: { eventDate: { gte: monthStart, lte: monthEnd }, status: { not: 'CANCELLED' } }
      }),
      // 6. Recent bookings
      prisma.booking.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5
      }),
      // 7. Today's schedule
      prisma.booking.findMany({
        where: { eventDate: { gte: today, lt: addDays(today, 1) }, status: { not: 'CANCELLED' } },
        orderBy: { eventDate: 'asc' },
        include: { package: true }
      })
    ])

    const totalEarnings = Number(totalEarningsMonth._sum.totalAmount || totalEarningsMonth._sum.advanceAmount || 0)

    const revenueTrendData = recentBookings.map(b => ({
      date: b.createdAt.toISOString().split('T')[0],
      amount: Number(b.totalAmount || b.advanceAmount || 0)
    })).reverse()

    return NextResponse.json({
      stats: {
        totalBookingsMonth,
        totalEarningsMonth: totalEarnings,
        upcomingToday,
        pendingConfirmations
      },
      chartData: bookingsByPartyType.map(b => ({ name: b.partyType, value: b._count.partyType })),
      revenueTrend: revenueTrendData,
      recentBookings,
      todaySchedule
    })
  } catch (err) {
    console.error('Admin Dashboard API Error:', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
