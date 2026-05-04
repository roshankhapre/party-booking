import Link from "next/link"
import { Calendar, LayoutDashboard, Package, Settings } from "lucide-react"
import { LogoutButton } from "@/components/admin/logout-button"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const navItems = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Bookings", href: "/admin/bookings", icon: Calendar },
    { name: "Packages", href: "/admin/packages", icon: Package },
    { name: "Settings", href: "/admin/settings", icon: Settings },
  ]

  return (
    <div className="flex min-h-screen bg-muted/40 flex-col md:flex-row">
      <aside className="w-full md:w-64 bg-card border-r flex flex-col">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-primary">Antigravity</h2>
          <p className="text-sm text-muted-foreground">Manager Portal</p>
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