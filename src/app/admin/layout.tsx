import Link from 'next/link'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-60 bg-gray-900 text-white flex flex-col flex-shrink-0">
        <div className="p-5 border-b border-gray-700">
          <div className="font-bold text-lg">Darshan Cafe</div>
          <div className="text-gray-400 text-xs mt-1">Manager Portal</div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {[
            { href: '/admin', label: '📊 Dashboard' },
            { href: '/admin/bookings', label: '📋 Bookings' },
            { href: '/admin/calendar', label: '📅 Calendar' },
            { href: '/admin/packages', label: '📦 Packages' },
            { href: '/admin/settings', label: '⚙️ Settings' },
          ].map(item => (
            <Link key={item.href} href={item.href}
              className="flex items-center px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors text-sm">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-700 space-y-1">
          <Link href="/" target="_blank"
            className="flex items-center px-3 py-2 rounded-lg text-gray-400 hover:bg-gray-800 text-sm transition-colors">
            🌐 View Website
          </Link>
          <a href="/api/auth/signout"
            className="flex items-center px-3 py-2 rounded-lg text-red-400 hover:bg-gray-800 text-sm transition-colors">
            🚪 Sign Out
          </a>
        </div>
      </aside>
      <main className="flex-1 bg-gray-50 overflow-auto">
        {children}
      </main>
    </div>
  )
}