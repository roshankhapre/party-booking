"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { formatINR } from "@/lib/utils"
import Link from "next/link"
import { Search, ExternalLink } from "lucide-react"

export default function BookingLookupPage() {
  const [phone, setPhone] = useState("")
  const [bookings, setBookings] = useState<any[]>([])
  const [searched, setSearched] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phone || phone.length < 10) return;
    
    setLoading(true)
    try {
      const res = await fetch(`/api/bookings?phone=${encodeURIComponent(phone)}`)
      const data = await res.json()
      setBookings(data.bookings || [])
      setSearched(true)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col items-center p-4 py-12">
      <div className="w-full max-w-xl space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">Find My Booking</h1>
          <p className="text-muted-foreground">Enter your WhatsApp number to look up your bookings.</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSearch} className="flex gap-2">
              <Input 
                placeholder="Enter 10-digit WhatsApp number" 
                value={phone} 
                onChange={e => setPhone(e.target.value)}
                type="tel"
                className="flex-1"
              />
              <Button type="submit" disabled={loading || phone.length < 10}>
                {loading ? "Searching..." : <><Search className="w-4 h-4 mr-2" /> Search</>}
              </Button>
            </form>
          </CardContent>
        </Card>

        {searched && !loading && (
          <div className="space-y-4 mt-8">
            <h2 className="font-semibold text-lg">Results ({bookings.length})</h2>
            
            {bookings.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  No bookings found for {phone}.
                </CardContent>
              </Card>
            ) : (
              bookings.map((booking) => (
                <Card key={booking.id} className="overflow-hidden">
                  <div className={`h-2 ${booking.status === 'CONFIRMED' ? 'bg-green-500' : booking.status === 'COMPLETED' ? 'bg-blue-500' : booking.status === 'CANCELLED' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                  <CardContent className="p-5 flex flex-col sm:flex-row justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold">{booking.bookingCode}</span>
                        <Badge variant="outline">{booking.status}</Badge>
                      </div>
                      <div className="text-sm font-medium">{booking.partyType.replace(/_/g, ' ')} - {booking.memberCount} Guests</div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(booking.eventDate), 'PPP')} | {booking.eventTimeSlot.replace(/_/g, ' ')}
                      </div>
                    </div>
                    <div className="text-left sm:text-right flex flex-col justify-between">
                      <div>
                         <div className="text-xs text-muted-foreground">Balance Due</div>
                         <div className="font-bold text-destructive">{formatINR(Number(booking.balanceAmount || 0))}</div>
                      </div>
                      <Link href={`/booking/${booking.bookingCode}`} className="text-sm text-primary hover:underline flex items-center gap-1 mt-2">
                        View Receipt <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
