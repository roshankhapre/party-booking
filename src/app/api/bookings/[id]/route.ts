import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: { package: true, payments: true, reminders: true }
    })
    
    if (!booking) {
      // maybe check bookingCode
      const bByCode = await prisma.booking.findUnique({
        where: { bookingCode: params.id },
        include: { package: true, payments: true, reminders: true }
      })
      if (!bByCode) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      return NextResponse.json({ booking: bByCode })
    }

    return NextResponse.json({ booking })
  } catch (err) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { status, totalAmount, balanceAmount } = body

    const data: any = {}
    if (status) data.status = status
    if (totalAmount !== undefined) data.totalAmount = totalAmount
    if (balanceAmount !== undefined) data.balanceAmount = balanceAmount

    const booking = await prisma.booking.update({
      where: { id: params.id },
      data
    })

    return NextResponse.json({ success: true, booking })
  } catch (err) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
