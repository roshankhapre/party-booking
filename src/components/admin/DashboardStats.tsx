"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatINR } from "@/lib/utils"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from "recharts"
import { CalendarDays, WalletCards, PartyPopper, Clock, ExternalLink } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#a28bd4', '#f47a9e', '#8884d8'];

export function DashboardStats() {
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    async function loadStats() {
      const res = await fetch("/api/admin/dashboard", { cache: 'no-store' })
      const result = await res.json()
      setData(result)
    }
    loadStats()
  }, [])

  if (!data) return <div>Loading dashboard...</div>

  return (
    <div className="space-y-8">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-3 md:p-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue (30 Days)</CardTitle>
            <WalletCards className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-3xl font-bold">{formatINR(data?.stats?.totalEarningsMonth ?? 0)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <PartyPopper className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-3xl font-bold">+{data?.stats?.totalBookingsMonth ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Today</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-3xl font-bold text-yellow-600">{data?.stats?.upcomingToday ?? 0} events</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Confirmations</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-3xl font-bold text-red-500">{data?.stats?.pendingConfirmations ?? 0} requests</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
             {data.revenueTrend?.length > 0 ? (
               <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={data.revenueTrend}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} />
                   <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                   <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val}`} />
                   <Tooltip labelClassName="text-black" />
                   <Line type="monotone" dataKey="amount" stroke="currentColor" strokeWidth={2} className="stroke-primary" dot={{r:4}} />
                 </LineChart>
               </ResponsiveContainer>
             ) : <div className="flex h-full items-center justify-center text-muted-foreground text-sm">No data yet</div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bookings by Party Type</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
             {data.chartData?.length > 0 ? (
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                   <Pie
                     data={data.chartData}
                     cx="50%"
                     cy="50%"
                     innerRadius={60}
                     outerRadius={80}
                     paddingAngle={5}
                     dataKey="value"
                   >
                     {data.chartData.map((entry: any, index: number) => (
                       <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                     ))}
                   </Pie>
                   <Tooltip />
                 </PieChart>
               </ResponsiveContainer>
             ) : <div className="flex h-full items-center justify-center text-muted-foreground text-sm">No data yet</div>}
             <div className="flex flex-wrap justify-center gap-2 mt-2">
               {data.chartData?.map((entry: any, index: number) => (
                 <div key={entry.name} className="flex items-center text-xs">
                   <div className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                   {entry.name.replace(/_/g, ' ')}
                 </div>
               ))}
             </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Today's Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            {data.todaySchedule?.length > 0 ? (
              <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                {data.todaySchedule.map((b: any) => (
                  <div key={b.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-300 group-[.is-active]:bg-primary text-slate-500 group-[.is-active]:text-primary-foreground shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-card border p-4 rounded shadow">
                      <div className="flex justify-between mb-1">
                        <div className="font-bold text-primary">{b.eventTimeSlot.replace(/_/g, ' ')}</div>
                        <Badge variant="outline">{b.partyType.replace(/_/g, ' ')}</Badge>
                      </div>
                      <div className="font-semibold">{b.customerName} - {b.memberCount} Guests</div>
                      <Link href={`/admin/bookings/${b.id}`} className="text-sm text-blue-500 hover:underline mt-2 inline-block">View Details</Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-6 text-muted-foreground">No events scheduled for today.</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="space-y-4">
              {data.recentBookings?.length > 0 ? data.recentBookings.map((b: any) => (
                <div key={b.id} className="flex justify-between items-center p-3 border rounded hover:bg-muted/50 transition">
                  <div>
                    <div className="font-semibold">{b.customerName}</div>
                    <div className="text-xs text-muted-foreground">{new Date(b.eventDate).toLocaleDateString()} | {b.partyType.replace(/_/g, ' ')}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={b.status === 'PENDING' ? 'secondary' : b.status === 'CONFIRMED' ? 'default' : 'outline'}>{b.status}</Badge>
                    <Link href={`/admin/bookings/${b.id}`}><ExternalLink className="w-4 h-4 text-muted-foreground hover:text-primary" /></Link>
                  </div>
                </div>
              )) : (
                <div className="text-center p-6 text-muted-foreground">No recent bookings.</div>
              )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  )
}
