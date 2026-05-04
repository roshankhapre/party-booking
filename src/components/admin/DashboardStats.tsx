"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatINR } from "@/lib/utils"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from "recharts"
import { CalendarDays, WalletCards, CalendarClock, PartyPopper } from "lucide-react"

export function DashboardStats() {
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    async function loadStats() {
      const res = await fetch("/api/admin/dashboard")
      const result = await res.json()
      setData(result)
    }
    loadStats()
  }, [])

  if (!data) return <div>Loading dashboard...</div>

  return (
    <div className="space-y-8">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue (Month)</CardTitle>
            <WalletCards className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatINR(data?.stats?.totalEarningsMonth ?? 0)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bookings (Month)</CardTitle>
            <PartyPopper className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{data?.stats?.totalBookingsMonth ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Today</CardTitle>
            <CalendarClock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.stats?.upcomingToday ?? 0} events</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Tomorrow</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.stats?.upcomingTomorrow ?? 0} events</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Party Types This Month</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
             {data.chartData?.length > 0 ? (
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={data.chartData}>
                   <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                   <YAxis fontSize={12} tickLine={false} axisLine={false} />
                   <Tooltip cursor={{fill: 'transparent'}} />
                   <Bar dataKey="value" fill="currentColor" radius={[4, 4, 0, 0]} className="fill-primary" />
                 </BarChart>
               </ResponsiveContainer>
             ) : <div className="flex h-full items-center justify-center text-muted-foreground text-sm">No data yet</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent Revenue Trend</CardTitle>
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
      </div>
    </div>
  )
}
