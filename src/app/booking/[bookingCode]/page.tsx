"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { formatINR } from "@/lib/utils"
import { format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, MapPin, Printer } from "lucide-react"

export default function BookingConfirmation() {
  const { bookingCode } = useParams()
  const [booking, setBooking] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadBooking() {
      try {
        const res = await fetch(`/api/bookings?code=${bookingCode}`)
        const data = await res.json()
        if (data.booking) {
          setBooking(data.booking)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadBooking()
  }, [bookingCode])

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading confirmation...</div>
  if (!booking) return <div className="min-h-screen flex items-center justify-center">Booking not found.</div>

  const safeFormatDate = (dateString: string) => {
    if (!dateString) return 'Date not specified';
    try {
      return format(new Date(dateString), 'PPP');
    } catch {
      return 'Invalid date';
    }
  }

  return (
    <div className="min-h-screen bg-muted/40 py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        
        <div className="text-center space-y-4">
          <CheckCircle2 className="w-16 h-16 text-primary mx-auto" />
          <h1 className="text-3xl font-bold">Booking Confirmed!</h1>
          <p className="text-muted-foreground text-lg">Thank you, {booking.customerName}. Your party is scheduled.</p>
        </div>

        <Card className="shadow-lg border-primary/20">
          <CardHeader className="border-b bg-card">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-2xl text-primary">{booking.bookingCode}</CardTitle>
                <CardDescription>Keep this code for your records</CardDescription>
              </div>
              <div className="text-right">
                <div className="font-semibold">{booking.partyType?.replace('_',' ')}</div>
                <div className="text-sm text-muted-foreground">{booking.bookingType}</div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-8">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Date & Time</div>
                <div className="font-semibold">{safeFormatDate(booking.eventDate)}</div>
                <div className="font-medium text-sm text-muted-foreground">{booking.eventTimeSlot}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Guests & Details</div>
                <div className="font-semibold">{booking.memberCount} Members</div>
                <div className="text-sm text-muted-foreground">{booking.isFullHall ? 'Full Hall Exclusive' : 'Reserved Area'}</div>
              </div>
            </div>

            <div className="p-4 bg-muted rounded-xl space-y-3">
               <h3 className="font-semibold border-b pb-2">Payment Summary</h3>
               <div className="flex justify-between text-sm">
                 <span className="text-muted-foreground">Advance Deposited</span>
                 <span className="font-medium">{formatINR(Number(booking.advanceAmount))}</span>
               </div>
               {booking.bookingType === 'PACKAGE' && booking.totalAmount && (
                 <>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Estimated Total</span>
                    <span className="font-medium">{formatINR(Number(booking.totalAmount))}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t font-semibold">
                    <span>Balance Due</span>
                    <span className="text-destructive">{formatINR(Number(booking.balanceAmount))}</span>
                  </div>
                 </>
               )}
               {booking.bookingType === 'TABLE_ONLY' && (
                 <div className="text-sm pt-2 border-t text-muted-foreground text-center">
                    Final bill will be calculated as per à la carte orders on the event day.
                 </div>
               )}
            </div>
          </CardContent>
          <CardFooter className="bg-muted/50 border-t p-6 flex flex-col sm:flex-row justify-between gap-4 items-center">
             <div className="flex items-center text-muted-foreground text-sm">
               <MapPin className="w-4 h-4 mr-2" />
               Antigravity, rooftop, Indore, MP
             </div>
             <Button onClick={() => window.print()} className="w-full sm:w-auto">
               <Printer className="w-4 h-4 mr-2" /> Print Confirmation
             </Button>
          </CardFooter>
        </Card>

      </div>
    </div>
  )
}
