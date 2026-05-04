import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calculateBookingPrice } from '@/lib/bookingLogic'
import { scheduleRemindersForBooking, processReminder, sendWhatsAppMessage, getMessageContent } from '@/lib/whatsapp'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      customerName,
      customerPhone,
      customerEmail,
      partyType,
      bookingType,
      eventDate,
      eventTimeSlot,
      memberCount,
      packageId,
      isFullHall,
      buffetRequested,
      specialRequests,
      status,
      advanceAmount: reqAdvance,
      totalAmount: reqTotal,
      balanceAmount: reqBalance,
      extraHallCharge: reqExtraHall,
      extraBuffetCharge: reqExtraBuffet
    } = body

    // Calculate Pricing
    let advanceAmount = reqAdvance !== undefined ? Number(reqAdvance) : Number(process.env.NEXT_PUBLIC_DEFAULT_ADVANCE || 2000)
    let totalAmount = reqTotal !== undefined ? Number(reqTotal) : null
    let balanceAmount = reqBalance !== undefined ? Number(reqBalance) : null

    let extraHallCharge = reqExtraHall !== undefined ? Number(reqExtraHall) : 0
    let extraBuffetCharge = reqExtraBuffet !== undefined ? Number(reqExtraBuffet) : 0
    let isFullHallRequested = isFullHall || Number(memberCount) >= 40

    if (bookingType === 'PACKAGE') {
      const pkg = await prisma.package.findUnique({ where: { id: packageId } })
      if (!pkg) return NextResponse.json({ error: 'Package not found' }, { status: 400 })

      const pricing = calculateBookingPrice({
        bookingType,
        memberCount: Number(memberCount),
        isFullHallRequested,
        buffetRequested,
        packageData: pkg
      })

      totalAmount = reqTotal !== undefined ? Number(reqTotal) : pricing.total
      advanceAmount = reqAdvance !== undefined ? Number(reqAdvance) : 5000 // or some percentage like totalAmount * 0.2
      balanceAmount = reqBalance !== undefined ? Number(reqBalance) : (totalAmount ? totalAmount - advanceAmount : null)
      extraHallCharge = reqExtraHall !== undefined ? Number(reqExtraHall) : pricing.extraHallCharge
      extraBuffetCharge = reqExtraBuffet !== undefined ? Number(reqExtraBuffet) : pricing.extraBuffetCharge
    }

    // Generate Booking Code
    const year = new Date().getFullYear()
    const count = await prisma.booking.count()
    const randomSuffix = Math.floor(100 + Math.random() * 900)
    const bookingCode = `AG-${year}-${String(count + 1).padStart(3, '0')}-${randomSuffix}`

    const booking = await prisma.booking.create({
      data: {
        bookingCode,
        customerName,
        customerPhone,
        customerEmail,
        partyType,
        bookingType,
        eventDate: new Date(eventDate),
        eventTimeSlot,
        memberCount: Number(memberCount),
        packageId: packageId || null,
        isFullHall: isFullHallRequested,
        buffetRequested,
        specialRequests,
        advanceAmount,
        totalAmount,
        balanceAmount,
        extraHallCharge,
        extraBuffetCharge,
        status: status || 'PENDING'
      }
    })

    // Schedule reminders
    await scheduleRemindersForBooking(booking.id)

    // Auto send confirmation to customer
    const confirmationReminder = await prisma.reminder.findFirst({
      where: { bookingId: booking.id, reminderType: 'BOOKING_CONFIRMATION' }
    })
    if (confirmationReminder) {
      await processReminder(confirmationReminder.id)
    }

    // Auto send new booking alert to admin
    const adminPhone = process.env.NEXT_PUBLIC_WHATSAPP_ADMIN_NUMBER || process.env.WHATSAPP_ADMIN_NUMBER
    if (adminPhone) {
      const alertContent = getMessageContent('NEW_BOOKING_ALERT', booking)
      await sendWhatsAppMessage(adminPhone, 'new_booking_alert', 'en', [], alertContent)
    }

    return NextResponse.json({ success: true, booking })
  } catch (error) {
    console.error('Create booking error:', error)
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const code = searchParams.get('code')
    
    if (code) {
      const booking = await prisma.booking.findUnique({
        where: { bookingCode: code },
        include: { package: true }
      })
      if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
      return NextResponse.json({ booking })
    }

    let where: any = {}
    if (status) {
      where.status = status
    }

    const bookings = await prisma.booking.findMany({
      where,
      orderBy: { eventDate: 'asc' },
      include: { package: true }
    })
    return NextResponse.json({ bookings })
  } catch (error) {
    console.error('GET bookings error:', error)
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 })
  }
}
