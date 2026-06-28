"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { format } from "date-fns"
import { formatINR } from "@/lib/utils"

export default function PrintBillPage() {
  const { id } = useParams()
  const [booking, setBooking] = useState<any>(null)

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/bookings/${id}`)
      const data = await res.json()
      if (data.booking) {
        setBooking(data.booking)
        // Give time for render before auto print
        setTimeout(() => window.print(), 1000)
      }
    }
    load()
  }, [id])

  if (!booking) return <div className="p-8 font-mono text-sm">Preparing bill...</div>

  let parsedRequests: any = {}
  try {
    parsedRequests = JSON.parse(booking.specialRequests || "{}")
  } catch (e) {}

  const isPackage = booking.bookingType === 'PACKAGE'
  const packageAmount = isPackage ? (booking.package?.flatPrice ? Number(booking.package.flatPrice) : Number(booking.memberCount) * Number(booking.package?.pricePerHead || 0)) : 0
  const hallCharge = isPackage ? Number(booking.extraHallCharge || 0) : 0
  const buffetCharge = isPackage ? Number(booking.extraBuffetCharge || 0) : 0

  const subtotal = packageAmount + hallCharge + buffetCharge
  const gst = isPackage ? (subtotal * 0.05) : 0
  const grandTotal = isPackage ? (subtotal + gst) : Number(booking.advanceAmount)
  const advancePaid = Number(booking.advanceAmount)
  const balanceDue = isPackage ? (grandTotal - advancePaid) : 0

  const dateStr = format(new Date(), 'dd/MM/yyyy')
  const eventDateStr = format(new Date(booking.eventDate), 'dd/MM/yyyy')

  // Parse includes if package exists
  let includesList: string[] = []
  if (booking.package?.includes) {
    try {
      includesList = typeof booking.package.includes === 'string' 
        ? JSON.parse(booking.package.includes) 
        : booking.package.includes
    } catch (e) {}
  }

  return (
    <div id="thermal-bill" className="font-mono text-xs text-black bg-white p-4 w-[80mm] max-w-[80mm] mx-auto select-none">
      <div>================================</div>
      <div className="text-center font-bold">K'S DARSHAN CAFE</div>
      <div className="text-center font-bold">Cafe & Restaurant</div>
      <div className="text-center font-bold">Indore, MP</div>
      <div className="text-center">Tel: +91 9876543210</div>
      <div>================================</div>
      <div className="font-bold text-center">BOOKING RECEIPT</div>
      <div>Date: {dateStr}</div>
      <div>--------------------------------</div>
      <div>Booking Code: {booking.bookingCode}</div>
      <div>Party Type:   {booking.partyType.replace(/_/g, ' ')}</div>
      <div>Event Date:  {eventDateStr}</div>
      <div>Time Slot:   {booking.eventTimeSlot.replace(/_/g, ' ')}</div>
      <div>Members:      {booking.memberCount}</div>
      <div>--------------------------------</div>
      <div className="font-bold">CUSTOMER DETAILS</div>
      <div>Name:  {booking.customerName}</div>
      <div>Phone: {booking.customerPhone}</div>
      {isPackage && (
        <>
          <div>--------------------------------</div>
          <div className="font-bold">PACKAGE: {booking.package?.name || 'Custom'}</div>
          <div>Includes:</div>
          {includesList.map((item, i) => (
            <div key={i}>- {item}</div>
          ))}
          <div>--------------------------------</div>
          <div className="font-bold">FOOD SELECTIONS</div>
          <div>Welcome Drink: {parsedRequests.welcomeDrink || 'None'}</div>
          <div>Starter:       {parsedRequests.starter || 'None'}</div>
          <div>Paneer Sabji:  {parsedRequests.paneerVeg || 'None'}</div>
          <div>Seasonal Veg:  {parsedRequests.seasonalVeg || 'None'}</div>
          <div>Dal:           {parsedRequests.dal || 'None'}</div>
          <div>Sweet:         {parsedRequests.sweet || 'None'}</div>
        </>
      )}
      <div>--------------------------------</div>
      <div className="font-bold">BILLING</div>
      <div>Package Amount: {formatINR(packageAmount)}</div>
      <div>Hall Charge:    {formatINR(hallCharge)}</div>
      <div>Buffet Charge:  {formatINR(buffetCharge)}</div>
      <div>--------------------------------</div>
      <div>GST (5%):       {formatINR(gst)}</div>
      <div className="font-bold">TOTAL:          {formatINR(grandTotal)}</div>
      <div>--------------------------------</div>
      <div>Advance Paid:   {formatINR(advancePaid)}</div>
      <div className="font-bold">BALANCE DUE:    {formatINR(balanceDue)}</div>
      <div>================================</div>
      <div className="text-center font-bold">TERMS & CONDITIONS</div>
      <div>* Advance non-refundable</div>
      <div>* Outside food not allowed</div>
      <div>* Duration: 3 hours</div>
      <div>* After 3hrs: Rs.1000/hr extra</div>
      <div>* No alcohol/smoking</div>
      <div>================================</div>
      <div className="text-center font-bold">Thank you for choosing us!</div>
      <div className="text-center font-bold">See you again! :)</div>
      <div>================================</div>

      <style jsx global>{`
        body {
          background-color: white;
          color: black;
          margin: 0;
          padding: 0;
        }
        @media print {
          body * { visibility: hidden; }
          #thermal-bill, #thermal-bill * { visibility: visible; }
          #thermal-bill { position: fixed; top: 0; left: 0; width: 80mm; padding: 0; margin: 0; }
          @page { size: 80mm auto; margin: 0; }
        }
      `}</style>
    </div>
  )
}
