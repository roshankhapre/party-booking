"use client"

import Link from "next/link"
import { Calendar, LayoutDashboard, Package, Settings, ExternalLink, Bell } from "lucide-react"
import { LogoutButton } from "@/components/admin/logout-button"
import { useEffect, useState } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    async function loadNotifications() {
      try {
        const res = await fetch("/api/admin/dashboard")
        const data = await res.json()
        
        const newNotifs = []
        if (data.stats?.pendingConfirmations > 0) {
          newNotifs.push({ id: 'pending', title: 'Pending Confirmations', message: `You have ${data.stats.pendingConfirmations} bookings waiting for confirmation.` })
        }
        if (data.stats?.upcomingToday > 0) {
          newNotifs.push({ id: 'today', title: 'Events Today', message: `You have ${data.stats.upcomingToday} events scheduled for today.` })
        }
        
        setNotifications(newNotifs)
        
        // Check localStorage to see if user has seen these
        const lastSeen = localStorage.getItem('last_seen_notifs')
        if (lastSeen !== JSON.stringify(newNotifs.map(n => n.id))) {
          setUnreadCount(newNotifs.length)
        }
      } catch (err) {}
    }
    loadNotifications()
  }, [])

  const markAsRead = () => {
    setUnreadCount(0)
    localStorage.setItem('last_seen_notifs', JSON.stringify(notifications.map(n => n.id)))
  }

  const navItems = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Bookings", href: "/admin/bookings", icon: Calendar },
    { name: "Calendar", href: "/admin/calendar", icon: Calendar },
    { name: "Packages", href: "/admin/packages", icon: Package },
    { name: "Settings", href: "/admin/settings", icon: Settings },
  ]

  return (
    <div className="flex min-h-screen bg-muted/40 flex-col md:flex-row">
      <aside className="w-full md:w-64 bg-card border-r flex flex-col">
        <div className="p-6 flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-primary">Antigravity</h2>
            <p className="text-sm text-muted-foreground">Manager Portal</p>
          </div>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative" onClick={markAsRead}>
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="start">
               <div className="p-4 border-b font-semibold bg-muted/30">Notifications</div>
               <div className="max-h-80 overflow-auto">
                 {notifications.length === 0 ? (
                   <div className="p-4 text-sm text-center text-muted-foreground">No new notifications</div>
                 ) : (
                   notifications.map(n => (
                     <div key={n.id} className="p-4 border-b last:border-0 hover:bg-muted/50 transition">
                       <div className="font-semibold text-sm">{n.title}</div>
                       <div className="text-xs text-muted-foreground mt-1">{n.message}</div>
                     </div>
                   ))
                 )}
               </div>
            </PopoverContent>
          </Popover>
        </div>
        
        <nav className="flex-1 px-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted font-medium transition-colors"
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          ))}
          <div className="pt-4 mt-4 border-t px-2">
            <Link
              href="/"
              target="_blank"
              className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted text-muted-foreground font-medium transition-colors"
            >
              <ExternalLink className="w-5 h-5" />
              View Website
            </Link>
          </div>
        </nav>
        <div className="p-4 border-t">
          <LogoutButton />
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}