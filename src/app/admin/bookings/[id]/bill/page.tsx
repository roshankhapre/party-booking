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

  if (!booking) return <div className="p-8">Preparing bill...</div>

  return (
    <div className="bg-white text-black min-h-screen p-8 print:p-0 font-sans max-w-3xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8 border-b-2 border-black pb-4">
        <h1 className="text-4xl font-bold uppercase tracking-wider mb-2">Antigravity</h1>
        <p className="text-sm">Rooftop Restaurant & Bar, Indore, MP</p>
        <p className="text-sm font-semibold mt-2">GSTIN: 23AAAAA0000A1Z5</p>
      </div>

      {/* Booking Info */}
      <div className="flex justify-between mb-8 text-sm">
        <div>
          <p><span className="font-semibold">Bill To:</span> {booking.customerName}</p>
          <p><span className="font-semibold">Phone:</span> {booking.customerPhone}</p>
          {booking.customerEmail && <p><span className="font-semibold">Email:</span> {booking.customerEmail}</p>}
        </div>
        <div className="text-right">
          <p><span className="font-semibold">Booking ID:</span> {booking.bookingCode}</p>
          <p><span className="font-semibold">Date:</span> {format(new Date(), 'dd/MM/yyyy')}</p>
          <p><span className="font-semibold">Event Date:</span> {format(new Date(booking.eventDate), 'dd/MM/yyyy')}</p>
        </div>
      </div>

      {/* Items Table */}
      <table className="w-full mb-8 text-sm border-collapse border border-black">
        <thead className="bg-gray-100">
          <tr>
            <th className="border border-black p-2 text-left">Description</th>
            <th className="border border-black p-2 text-center text-nowrap">Qty</th>
            <th className="border border-black p-2 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {booking.bookingType === 'PACKAGE' ? (
            <>
              <tr>
                <td className="border border-black p-2">
                  <div className="font-semibold">{booking.package?.name || 'Custom Package'}</div>
                  <div className="text-xs text-gray-600">{booking.partyType.replace('_',' ')}</div>
                </td>
                <td className="border border-black p-2 text-center">{booking.memberCount} guests</td>
                <td className="border border-black p-2 text-right">
                   {formatINR(Number(booking.totalAmount) - Number(booking.extraBuffetCharge) - Number(booking.extraHallCharge) - ((Number(booking.totalAmount) - Number(booking.extraBuffetCharge) - Number(booking.extraHallCharge))*0.05))} {/* Simplified back-calculation for display */}
                </td>
              </tr>
              {Number(booking.extraHallCharge) > 0 && (
                <tr>
                  <td className="border border-black p-2">Full Hall Exclusive Reservation</td>
                  <td className="border border-black p-2 text-center">1</td>
                  <td className="border border-black p-2 text-right">{formatINR(Number(booking.extraHallCharge))}</td>
                </tr>
              )}
              {Number(booking.extraBuffetCharge) > 0 && (
                <tr>
                  <td className="border border-black p-2">Extra Buffet Arrangement</td>
                  <td className="border border-black p-2 text-center">{booking.memberCount}</td>
                  <td className="border border-black p-2 text-right">{formatINR(Number(booking.extraBuffetCharge))}</td>
                </tr>
              )}
            </>
          ) : (
            <tr>
              <td className="border border-black p-2">
                <div className="font-semibold">Table Reservation Advance</div>
                <div className="text-xs text-gray-600">Final food bill processed separately via Petpooja.</div>
              </td>
              <td className="border border-black p-2 text-center">-</td>
              <td className="border border-black p-2 text-right">{formatINR(Number(booking.advanceAmount))}</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-end mb-8">
        <div className="w-64 space-y-2 text-sm">
          {booking.bookingType === 'PACKAGE' && (
             <>
               <div className="flex justify-between">
                 <span>Subtotal</span>
                 <span>{formatINR(Number(booking.totalAmount) / 1.05)}</span> {/* Rough subtotal */}
               </div>
               <div className="flex justify-between">
                 <span>GST (Food + Services)</span>
                 <span>{formatINR(Number(booking.totalAmount) - (Number(booking.totalAmount) / 1.05))}</span>
               </div>
             </>
          )}
          <div className="flex justify-between font-bold text-lg border-t-2 border-black pt-2">
            <span>Grand Total</span>
            <span>{formatINR(Number(booking.totalAmount || booking.advanceAmount))}</span>
          </div>
          <div className="flex justify-between border-t border-black pt-2">
            <span>Advance Deposited</span>
            <span>{formatINR(Number(booking.advanceAmount))}</span>
          </div>
          <div className="flex justify-between font-bold">
            <span>Balance Due</span>
            <span>{formatINR(Number(booking.balanceAmount || 0))}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-sm border-t-2 border-black pt-4 text-gray-600 mt-12">
        <p>Thank you for celebrating with us at Antigravity!</p>
        <p>For inquiries, contact +91 9876543210</p>
      </div>

      <style jsx global>{`
        @media print {
          body { -webkit-print-color-adjust: exact; margin: 0; }
          .print\\:p-0 { padding: 0 !important; }
        }
      `}</style>
    </div>
  )
}
