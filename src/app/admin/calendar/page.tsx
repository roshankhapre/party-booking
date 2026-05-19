"use client"

import { useState, useEffect } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchBookings() {
      setLoading(true)
      const res = await fetch('/api/bookings')
      const data = await res.json()
      setBookings(data.bookings || [])
      setLoading(false)
    }
    fetchBookings()
  }, [])

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1))
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1))

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart)
  const endDate = endOfWeek(monthEnd)

  const dateRange = eachDayOfInterval({ start: startDate, end: endDate })

  const getBookingsForDate = (date: Date) => {
    return bookings.filter(b => isSameDay(new Date(b.eventDate), date) && b.status !== 'CANCELLED')
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Booking Calendar</h1>
          <p className="text-muted-foreground">View your monthly party schedule.</p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={prevMonth}><ChevronLeft className="w-4 h-4" /></Button>
          <h2 className="text-xl font-bold w-40 text-center">{format(currentDate, 'MMMM yyyy')}</h2>
          <Button variant="outline" size="icon" onClick={nextMonth}><ChevronRight className="w-4 h-4" /></Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="grid grid-cols-7 border-b">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-4 text-center font-semibold text-sm text-muted-foreground border-r last:border-r-0">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {dateRange.map((day, i) => {
              const dayBookings = getBookingsForDate(day)
              const isCurrentMonth = day.getMonth() === currentDate.getMonth()
              return (
                <div 
                  key={day.toISOString()} 
                  className={`min-h-[120px] p-2 border-b border-r last:border-r-0 ${!isCurrentMonth ? 'bg-muted/30 text-muted-foreground' : ''} ${isToday(day) ? 'bg-yellow-500/5' : ''}`}
                  style={i % 7 === 6 ? { borderRight: 'none' } : {}}
                >
                  <div className={`text-right text-sm mb-2 ${isToday(day) ? 'font-bold text-yellow-600' : ''}`}>
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-1">
                    {dayBookings.map(b => (
                      <Link href={`/admin/bookings/${b.id}`} key={b.id} className="block">
                        <div className={`text-xs p-1 px-2 rounded truncate border ${
                          b.status === 'CONFIRMED' ? 'bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-400' :
                          b.status === 'COMPLETED' ? 'bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-400' :
                          'bg-yellow-500/10 border-yellow-500/20 text-yellow-700 dark:text-yellow-400'
                        }`}>
                          {b.eventTimeSlot.split('_')[0]} - {b.customerName}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
