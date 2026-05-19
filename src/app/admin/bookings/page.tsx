"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { format, isToday } from "date-fns"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Eye, Download, CheckCircle, Ban } from "lucide-react"
import { toast } from "@/hooks/use-toast"

export default function BookingsListPage() {
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState("ALL")
  const [searchQuery, setSearchQuery] = useState("")
  const [dateRange, setDateRange] = useState("ALL")
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const fetchBookings = async () => {
    setLoading(true)
    const url = filterStatus !== "ALL" ? `/api/bookings?status=${filterStatus}` : "/api/bookings"
    const res = await fetch(url)
    const data = await res.json()
    setBookings(data.bookings || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchBookings()
  }, [filterStatus])

  const handleUpdateStatus = async (id: string, status: string) => {
    if (status === 'CANCELLED' && !window.confirm("Are you sure you want to cancel this booking?")) return;
    
    setUpdatingId(id)
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      if (res.ok) {
        toast({ title: `Booking ${status}` })
        fetchBookings()
      } else {
        toast({ title: "Failed to update", variant: "destructive" })
      }
    } catch {
      toast({ title: "Error", variant: "destructive" })
    }
    setUpdatingId(null)
  }

  const exportCSV = () => {
    if (bookings.length === 0) return;
    const headers = ["Booking Code", "Customer Name", "Phone", "Date", "Time Slot", "Type", "Guests", "Status"]
    const rows = filteredBookings.map(b => [
      b.bookingCode, b.customerName, b.customerPhone, format(new Date(b.eventDate), 'yyyy-MM-dd'),
      b.eventTimeSlot, b.partyType, b.memberCount, b.status
    ])
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n")
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.setAttribute("download", `bookings_export_${new Date().getTime()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const filteredBookings = bookings.filter(b => {
    const matchesSearch = b.customerName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          b.bookingCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          b.customerPhone.includes(searchQuery)
                          
    let matchesDate = true
    if (dateRange === 'TODAY') {
      matchesDate = isToday(new Date(b.eventDate))
    } else if (dateRange === 'UPCOMING') {
      matchesDate = new Date(b.eventDate) >= new Date()
    } else if (dateRange === 'PAST') {
      matchesDate = new Date(b.eventDate) < new Date() && !isToday(new Date(b.eventDate))
    }
    
    return matchesSearch && matchesDate
  })

  return (
    <div className="p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bookings</h1>
          <p className="text-muted-foreground">Manage all your party reservations.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCSV}><Download className="w-4 h-4 mr-2" /> Export CSV</Button>
          <Button asChild><Link href="/admin/bookings/new">Add New Booking</Link></Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6 bg-card p-4 rounded-xl border">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by name, code or phone..." 
            className="pl-9"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Status</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="CONFIRMED">Confirmed</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Date Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Dates</SelectItem>
            <SelectItem value="TODAY">Today</SelectItem>
            <SelectItem value="UPCOMING">Upcoming</SelectItem>
            <SelectItem value="PAST">Past</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-xl bg-card overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Booking Code</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Event Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : filteredBookings.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No bookings found</TableCell></TableRow>
            ) : (
              filteredBookings.map((booking) => {
                const isBookingToday = isToday(new Date(booking.eventDate))
                return (
                  <TableRow key={booking.id} className={isBookingToday ? "bg-yellow-500/10 border-l-4 border-l-yellow-500" : ""}>
                    <TableCell className="font-medium">{booking.bookingCode}</TableCell>
                    <TableCell>
                      <div>{booking.customerName}</div>
                      <div className="text-xs text-muted-foreground">{booking.customerPhone}</div>
                    </TableCell>
                    <TableCell>
                      <div>{format(new Date(booking.eventDate), 'MMM dd, yyyy')}</div>
                      <div className="text-xs text-muted-foreground">{booking.eventTimeSlot.replace(/_/g, ' ')}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-primary/5">{booking.partyType.replace(/_/g, ' ')}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        booking.status === 'CONFIRMED' ? 'default' : 
                        booking.status === 'COMPLETED' ? 'secondary' : 
                        booking.status === 'CANCELLED' ? 'destructive' : 'outline'
                      }>
                        {booking.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right flex justify-end gap-2">
                      {booking.status === 'CONFIRMED' && (
                         <Button variant="outline" size="icon" title="Mark Completed" onClick={() => handleUpdateStatus(booking.id, 'COMPLETED')} disabled={updatingId === booking.id}>
                           <CheckCircle className="w-4 h-4 text-green-500" />
                         </Button>
                      )}
                      {booking.status !== 'CANCELLED' && booking.status !== 'COMPLETED' && (
                         <Button variant="outline" size="icon" title="Cancel Booking" onClick={() => handleUpdateStatus(booking.id, 'CANCELLED')} disabled={updatingId === booking.id}>
                           <Ban className="w-4 h-4 text-red-500" />
                         </Button>
                      )}
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/admin/bookings/${booking.id}`}>
                          <Eye className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
