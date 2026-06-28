"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import { formatINR } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Printer, MessageCircle, RefreshCw, PlusCircle, Mail } from "lucide-react"
import { Input } from "@/components/ui/input"

export default function BookingDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [booking, setBooking] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  
  const [cancelReason, setCancelReason] = useState("")
  const [showCancelOptions, setShowCancelOptions] = useState(false)

  const [paymentAmount, setPaymentAmount] = useState("")
  const [paymentMode, setPaymentMode] = useState("CASH")
  const [showPaymentForm, setShowPaymentForm] = useState(false)

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
    if (newStatus === 'CANCELLED' && !cancelReason) {
      toast({ title: "Please provide a reason for cancellation", variant: "destructive" });
      return;
    }
    
    setUpdating(true)
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, specialRequests: newStatus === 'CANCELLED' ? `${booking.specialRequests}\nCancel Reason: ${cancelReason}` : undefined })
      })
      if (res.ok) {
        toast({ title: "Status updated" })
        setShowCancelOptions(false)
        fetchBooking()
      } else {
        toast({ title: "Failed to update", variant: "destructive" })
      }
    } catch {
      toast({ title: "Error", variant: "destructive" })
    }
    setUpdating(false)
  }

  const addPayment = async () => {
    if (!paymentAmount || isNaN(Number(paymentAmount))) return;
    setUpdating(true)
    try {
       const res = await fetch(`/api/bookings/${id}/payments`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ amount: Number(paymentAmount), paymentMode })
       })
       if(res.ok) {
         toast({ title: "Payment Recorded" })
         setShowPaymentForm(false)
         setPaymentAmount("")
         fetchBooking() // Refreshes payments list and balances
       }
    } catch {
       toast({ title: "Error recording payment", variant: "destructive" })
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
        toast({ title: `Reminder Sent` })
        fetchBooking()
      } else {
        toast({ title: "Failed to send reminder", variant: "destructive" })
      }
    } catch {
      toast({ title: "Error", variant: "destructive" })
    }
    setUpdating(false)
  }

  const handleSendBill = async (method: 'whatsapp' | 'email') => {
    setUpdating(true)
    try {
      const res = await fetch(`/api/bookings/${id}/send-bill`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method })
      })
      const result = await res.json()
      if (res.ok) {
        toast({ title: `Bill sent via ${method === 'whatsapp' ? 'WhatsApp' : 'Email'} successfully!` })
      } else {
        toast({ title: "Failed to send bill", description: result.error, variant: "destructive" })
      }
    } catch {
      toast({ title: "Error sending bill", variant: "destructive" })
    }
    setUpdating(false)
  }
  
  const parseSpecialRequests = () => {
    if (!booking?.specialRequests) return null;
    try {
      const obj = JSON.parse(booking.specialRequests);
      return obj;
    } catch {
      return { specialRequests: booking.specialRequests };
    }
  }

  if (loading) return <div className="p-8">Loading details...</div>
  if (!booking) return <div className="p-8">Booking not found.</div>

  const parsedRequests = parseSpecialRequests();

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/admin/bookings"><ArrowLeft className="w-4 h-4" /></Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Booking {booking.bookingCode}</h1>
          <Badge variant={booking.status === 'CANCELLED' ? 'destructive' : 'secondary'} className="ml-2">{booking.status}</Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => fetchBooking()}>
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/admin/bookings/${booking.id}/bill`} target="_blank">
              <Printer className="w-4 h-4 mr-2" /> Print Bill
            </Link>
          </Button>
          <Button variant="outline" onClick={() => handleSendBill('whatsapp')} disabled={updating}>
            <MessageCircle className="w-4 h-4 mr-2 text-green-500" /> Send on WhatsApp
          </Button>
          <Button 
            variant="outline" 
            onClick={() => handleSendBill('email')} 
            disabled={updating || !booking.customerEmail}
          >
            <Mail className="w-4 h-4 mr-2 text-blue-500" /> Send via Email
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
                 <div className="text-muted-foreground">Party Type</div><div className="font-medium">{booking.partyType.replace(/_/g,' ')}</div>
                 <div className="text-muted-foreground">Date</div><div className="font-medium">{format(new Date(booking.eventDate), 'PPP')}</div>
                 <div className="text-muted-foreground">Time Slot</div><div className="font-medium">{booking.eventTimeSlot.replace(/_/g,' ')}</div>
                 <div className="text-muted-foreground">Members</div><div className="font-medium">{booking.memberCount} Guests</div>
                 <div className="text-muted-foreground">Setup</div><div className="font-medium">{booking.isFullHall ? 'Exclusive Full Hall' : 'Reserved Area'}</div>
                 <div className="text-muted-foreground">Venue</div><div className="font-medium">{parsedRequests?.venue || 'Rooftop'}</div>
               </div>
            </CardContent>
          </Card>

          {/* Formatted Food Menu Card (Feature 8) */}
          {parsedRequests && (parsedRequests.welcomeDrink || parsedRequests.starter || parsedRequests.paneerVeg || parsedRequests.seasonalVeg || parsedRequests.sweet || parsedRequests.dal) && (
            <Card className="border border-amber-500/30 shadow-[0_0_20px_rgba(212,175,55,0.05)] bg-gradient-to-br from-zinc-900 to-zinc-950 text-white rounded-2xl overflow-hidden">
              <CardHeader className="bg-zinc-900/80 border-b border-amber-500/20 py-4 flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-bold text-amber-400 flex items-center gap-2">
                  🍽️ Food Menu Card
                </CardTitle>
                <Badge variant="outline" className="border-amber-500/30 text-amber-400">
                  {parsedRequests.venue || 'Rooftop'}
                </Badge>
              </CardHeader>
              <CardContent className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm font-sans">
                {parsedRequests.welcomeDrink && (
                  <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/80">
                    <div className="text-amber-500/80 font-bold text-xs uppercase tracking-wider mb-1">Welcome Drink</div>
                    <div className="font-semibold text-zinc-100 text-base">{parsedRequests.welcomeDrink}</div>
                  </div>
                )}
                {parsedRequests.starter && (
                  <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/80">
                    <div className="text-amber-500/80 font-bold text-xs uppercase tracking-wider mb-1">Starter</div>
                    <div className="font-semibold text-zinc-100 text-base">{parsedRequests.starter}</div>
                  </div>
                )}
                {parsedRequests.paneerVeg && (
                  <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/80">
                    <div className="text-amber-500/80 font-bold text-xs uppercase tracking-wider mb-1">Paneer Sabji</div>
                    <div className="font-semibold text-zinc-100 text-base">{parsedRequests.paneerVeg}</div>
                  </div>
                )}
                {parsedRequests.seasonalVeg && (
                  <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/80">
                    <div className="text-amber-500/80 font-bold text-xs uppercase tracking-wider mb-1">Seasonal Veg</div>
                    <div className="font-semibold text-zinc-100 text-base">{parsedRequests.seasonalVeg}</div>
                  </div>
                )}
                {parsedRequests.dal && (
                  <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/80">
                    <div className="text-amber-500/80 font-bold text-xs uppercase tracking-wider mb-1">Dal</div>
                    <div className="font-semibold text-zinc-100 text-base">{parsedRequests.dal}</div>
                  </div>
                )}
                {parsedRequests.sweet && (
                  <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/80">
                    <div className="text-amber-500/80 font-bold text-xs uppercase tracking-wider mb-1">Sweet / Dessert</div>
                    <div className="font-semibold text-zinc-100 text-base">{parsedRequests.sweet}</div>
                  </div>
                )}
                {parsedRequests.specialRequests && (
                  <div className="col-span-1 sm:col-span-2 bg-amber-500/5 border border-amber-500/20 p-4 rounded-xl mt-2 italic text-zinc-300">
                    <strong>Special Requests:</strong> {parsedRequests.specialRequests}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="bg-muted/50 border-b flex flex-row justify-between items-center">
              <CardTitle className="text-lg">Package & Billing</CardTitle>
              <Button size="sm" variant="outline" onClick={() => setShowPaymentForm(!showPaymentForm)}>
                <PlusCircle className="w-4 h-4 mr-1" /> Add Payment
              </Button>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
               {showPaymentForm && (
                  <div className="p-4 bg-muted/30 rounded-lg border flex gap-4 items-end mb-4">
                    <div className="flex-1">
                      <label className="text-xs text-muted-foreground">Amount</label>
                      <Input type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} placeholder="0.00" />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-muted-foreground">Mode</label>
                      <Select value={paymentMode} onValueChange={setPaymentMode}>
                        <SelectTrigger><SelectValue/></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CASH">Cash</SelectItem>
                          <SelectItem value="UPI">UPI</SelectItem>
                          <SelectItem value="CARD">Card</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={addPayment} disabled={updating}>Save</Button>
                  </div>
               )}

               {booking.bookingType === 'PACKAGE' ? (
                  <>
                    <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 mb-4">
                      <div className="font-semibold">{booking.package?.name || 'Custom Package'}</div>
                      <div className="text-sm text-muted-foreground">Package Booking</div>
                    </div>
                    <div className="grid grid-cols-2 text-sm gap-y-2">
                      <div className="text-muted-foreground">Advance Required at Booking</div><div className="text-right font-medium">{formatINR(Number(booking.advanceAmount))}</div>
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
                         <div className="col-span-2 mt-4 text-center text-muted-foreground text-sm">
                           Total amount will be updated from POS on day of event.
                         </div>
                      )}
                    </div>
                  </>
               )}

               {booking.payments && booking.payments.length > 0 && (
                  <div className="mt-6 pt-4 border-t">
                    <div className="text-sm font-semibold mb-2">Payment History</div>
                    <div className="space-y-2">
                      {booking.payments.map((p: any) => (
                        <div key={p.id} className="flex justify-between items-center text-sm p-2 bg-muted/20 rounded">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{p.paymentMode}</Badge>
                            <span className="text-muted-foreground text-xs">{format(new Date(p.paidAt), 'MMM dd, HH:mm')}</span>
                          </div>
                          <div className="font-bold">{formatINR(Number(p.amount))}</div>
                        </div>
                      ))}
                    </div>
                  </div>
               )}
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
                <Select value={booking.status} onValueChange={(val) => {
                  if (val === 'CANCELLED') setShowCancelOptions(true)
                  else updateStatus(val)
                }} disabled={updating}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {showCancelOptions && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md space-y-2 mt-2">
                  <label className="text-xs font-bold text-red-500">Reason for Cancellation</label>
                  <Input value={cancelReason} onChange={e => setCancelReason(e.target.value)} placeholder="Enter reason..." />
                  <div className="flex gap-2">
                    <Button size="sm" variant="destructive" onClick={() => updateStatus('CANCELLED')} disabled={updating}>Confirm Cancel</Button>
                    <Button size="sm" variant="outline" onClick={() => setShowCancelOptions(false)}>Abort</Button>
                  </div>
                </div>
              )}
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
                   <Button variant="outline" size="sm" onClick={() => sendReminder('ONE_DAY_BEFORE')} disabled={updating}>Send Reminder (1 Day)</Button>
                   <Button variant="outline" size="sm" onClick={() => sendReminder('DAY_OF')} disabled={updating}>Send Day-of Reminder</Button>
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
