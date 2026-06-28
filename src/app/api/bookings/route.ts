import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calculateBookingPrice } from '@/lib/bookingLogic'
import { scheduleRemindersForBooking, processReminder, sendWhatsAppMessage, getMessageContent } from '@/lib/whatsapp'
import { sendBookingConfirmationEmail, sendAdminNewBookingEmail } from '@/lib/email'

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

    // Fetch settings from database
    const dbSettings = await prisma.setting.findMany()
    const settingsMap = dbSettings.reduce((acc, curr) => {
      acc[curr.key] = curr.value
      return acc
    }, {} as Record<string, string>)

    const defaultAdvance = Number(settingsMap.defaultAdvanceAmount || 2000)

    // Calculate Pricing
    let advanceAmount = reqAdvance !== undefined ? Number(reqAdvance) : defaultAdvance
    let totalAmount = reqTotal !== undefined ? Number(reqTotal) : null
    let balanceAmount = reqBalance !== undefined ? Number(reqBalance) : null

    let extraHallCharge = reqExtraHall !== undefined ? Number(reqExtraHall) : 0
    let extraBuffetCharge = reqExtraBuffet !== undefined ? Number(reqExtraBuffet) : 0

    let venue = 'Rooftop'
    if (specialRequests) {
      try {
        const parsed = JSON.parse(specialRequests)
        if (parsed.venue) venue = parsed.venue
      } catch (e) {}
    }

    const fullHallMinMembers = settingsMap.fullHallMinMembers ? Number(settingsMap.fullHallMinMembers) : 40
    let isFullHallRequested = isFullHall || Number(memberCount) >= fullHallMinMembers

    // Smart booking conflict detection
    const bookingDate = new Date(eventDate)
    const existingBookings = await prisma.booking.findMany({
      where: {
        eventDate: bookingDate,
        eventTimeSlot,
        status: { not: 'CANCELLED' }
      }
    })

    const hasFullHallBooking = existingBookings.some((b: any) => b.isFullHall)
    if (hasFullHallBooking) {
      return NextResponse.json({ error: 'Conflict: A Full Hall event is already booked for this time slot.' }, { status: 409 })
    }
    if (isFullHallRequested && existingBookings.length > 0) {
      return NextResponse.json({ error: `Conflict: Cannot book Full Hall. ${existingBookings.length} other bookings exist in this time slot.` }, { status: 409 })
    }

    if (bookingType === 'PACKAGE') {
      const pkg = await prisma.package.findUnique({ where: { id: packageId } })
      if (!pkg) return NextResponse.json({ error: 'Package not found' }, { status: 400 })

      const pricing = calculateBookingPrice({
        bookingType,
        memberCount: Number(memberCount),
        isFullHallRequested,
        buffetRequested,
        packageData: pkg,
        settings: settingsMap,
        venue
      })

      totalAmount = reqTotal !== undefined ? Number(reqTotal) : pricing.total
      advanceAmount = reqAdvance !== undefined ? Number(reqAdvance) : defaultAdvance
      balanceAmount = reqBalance !== undefined ? Number(reqBalance) : (totalAmount ? totalAmount - advanceAmount : null)
      extraHallCharge = reqExtraHall !== undefined ? Number(reqExtraHall) : pricing.extraHallCharge
      extraBuffetCharge = reqExtraBuffet !== undefined ? Number(reqExtraBuffet) : pricing.extraBuffetCharge
    } else {
      // TABLE_ONLY
      if (reqTotal !== undefined) {
        totalAmount = Number(reqTotal)
        balanceAmount = reqBalance !== undefined ? Number(reqBalance) : totalAmount - advanceAmount
      }
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

    // Send emails
    if (customerEmail) {
      await sendBookingConfirmationEmail(customerEmail, booking).catch(console.error)
    }
    await sendAdminNewBookingEmail(booking).catch(console.error)

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
    const phone = searchParams.get('phone')
    
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
    if (phone) {
      where.customerPhone = phone
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
