import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (process.env.PETPOOJA_WEBHOOK_SECRET && authHeader !== `Bearer ${process.env.PETPOOJA_WEBHOOK_SECRET}`) {
      return new Response('Unauthorized', { status: 401 })
    }

    const data = await request.json()
    // Expected Petpooja payload structure (mock)
    // { bookingCode: 'AG-2025-002', totalBillAmount: 5000, status: 'COMPLETED' }
    
    if (!data.bookingCode || data.totalBillAmount == null) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const booking = await prisma.booking.findUnique({
      where: { bookingCode: data.bookingCode }
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    const totalAmount = Number(data.totalBillAmount)
    const balanceAmount = totalAmount - Number(booking.advanceAmount)

    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        totalAmount,
        balanceAmount,
        status: data.status === 'COMPLETED' ? 'COMPLETED' : booking.status
      }
    })

    return NextResponse.json({ success: true, bookingCode: booking.bookingCode, newTotal: totalAmount })
  } catch (err) {
    console.error('Petpooja webhook error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
