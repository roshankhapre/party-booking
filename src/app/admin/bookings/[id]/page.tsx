"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import { formatINR } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Printer, MessageCircle, RefreshCw } from "lucide-react"

export default function BookingDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [booking, setBooking] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  const fetchBooking = async () => {
    setLoading(true)
    const res = await fetch(`/api/bookings/${id}`)
    const data = await res.json()
    if (data.booking) setBooking(data.booking)
    setLoading(false)
  }

  useEffect(() => {
    fetchBooking()
  }, [id])

  const updateStatus = async (newStatus: string) => {
    setUpdating(true)
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      if (res.ok) {
        toast({ title: "Status updated" })
        fetchBooking()
      } else {
        toast({ title: "Failed to update", variant: "destructive" })
      }
    } catch {
      toast({ title: "Error", variant: "destructive" })
    }
    setUpdating(false)
  }

  const handleFinalBillUpdate = async () => {
    const amount = prompt("Enter final total bill amount from Petpooja:")
    if (!amount || isNaN(Number(amount))) return

    setUpdating(true)
    try {
      const totalAmount = Number(amount)
      const balanceAmount = totalAmount - Number(booking.advanceAmount)

      const res = await fetch(`/api/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ totalAmount, balanceAmount, status: 'COMPLETED' })
      })
      if (res.ok) {
        toast({ title: "Final Bill Updated & Completed" })
        fetchBooking()
      }
    } catch {
       toast({ title: "Error", variant: "destructive" })
    }
    setUpdating(false)
  }

  const sendReminder = async (type: string) => {
    setUpdating(true)
    try {
      const res = await fetch(`/api/reminders/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: id, reminderType: type })
      })
      if (res.ok) {
        toast({ title: `Reminder ${type.replace(/_/g, ' ')} Sent` })
        fetchBooking()
      } else {
        toast({ title: "Failed to send reminder", variant: "destructive" })
      }
    } catch {
      toast({ title: "Error", variant: "destructive" })
    }
    setUpdating(false)
  }

  if (loading) return <div className="p-8">Loading details...</div>
  if (!booking) return <div className="p-8">Booking not found.</div>

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/admin/bookings"><ArrowLeft className="w-4 h-4" /></Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Booking {booking.bookingCode}</h1>
          <Badge variant="secondary" className="ml-2">{booking.status}</Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => fetchBooking()}>
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/admin/bookings/${booking.id}/bill`} target="_blank">
              <Printer className="w-4 h-4 mr-2" /> Print Bill
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        
        {/* Main Details */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="bg-muted/50 border-b">
              <CardTitle className="text-lg">Event Information</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
               <div className="grid grid-cols-2 gap-y-4 text-sm">
                 <div className="text-muted-foreground">Party Type</div><div className="font-medium">{booking.partyType.replace('_',' ')}</div>
                 <div className="text-muted-foreground">Date</div><div className="font-medium">{format(new Date(booking.eventDate), 'PPP')}</div>
                 <div className="text-muted-foreground">Time Slot</div><div className="font-medium">{booking.eventTimeSlot}</div>
                 <div className="text-muted-foreground">Members</div><div className="font-medium">{booking.memberCount} Guests</div>
                 <div className="text-muted-foreground">Setup</div><div className="font-medium">{booking.isFullHall ? 'Exclusive Full Hall' : 'Reserved Area'}</div>
                 {booking.specialRequests && (
                   <>
                     <div className="col-span-2 mt-4 text-muted-foreground">Special Requests</div>
                     <div className="col-span-2 italic bg-muted/30 p-3 rounded-md">{booking.specialRequests}</div>
                   </>
                 )}
               </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="bg-muted/50 border-b">
              <CardTitle className="text-lg">Package & Billing</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
               {booking.bookingType === 'PACKAGE' ? (
                 <>
                   <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 mb-4">
                     <div className="font-semibold">{booking.package?.name || 'Custom Package'}</div>
                     <div className="text-sm text-muted-foreground">Package Booking</div>
                   </div>
                   <div className="grid grid-cols-2 text-sm gap-y-2">
                     <div className="text-muted-foreground">Advance Received</div><div className="text-right font-medium">{formatINR(Number(booking.advanceAmount))}</div>
                     <div className="text-muted-foreground">Total Estimated Bill</div><div className="text-right font-medium">{formatINR(Number(booking.totalAmount))}</div>
                     <div className="col-span-2 border-t my-2" />
                     <div className="text-muted-foreground font-semibold">Balance Due</div><div className="text-right font-bold text-destructive">{formatINR(Number(booking.balanceAmount))}</div>
                   </div>
                 </>
               ) : (
                 <>
                   <div className="bg-muted p-4 rounded-xl border mb-4">
                     <div className="font-semibold">Table Only</div>
                     <div className="text-sm text-muted-foreground">A la carte orders (Petpooja)</div>
                   </div>
                   <div className="grid grid-cols-2 text-sm gap-y-2">
                     <div className="text-muted-foreground">Advance Received</div><div className="text-right font-medium">{formatINR(Number(booking.advanceAmount))}</div>
                     {booking.totalAmount !== null ? (
                       <>
                        <div className="text-muted-foreground font-semibold border-t pt-2 mt-2">Final Petpooja Bill</div><div className="text-right font-bold border-t pt-2 mt-2">{formatINR(Number(booking.totalAmount))}</div>
                        <div className="text-muted-foreground font-semibold">Balance Due</div><div className="text-right font-bold text-destructive">{formatINR(Number(booking.balanceAmount))}</div>
                       </>
                     ) : (
                       <div className="col-span-2 mt-4">
                         <Button variant="outline" className="w-full" onClick={handleFinalBillUpdate} disabled={updating}>Add Final Petpooja Bill</Button>
                       </div>
                     )}
                   </div>
                 </>
               )}
            </CardContent>
          </Card>
        </div>

        {/* Additional Charges Reference */}
        <div className="md:col-span-2 space-y-6 -mt-2">
          <Card>
            <CardHeader className="bg-muted/50 border-b">
              <CardTitle className="text-lg">Additional Charges (Reference)</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                <div>Welcome Drink: +₹30</div>
                <div>Veg Starter: +₹40</div>
                <div>Paneer Starter: +₹50</div>
                <div>Paneer Veg: +₹50</div>
                <div>Seasonal Veg: +₹40</div>
                <div>Roti: +₹20</div>
                <div>Sweet: +₹30</div>
                <div>Dal Makhani: +₹40</div>
                <div>Moong Dal Halwa: +₹60</div>
                <div>Gajar Ka Halwa: +₹50</div>
                <div>Raita: +₹20</div>
                <div>Pulao Masala Rice: +₹20</div>
                <div>Biryani: +₹40</div>
                <div>Mineral Water: ₹20/bottle</div>
              </div>
              <div className="mt-4 text-xs font-bold text-foreground">
                GST 5% on all bills.
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar details */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Customer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <div className="text-muted-foreground text-xs uppercase tracking-wider">Name</div>
                <div className="font-medium">{booking.customerName}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs uppercase tracking-wider">Phone (WhatsApp)</div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{booking.customerPhone}</span>
                  <a href={`https://wa.me/91${booking.customerPhone}`} target="_blank" rel="noreferrer">
                    <MessageCircle className="w-4 h-4 text-green-500 cursor-pointer" />
                  </a>
                </div>
              </div>
              {booking.customerEmail && (
                <div>
                  <div className="text-muted-foreground text-xs uppercase tracking-wider">Email</div>
                  <div className="font-medium">{booking.customerEmail}</div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="text-sm font-medium">Update Status</div>
                <Select value={booking.status} onValueChange={updateStatus} disabled={updating}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">WhatsApp Messages</CardTitle>
            </CardHeader>
            <CardContent>
               <div className="space-y-4 mb-6">
                 <div className="text-sm font-medium">Manual Send</div>
                 <div className="flex flex-col gap-2">
                   <Button variant="outline" size="sm" onClick={() => sendReminder('BOOKING_CONFIRMATION')} disabled={updating}>Send Confirmation</Button>
                   <Button variant="outline" size="sm" onClick={() => sendReminder('THREE_DAYS_BEFORE')} disabled={updating}>Send Reminder (3 Days)</Button>
                   <Button variant="outline" size="sm" onClick={() => sendReminder('THANK_YOU')} disabled={updating}>Send Thank You</Button>
                 </div>
               </div>

               <div className="text-sm font-medium mb-3 border-t pt-4">Message Log</div>
               {booking.reminders?.length > 0 ? (
                 <ul className="space-y-4">
                   {booking.reminders.map((r: any) => (
                     <li key={r.id} className="text-sm border rounded-md p-3">
                       <div className="flex justify-between items-center mb-2">
                         <span className="font-semibold">{r.reminderType.replace(/_/g, ' ')}</span>
                         <Badge variant={r.status === 'SENT' || r.status === 'MOCK_SENT' ? 'default' : 'outline'} className="text-xs">
                           {r.status}
                         </Badge>
                       </div>
                       {r.sentAt && <div className="text-xs text-muted-foreground mb-2">Sent: {format(new Date(r.sentAt), 'PP pp')}</div>}
                       {r.messageContent && (
                         <div className="text-xs bg-muted p-2 rounded whitespace-pre-wrap mt-2 max-h-32 overflow-y-auto">
                           {r.messageContent}
                         </div>
                       )}
                     </li>
                   ))}
                 </ul>
               ) : (
                 <div className="text-sm text-muted-foreground text-center">No messages sent</div>
               )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
